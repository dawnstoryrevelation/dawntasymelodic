// --- File: functions/index.js (or your main functions file) ---

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios"); // For making HTTP requests

// Initialize Firebase Admin SDK (if not already done elsewhere)
// Ensure you have service account credentials configured for your environment
// See: https://firebase.google.com/docs/functions/beta/setup-admin-sdk
try {
  if (admin.apps.length === 0) {
     admin.initializeApp();
  }
} catch (e) {
   console.error("Firebase Admin SDK initialization error:", e);
}


// --- Define the URL for your AEON Server ---
// IMPORTANT: For local testing, use http://127.0.0.1:PORT (ensure AEON server runs on this port)
//            For deployment, replace this with the actual URL of your deployed AEON server (e.g., Cloud Run URL)
const AEON_SERVER_URL = "http://127.0.0.1:5175"; // <<< CHANGE PORT IF NEEDED

// --- NEW Firebase Callable Function ---
exports.processAiRequest = functions.https.onCall(async (data, context) => {
  // Optional: Check user authentication
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  // }
  // const uid = context.auth.uid; // Get user ID if needed

  // 1. Validate Input Data
  if (!data || !data.task || !data.payload) {
    console.error("Invalid request structure:", data);
    throw new functions.https.HttpsError('invalid-argument', 'Request must include "task" and "payload".');
  }

  const task = data.task;
  const payload = data.payload;
  console.log(`Received task: ${task}`); // Log received task

  // 2. Decide which backend to call (AEON or OpenAI Fallback)
  //    **STRATEGY:** Use AEON only for specific blueprints, OpenAI for others during transition.
  let blueprintToExecute = null;

  // --- EXAMPLE LOGIC: Route specific tasks to AEON ---
  if (task === "simple_uppercase_task") { // Define a specific task name
      blueprintToExecute = "simple_uppercase_blueprint"; // Map task to AEON blueprint name
      // We expect payload.text_to_convert for this specific task
      if (!payload || typeof payload.text_to_convert !== 'string') {
          throw new functions.https.HttpsError('invalid-argument', 'Payload for simple_uppercase_task requires "text_to_convert" string.');
      }
  }
  // --- Add more 'else if (task === ...)' blocks here to route other tasks to specific AEON blueprints ---
  // Example:
  // else if (task === "chat_completion") {
  //    // Decide if AEON should handle this chat yet based on modes or content?
  //    // For now, let's assume chat goes to OpenAI fallback
  // }
  // --- End AEON Routing Logic ---


  // 3. Call the chosen backend
  try {
      if (blueprintToExecute) {
          // --- Call AEON Server ---
          console.log(`Calling AEON server for blueprint: ${blueprintToExecute}`);
          const aeonEndpoint = `${AEON_SERVER_URL}/execute/${blueprintToExecute}`;

          // Prepare input for AEON blueprint
          const aeonInput = {
              initial_input: payload // Pass the entire payload as initial_input for flexibility
                                      // Or structure specifically: { text_to_convert: payload.text_to_convert }
          };

          const response = await axios.post(aeonEndpoint, aeonInput, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 20000 // 20 seconds timeout (adjust as needed)
          });

          // Check AEON server response
          if (response.data && response.data.success) {
              console.log("AEON execution successful.");
              // Return success and the result from AEON
              return { success: true, result: response.data.result };
          } else {
              // AEON server reported an error
              console.error("AEON server reported an execution error:", response.data);
              throw new functions.https.HttpsError('internal', 'AEON execution failed.', response.data);
          }
      } else {
          // --- Call OpenAI API (Fallback/Existing Logic) ---
          // IMPORTANT: Securely get your OpenAI API key. DO NOT HARDCODE IT.
          // Use Firebase Functions environment configuration (Secrets):
          // https://firebase.google.com/docs/functions/config-env
          // Example: functions.config().openai.key
          const openAIApiKey = functions.config().openai?.key; // Use optional chaining
          if (!openAIApiKey) {
              console.error("OpenAI API key is not configured in Firebase Function secrets.");
              throw new functions.https.HttpsError('internal', 'AI Service API key not configured.');
          }

          console.log(`Falling back to OpenAI for task: ${task}`);
          // --- Re-implement your specific OpenAI call logic here ---
          // This will depend heavily on the 'task' and 'payload'
          // Example for a chat completion task:
          if (task === "chat_completion") {
              const { OpenAI } = require("openai"); // Use OpenAI Node.js library
              const openai = new OpenAI({ apiKey: openAIApiKey });

              const messages = payload.history || [];
              messages.push({ role: "user", content: payload.current_prompt });

              const chatCompletion = await openai.chat.completions.create({
                  model: "gpt-4o-mini", // Or your preferred model
                  messages: [
                     { role: "system", content: payload.system_prompt || "You are a helpful assistant." },
                     ...messages
                  ],
                  // Add other parameters like temperature, max_tokens if needed
              });

              const result = chatCompletion.choices[0]?.message?.content;
              if (!result) throw new Error("No content received from OpenAI chat completion.");
              console.log("OpenAI chat completion successful.");
              return { success: true, result: { content: result } }; // Structure the result

          } else if (task === "image_generation") {
               const { OpenAI } = require("openai");
               const openai = new OpenAI({ apiKey: openAIApiKey });
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
               return { success: true, result: { imageUrl: imageUrl, revisedPrompt: revisedPrompt } };

          } // --- Add handlers for other tasks (audio, mindmap) similarly ---

          else {
              console.error(`Unsupported task type for OpenAI fallback: ${task}`);
              throw new functions.https.HttpsError('invalid-argument', `Task '${task}' is not supported.`);
          }
          // --- End of OpenAI call logic ---
      }
  } catch (error) {
      console.error(`Error processing task ${task}:`, error.message);
      // Handle specific errors (network, API keys, AEON server down)
      if (error.code === 'ECONNREFUSED' || error.message.includes('Could not reach AEON server')) {
           throw new functions.https.HttpsError('unavailable', 'The AEON processing service is currently unavailable.');
      } else if (error.isAxiosError && error.response) {
           // Error response from AEON server
           console.error("AEON Server Error Response:", error.response.data);
           throw new functions.https.HttpsError('internal', 'AEON server request failed.', error.response.data);
      } else if (error.message.includes("API key not configured")) {
          throw error; // Re-throw specific configuration error
      } else if (error instanceof functions.https.HttpsError) {
           throw error; // Re-throw HttpsError from deeper logic
      } else {
           // Generic internal error
           throw new functions.https.HttpsError('internal', `Failed to process request: ${error.message}`);
      }
  }
}); // --- End of processAiRequest Function ---