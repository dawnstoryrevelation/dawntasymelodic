// --- CORRECTED File: functions/index.js ---

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors"); // <<< Import the cors library

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
// Allow requests specifically from your local development origin
// IMPORTANT: For production, replace 'http://localhost:5173' with your deployed Vue app's domain(s)
// You can use an array for multiple origins: ['https://your-app.web.app', 'https://www.yourapp.com']
const corsHandler = cors({ origin: "http://localhost:5173" }); // <<< Configure allowed origin(s)

// --- Define AEON Server URL ---
const AEON_SERVER_URL = "http://127.0.0.1:5175"; // CHANGE LATER FOR DEPLOYMENT

// --- Modified Firebase Callable Function with CORS ---
exports.processAiRequest = functions.https.onCall(async (data, context) => {
  // --- OLD WAY (Direct handler) ---
  // const handler = async (data, context) => { ... your existing logic ... };
  // return handler(data, context);

  // --- NEW WAY (Using cors handler - for Callable Functions v1 this structure is tricky) ---
  // NOTE: For Callable Functions (onCall), Firebase *should* handle CORS automatically
  // IF you are calling it correctly using the Firebase Functions client SDK (httpsCallable).
  // The error suggests either the call isn't being made via the SDK correctly,
  // OR there's a stricter configuration somewhere, OR it's an HTTPS Request function mistaken for Callable.

  // --- Let's assume it *is* a Callable function and try debugging the call ---
  // The CORS error with onCall usually means the request isn't formatted correctly
  // by the client SDK or there's a network proxy interfering.
  // However, if it WERE an HTTPS Request function (onRequest), you WOULD need cors:

  /* --- Example IF IT WAS an onRequest function: ---
  exports.processAiRequestHttp = functions.https.onRequest((request, response) => {
      corsHandler(request, response, async () => {
          // Authentication check would be manual using request headers
          // ... validate request.body ...
          const task = request.body.data.task; // Callable functions wrap data
          const payload = request.body.data.payload;
          try {
              // ... Your AEON/OpenAI logic from before ...
              const result = await callBackendLogic(task, payload); // Extracted logic
              response.status(200).send({ data: { success: true, result: result } }); // Callable functions expect {data: ...}
          } catch (error) {
               console.error(`Error processing task ${task}:`, error);
               // Convert errors to the format expected by Callable client
               const httpsError = convertErrorToHttpsError(error);
               response.status(httpsError.httpErrorCode.status).send({ error: httpsError.toJSON() });
          }
      });
  });
  // Helper function to convert internal errors to HttpsError structure
  function convertErrorToHttpsError(error) {
      if (error instanceof functions.https.HttpsError) {
          return error;
      }
      // Default internal error
      return new functions.https.HttpsError('internal', error.message || 'An internal server error occurred.');
  }
  // Helper function containing the core AEON/OpenAI call logic
  async function callBackendLogic(task, payload) {
      // ... (Paste the logic from Step 3 of the previous response here) ...
      // Remember to return the result object, not the full {success: ..., result: ...}
  }
  */ // --- End onRequest example ---


  // --- BACK TO onCall - Let's focus on the core logic assuming SDK call is correct ---
  console.log("Function received data:", JSON.stringify(data).substring(0, 200) + "...");

  if (!data || !data.task || !data.payload) {
      console.error("Invalid request structure received:", data);
      throw new functions.https.HttpsError('invalid-argument', 'Request must include "task" and "payload".');
  }

  const task = data.task;
  const payload = data.payload;
  console.log(`Processing task: ${task}`);

  let blueprintToExecute = null;
  let backendTarget = "openai";

  if (task === "simple_uppercase_task") {
      blueprintToExecute = "simple_uppercase_blueprint";
      backendTarget = "aeon";
      if (!payload || typeof payload.text_to_convert !== 'string') {
          throw new functions.https.HttpsError('invalid-argument', 'Payload for simple_uppercase_task requires "text_to_convert" string.');
      }
      console.log(`Routing to AEON. Blueprint: ${blueprintToExecute}`);
  } else {
       console.log(`Task "${task}" not routed to AEON, falling back to OpenAI.`);
  }

  try {
      if (backendTarget === "aeon" && blueprintToExecute) {
          console.log(`Calling AEON server for blueprint: ${blueprintToExecute}`);
          const aeonEndpoint = `${AEON_SERVER_URL}/execute/${blueprintToExecute}`;
          const aeonInput = { initial_input: payload };

          const response = await axios.post(aeonEndpoint, aeonInput, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 20000
          });

          if (response.data && response.data.success) {
              console.log("AEON execution successful.");
              return { success: true, result: response.data.result }; // Callable functions automatically wrap this in {data: ...}
          } else {
              console.error("AEON server reported an execution error:", response.data);
              const detail = response.data?.error || response.data?.details || 'No details provided.';
              throw new functions.https.HttpsError('internal', `AEON execution failed: ${detail}`, response.data);
          }
      } else if (backendTarget === "openai") {
          const openAIApiKey = functions.config().openai?.key;
          if (!openAIApiKey) {
              console.error("OpenAI API key is not configured in Firebase Function secrets.");
              throw new functions.https.HttpsError('internal', 'AI Service API key not configured.');
          }
          console.log(`Calling OpenAI for task: ${task}`);
          const { OpenAI } = require("openai");
          const openai = new OpenAI({ apiKey: openAIApiKey });

          if (task === "chat_completion") {
              const messages = payload.history || [];
              messages.push({ role: "user", content: payload.current_prompt });
              const systemPrompt = payload.system_prompt || "You are a helpful assistant.";
              const chatCompletion = await openai.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "system", content: systemPrompt }, ...messages] });
              const result = chatCompletion.choices[0]?.message?.content;
              if (!result) throw new Error("No content received from OpenAI chat completion.");
              console.log("OpenAI chat completion successful.");
              return { success: true, result: { content: result } }; // Return result directly

          } else if (task === "image_generation") {
               const imageResponse = await openai.images.generate({ model: "dall-e-3", prompt: payload.prompt, n: 1, size: payload.size || "1024x1024", style: payload.style || "vivid" });
               const imageUrl = imageResponse.data[0]?.url;
               const revisedPrompt = imageResponse.data[0]?.revised_prompt;
               if (!imageUrl) throw new Error("No image URL received from OpenAI image generation.");
                console.log("OpenAI image generation successful.");
               return { success: true, result: { imageUrl: imageUrl, revisedPrompt: revisedPrompt } }; // Return result directly
          }
          // Add other OpenAI task handlers
          else {
              console.error(`Unsupported task type for OpenAI fallback: ${task}`);
              throw new functions.https.HttpsError('invalid-argument', `Task '${task}' is not supported.`);
          }
      } else {
           console.error("Internal logic error: Invalid backend target or missing blueprint.");
           throw new functions.https.HttpsError('internal', 'Internal routing error.');
      }
  } catch (error) {
      console.error(`Error processing task ${task}:`, error); // Log the whole error
      if (error.code === 'ECONNREFUSED') {
           throw new functions.https.HttpsError('unavailable', 'The AEON processing service is currently unavailable.');
      } else if (error.isAxiosError && error.response) {
           console.error("AEON Server Error Response:", error.response.data);
           throw new functions.https.HttpsError('internal', 'AEON server request failed.', error.response.data);
      } else if (error instanceof functions.https.HttpsError) {
           throw error; // Re-throw known HTTPS errors
      } else {
           // Convert other errors to HttpsError
           throw new functions.https.HttpsError('internal', `Failed to process request: ${error.message || 'Unknown error'}`);
      }
  }
}); // --- End of processAiRequest Function ---