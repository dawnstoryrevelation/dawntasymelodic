// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({origin: true});

// Initialize admin SDK if needed (e.g., for Firestore access FROM the function)
// admin.initializeApp();

// Load API Keys Securely from Firebase Environment
// You MUST set these using `firebase functions:config:set openai.key="YOUR_KEY"`
const openaiApiKey = functions.config().openai && functions.config().openai.key ? functions.config().openai.key : null;
const fireworksApiKey = functions.config().fireworks && functions.config().fireworks.key ? functions.config().fireworks.key : null;

/**
 * processPTERequest Cloud Function
 * Acts as a secure relay to external AI APIs (OpenAI, Fireworks).
 * @param {object} request - The HTTP request object
 * @param {object} response - The HTTP response object
 */
exports.processPTERequest = functions.runWith({
  timeoutSeconds: 120, // Increased timeout for potentially long API calls
  memory: "512MB", // Increased memory
}).https.onRequest((request, response) => {
  // Enable CORS for all origins or restrict to your domain in production
  cors(request, response, async () => {
    // Only allow POST requests
    if (request.method !== "POST") {
      functions.logger.warn("Method Not Allowed:", request.method);
      return response.status(405).json({error: "Method Not Allowed"});
    }

    try {
      // Parse Request Body
      const requestBody = request.body; // Firebase Functions auto-parses JSON
      functions.logger.info("Received PTE Request:", {body: requestBody});

      const {
        prompt,
        conversationHistory = [], // Ensure it defaults to an empty array
        targetApi,
        model,
        systemPrompt = "You are a helpful assistant.", // Default system prompt
        maxTokens = 2000,
        temperature = 0.7,
      } = requestBody;

      // Validate Core Inputs
      if (!prompt || !targetApi || !model) {
        functions.logger.error("Validation Failed: Missing required fields.",
            {body: requestBody});
        return response.status(400).json({
          error: "Missing required fields: prompt, targetApi, model",
        });
      }

      // Ensure conversationHistory has the correct format (role, content)
      const validHistory = conversationHistory
          .filter((msg) => msg && typeof msg.role === "string" &&
              typeof msg.content === "string")
          .map((msg) => ({role: msg.role, content: msg.content}));

      let apiUrl;
      let apiKey;
      let requestPayload;
      let apiHeaders;

      // Prepare API Call Details based on targetApi
      switch (targetApi) {
        case "openai":
          if (!openaiApiKey) {
            throw new Error("OpenAI API key not configured in environment.");
          }
          apiUrl = "https://api.openai.com/v1/chat/completions";
          apiKey = `Bearer ${openaiApiKey}`;
          apiHeaders = {"Authorization": apiKey, "Content-Type": "application/json"};
          requestPayload = {
            model: model,
            messages: [
              {role: "system", content: systemPrompt},
              ...validHistory,
              {role: "user", content: prompt},
            ],
            max_tokens: maxTokens,
            temperature: temperature,
            stream: false, // Force non-streaming for Step 1
          };
          break;

        case "fireworks":
          if (!fireworksApiKey) {
            throw new Error("Fireworks API key not configured in environment.");
          }
          apiUrl = "https://api.fireworks.ai/inference/v1/chat/completions";
          apiKey = `Bearer ${fireworksApiKey}`;
          apiHeaders = {"Authorization": apiKey, "Content-Type": "application/json"};
          requestPayload = {
            model: model,
            messages: [
              {role: "system", content: systemPrompt},
              ...validHistory,
              {role: "user", content: prompt},
            ],
            max_tokens: maxTokens,
            temperature: temperature,
            stream: false, // Force non-streaming for Step 1
          };
          break;

        case "openai-image":
          if (!openaiApiKey) {
            throw new Error("OpenAI API key not configured for image generation.");
          }
          apiUrl = "https://api.openai.com/v1/images/generations";
          apiKey = `Bearer ${openaiApiKey}`;
          apiHeaders = {"Authorization": apiKey, "Content-Type": "application/json"};
          requestPayload = {
            model: model, // e.g., "dall-e-3"
            prompt: prompt,
            n: 1,
            size: "1024x1024", // Adjust as needed
            quality: "standard",
            style: "vivid",
          };
          break;

        default:
          functions.logger.error("Invalid targetApi:", targetApi);
          return response.status(400).json({error: "Invalid targetApi specified"});
      }

      // Make the External API Call (Non-Streaming)
      functions.logger.info(`Calling ${targetApi} (${model}) at ${apiUrl}...`);
      const apiResponse = await axios.post(apiUrl, requestPayload, {
        headers: apiHeaders,
        timeout: 110000, // Slightly less than function timeout (120s)
      });
      functions.logger.info(`${targetApi} call successful. Status: ${apiResponse.status}`);

      // Return the complete response from the external API
      response.status(200).json(apiResponse.data);
    } catch (error) {
      // Handle Errors Gracefully
      let statusCode = 500;
      let errorMessage = "An internal server error occurred.";
      let errorDetails = {};

      if (axios.isAxiosError(error)) {
        functions.logger.error("Axios Error calling external API:", {
          message: error.message,
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data, // Log the actual error from OpenAI/Fireworks
        });
        statusCode = error.response?.status || 502; // Use API's status code or 502
        errorMessage = error.response?.data?.error?.message ||
            `External API Error (${statusCode})`;
        errorDetails = error.response?.data || {};
      } else {
        functions.logger.error("Generic Error in Cloud Function:", {
          message: error.message,
          stack: error.stack, // Log stack trace for internal errors
        });
        errorMessage = error.message || "Internal Server Error in Cloud Function";
        errorDetails = {message: error.message};
      }

      // Send error back to the client
      response.status(statusCode).json({
        error: errorMessage,
        // details: errorDetails // Maybe remove details in production for security
      });
    }
  });
});