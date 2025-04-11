// src/functions/index.js
const functions = require("firebase-functions");
// const admin = require("firebase-admin"); // Keep commented out if unused
const axios = require("axios");
const cors = require("cors")({origin: true});

// Initialize admin SDK if needed (e.g., for Firestore access FROM the function)
// admin.initializeApp();

// Load API Keys Securely from Firebase Environment
// You MUST set these using:
// `firebase functions:config:set openai.key="YOUR_KEY"`
// `firebase functions:config:set fireworks.key="YOUR_KEY"`
const openaiApiKey = functions.config().openai &&
  functions.config().openai.key ? functions.config().openai.key : null;
const fireworksApiKey = functions.config().fireworks &&
  functions.config().fireworks.key ? functions.config().fireworks.key : null;

/**
 * processPTERequest Cloud Function Logic
 * Handles the actual request processing after CORS and method checks.
 * @param {object} request - The HTTP request object.
 * @param {object} response - The HTTP response object.
 */
const processPTERequestLogic = async (request, response) => {
  // Note: The CORS wrapper is applied before this logic is called.
  // Note: The method check (POST) is applied before this logic is called.
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
      functions.logger.error("Validation Failed: Missing required fields.", {
        body: requestBody,
      });
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
        apiHeaders = {
          "Authorization": apiKey,
          "Content-Type": "application/json",
        };
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
        apiHeaders = {
          "Authorization": apiKey,
          "Content-Type": "application/json",
        };
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
          const errMsg = "OpenAI API key not configured for image generation.";
          throw new Error(errMsg);
        }
        apiUrl = "https://api.openai.com/v1/images/generations";
        apiKey = `Bearer ${openaiApiKey}`;
        apiHeaders = {
          "Authorization": apiKey,
          "Content-Type": "application/json",
        };
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
        return response.status(400)
            .json({error: "Invalid targetApi specified"});
    }

    // Make the External API Call (Non-Streaming)
    functions.logger.info(`Calling ${targetApi} (${model}) at ${apiUrl}...`);
    const apiResponse = await axios.post(apiUrl, requestPayload, {
      headers: apiHeaders,
      timeout: 110000, // Slightly less than function timeout (120s)
    });
    functions.logger.info(
        `${targetApi} call successful. Status: ${apiResponse.status}`,
    );

    // Return the complete response from the external API
    response.status(200).json(apiResponse.data);
  } catch (error) {
    // Handle Errors Gracefully
    let statusCode = 500;
    let errorMessage = "An internal server error occurred.";
    // Commented out to fix unused var, re-enable if needed for debugging
    // let errorDetails = {};

    if (axios.isAxiosError(error)) {
      // Broke log object onto multiple lines for max-len
      functions.logger.error("Axios Error calling external API:", {
        message: error.message,
        url: error.config?.url, // Optional chaining is fine now
        status: error.response?.status,
        // Log the actual error from OpenAI/Fireworks
        data: error.response?.data,
      });
      statusCode = error.response?.status || 502; // Use API's status or 502
      // Break assignment for max-len
      const respDataError = error.response?.data?.error?.message;
      errorMessage = respDataError || `External API Error (${statusCode})`;
      // errorDetails = error.response?.data || {}; // Unused var commented
    } else {
      functions.logger.error("Generic Error in Cloud Function:", {
        message: error.message,
        stack: error.stack, // Log stack trace for internal errors
      });
      // Break assignment for max-len
      errorMessage = error.message ||
        "Internal Server Error in Cloud Function";
      // errorDetails = {message: error.message}; // Unused var commented
    }

    // Send error back to the client
    response.status(statusCode).json({
      error: errorMessage,
      // details: errorDetails // Maybe remove details in production
    });
  }
};

/**
 * Export the function, applying runtime options, CORS, and method checks
 * before passing the request to the main logic function.
 */
exports.processPTERequest = functions.https.onRequest((request, response) => {
  // Apply CORS middleware first
  cors(request, response, () => {
    // Then check the method
    if (request.method !== "POST") {
      functions.logger.warn("Method Not Allowed:", request.method);
      response.status(405).json({error: "Method Not Allowed"});
      return; // Stop processing if method is wrong
    }
    // If CORS and method are okay, call the main async logic
    // Note: Runtime options like timeout/memory are NOT set here in V1 style.
    // They would default or need separate configuration if this works.
    processPTERequestLogic(request, response);
  });
});


// Ensure final newline exists after this line in your file
