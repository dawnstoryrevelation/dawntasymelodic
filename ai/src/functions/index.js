// --- CORRECTED & LINTED File: functions/index.js ---

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors");

// Initialize Firebase Admin SDK
try {
  if (admin.apps.length === 0) {
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized.");
  }
} catch (e) {
  console.error("Firebase Admin SDK initialization error:", e);
}

// Define AEON server URL - will need to be updated for production
const AEON_SERVER_URL = "http://127.0.0.1:5175";

// THIS IS CRITICAL: Explicitly configure CORS with all allowed origins
const corsHandler = cors({
  origin: ["http://localhost:5173", "https://dawntasyai.web.app", "https://dawntasyai.firebaseapp.com"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400 // 24 hours
});

// Create a standalone Express middleware for CORS
exports.processAiRequest = functions.https.onRequest((request, response) => {
  // Apply CORS headers first - this is critical
  response.set("Access-Control-Allow-Origin", "http://localhost:5173");
  response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.set("Access-Control-Max-Age", "86400");
  
  // Handle preflight OPTIONS request immediately
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }
  
  // Apply full CORS middleware for non-OPTIONS requests
  corsHandler(request, response, async () => {
    try {
      // For non-POST requests, return method not allowed
      if (request.method !== "POST") {
        return response.status(405).json({
          success: false,
          error: "Method not allowed"
        });
      }

      // Process the main request
      const data = request.body;
      console.log("Function received data:", JSON.stringify(data).substring(0, 200) + "...");

      if (!data || !data.task || !data.payload) {
        console.error("Invalid request structure received:", data);
        return response.status(400).json({
          success: false,
          error: "Request must include 'task' and 'payload'."
        });
      }

      const task = data.task;
      const payload = data.payload;
      console.log(`Processing task: ${task}`);

      let blueprintToExecute = null;
      let backendTarget = "openai";

      if (task === "simple_uppercase_task") {
        blueprintToExecute = "simple_uppercase_blueprint";
        backendTarget = "aeon";
        if (!payload || typeof payload.text_to_convert !== "string") {
          return response.status(400).json({
            success: false,
            error: "Payload for simple_uppercase_task requires 'text_to_convert' string."
          });
        }
        console.log(`Routing to AEON. Blueprint: ${blueprintToExecute}`);
      } else {
        console.log(`Task "${task}" not routed to AEON, falling back to OpenAI.`);
      }

      try {
        if (backendTarget === "aeon" && blueprintToExecute) {
          console.log(`Calling AEON server for blueprint: ${blueprintToExecute}`);
          const aeonEndpoint = `${AEON_SERVER_URL}/execute/${blueprintToExecute}`;
          const aeonInput = {initial_input: payload};

          const aeonResponse = await axios.post(aeonEndpoint, aeonInput, {
            headers: {"Content-Type": "application/json"},
            timeout: 20000
          });

          if (aeonResponse.data && aeonResponse.data.success) {
            console.log("AEON execution successful.");
            return response.status(200).json({
              success: true,
              result: aeonResponse.data.result
            });
          } else {
            console.error("AEON server reported an execution error:", aeonResponse.data);
            const detail = aeonResponse.data?.error || aeonResponse.data?.details || "No details provided.";
            return response.status(500).json({
              success: false,
              error: `AEON execution failed: ${detail}`,
              details: aeonResponse.data
            });
          }
        } else if (backendTarget === "openai") {
          const openAIApiKey = functions.config().openai?.key;
          if (!openAIApiKey) {
            console.error("OpenAI API key is not configured in Firebase Function secrets.");
            return response.status(500).json({
              success: false,
              error: "AI Service API key not configured."
            });
          }
          console.log(`Calling OpenAI for task: ${task}`);
          const {OpenAI} = require("openai");
          const openai = new OpenAI({apiKey: openAIApiKey});

          if (task === "chat_completion") {
            const messages = payload.history || [];
            messages.push({role: "user", content: payload.current_prompt});
            const systemPrompt = payload.system_prompt || "You are a helpful assistant.";
            const chatCompletion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [{role: "system", content: systemPrompt}, ...messages]
            });
            const result = chatCompletion.choices[0]?.message?.content;
            if (!result) throw new Error("No content received from OpenAI chat completion.");
            console.log("OpenAI chat completion successful.");
            return response.status(200).json({
              success: true,
              result: {content: result}
            });
          } else if (task === "image_generation") {
            const imageResponse = await openai.images.generate({
              model: "dall-e-3",
              prompt: payload.prompt,
              n: 1,
              size: payload.size || "1024x1024",
              style: payload.style || "vivid"
            });
            const imageUrl = imageResponse.data[0]?.url;
            const revisedPrompt = imageResponse.data[0]?.revised_prompt;
            if (!imageUrl) throw new Error("No image URL received from OpenAI image generation.");
            console.log("OpenAI image generation successful.");
            return response.status(200).json({
              success: true,
              result: {imageUrl: imageUrl, revisedPrompt: revisedPrompt}
            });
          } else {
            console.error(`Unsupported task type for OpenAI fallback: ${task}`);
            return response.status(400).json({
              success: false,
              error: `Task '${task}' is not supported.`
            });
          }
        } else {
          console.error("Internal logic error: Invalid backend target or missing blueprint.");
          return response.status(500).json({
            success: false,
            error: "Internal routing error."
          });
        }
      } catch (error) {
        console.error(`Error processing task ${task}:`, error); // Log the whole error
        if (error.code === "ECONNREFUSED") {
          return response.status(503).json({
            success: false,
            error: "The AEON processing service is currently unavailable."
          });
        } else if (error.isAxiosError && error.response) {
          console.error("AEON Server Error Response:", error.response.data);
          return response.status(500).json({
            success: false,
            error: "AEON server request failed.",
            details: error.response.data
          });
        } else {
          // Convert other errors to appropriate response
          return response.status(500).json({
            success: false,
            error: `Failed to process request: ${error.message || "Unknown error"}`
          });
        }
      }
    } catch (finalError) {
      console.error("Unhandled exception in function:", finalError);
      response.status(500).json({
        success: false,
        error: "Internal server error",
        message: finalError.message
      });
    }
  });
});