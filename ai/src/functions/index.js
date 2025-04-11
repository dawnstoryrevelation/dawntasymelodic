const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors");

// Define the OpenAI API key as a secret
const openaiApiKeySecret = defineSecret("OPENAI_API_KEY");

// Initialize Firebase Admin SDK
try {
  if (admin.apps.length === 0) {
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized.");
  }
} catch (e) {
  console.error("Firebase Admin SDK initialization error:", e);
}

// --- Configure CORS ---
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(",") : []),
];
const corsHandler = cors({
  origin: (origin, callback) => {
    console.log("Received Origin:", origin); // Debug logging
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:5173")) {
      callback(null, true);
    } else {
      console.error(`CORS policy: Blocking origin ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

// --- Define AEON Server URL ---
const AEON_SERVER_URL = process.env.AEON_SERVER_URL || "http://127.0.0.1:5175"; // Fallback for local dev

// --- Cloud Function ---
exports.processAiRequest = onRequest({secrets: [openaiApiKeySecret]}, (request, response) => {
  // Apply CORS middleware
  corsHandler(request, response, async () => {
    // Handle actual request
    if (request.method !== "POST") {
      console.log(`Method not allowed: ${request.method}`);
      return response.status(405).json({success: false, error: "Method Not Allowed"});
    }

    const data = request.body;
    console.log("Function received data:", JSON.stringify(data).substring(0, 200) + "...");

    // Validate input data
    if (!data || !data.task || !data.payload) {
      console.error("Invalid request body structure:", data);
      return response.status(400).json({success: false, error: "Request body must include \"task\" and \"payload\"."});
    }

    const task = data.task;
    const payload = data.payload;
    console.log(`Processing task: ${task}`);

    // Decide backend & blueprint
    let blueprintToExecute = null;
    let backendTarget = "openai";

    if (task === "simple_uppercase_task") {
      blueprintToExecute = "simple_uppercase_blueprint";
      backendTarget = "aeon";
      if (!payload || typeof payload.text_to_convert !== "string") {
        return response.status(400).json({
          success: false,
          error: "Payload for simple_uppercase_task requires \"text_to_convert\" string.",
        });
      }
      console.log(`Routing to AEON. Blueprint: ${blueprintToExecute}`);
    } else {
      console.log(`Task "${task}" not routed to AEON, falling back to OpenAI.`);
    }

    // Call the chosen backend
    try {
      if (backendTarget === "aeon" && blueprintToExecute) {
        console.log(`Calling AEON server for blueprint: ${blueprintToExecute}`);
        const aeonEndpoint = `${AEON_SERVER_URL}/execute/${blueprintToExecute}`;
        const aeonInput = {initial_input: payload};

        try {
          const aeonResponse = await axios.post(aeonEndpoint, aeonInput, {
            headers: {"Content-Type": "application/json"},
            timeout: 20000,
          });

          if (aeonResponse.data && aeonResponse.data.success) {
            console.log("AEON execution successful.");
            return response.status(200).json({success: true, result: aeonResponse.data.result});
          } else {
            console.error("AEON server reported an execution error:", aeonResponse.data);
            const detail = aeonResponse.data?.error || aeonResponse.data?.details || "No details provided.";
            return response.status(500).json({
              success: false,
              error: `AEON execution failed: ${detail}`,
              details: aeonResponse.data,
            });
          }
        } catch (aeonError) {
          console.error("AEON request failed:", aeonError.message);
          return response.status(503).json({
            success: false,
            error: "AEON processing service is unavailable.",
            details: aeonError.message,
          });
        }
      } else if (backendTarget === "openai") {
        const openAIApiKey = process.env.OPENAI_API_KEY;
        if (!openAIApiKey) {
          console.error("OpenAI API key is not configured in environment variables.");
          return response.status(500).json({
            success: false,
            error: "OpenAI API key is missing. Please set OPENAI_API_KEY as a secret.",
          });
        }
        console.log(`Calling OpenAI for task: ${task}`);
        let OpenAI;
        try {
          OpenAI = require("openai").OpenAI;
        } catch (moduleError) {
          console.error("Failed to load OpenAI module:", moduleError);
          throw new Error("OpenAI module is not installed. Please add 'openai' to dependencies.");
        }
        const openai = new OpenAI({apiKey: openAIApiKey});

        if (task === "chat_completion") {
          const messages = payload.history || [];
          messages.push({role: "user", content: payload.current_prompt});
          const systemPrompt = payload.system_prompt || "You are a helpful assistant.";
          const chatCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{role: "system", content: systemPrompt}, ...messages],
          });
          const result = chatCompletion.choices[0]?.message?.content;
          if (!result) throw new Error("No content received from OpenAI chat completion.");
          console.log("OpenAI chat completion successful.");
          return response.status(200).json({success: true, result: {content: result}});
        } else if (task === "image_generation") {
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: payload.prompt,
            n: 1,
            size: payload.size || "1024x1024",
            style: payload.style || "vivid",
          });
          const imageUrl = imageResponse.data[0]?.url;
          const revisedPrompt = imageResponse.data[0]?.revised_prompt;
          if (!imageUrl) throw new Error("No image URL received from OpenAI image generation.");
          console.log("OpenAI image generation successful.");
          return response.status(200).json({
            success: true,
            result: {imageUrl: imageUrl, revisedPrompt: revisedPrompt},
          });
        } else {
          console.error(`Unsupported task type for OpenAI fallback: ${task}`);
          return response.status(400).json({success: false, error: `Task '${task}' is not supported.`});
        }
      } else {
        console.error("Internal logic error: Invalid backend target or missing blueprint.");
        return response.status(500).json({success: false, error: "Internal routing error."});
      }
    } catch (error) {
      console.error(`Error processing task ${task}:`, error);
      if (error.code === "ECONNREFUSED") {
        return response.status(503).json({
          success: false,
          error: "The AEON processing service is currently unavailable.",
        });
      } else if (error.isAxiosError && error.response) {
        console.error("AEON Server Error Response:", error.response.data);
        return response.status(500).json({
          success: false,
          error: "AEON server request failed.",
          details: error.response.data,
        });
      } else {
        return response.status(500).json({
          success: false,
          error: `Failed to process request: ${error.message || "Unknown error"}`,
        });
      }
    }
  });
});
