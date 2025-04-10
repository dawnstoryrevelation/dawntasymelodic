// src/services/api.js
import axios from 'axios';

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// PASTE YOUR DEPLOYED FIREBASE FUNCTION URL HERE
const PTERequestUrl = 'https://YOUR-REGION-YOUR-PROJECT-ID.cloudfunctions.net/processPTERequest';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

/**
 * Generic function to call the PTE backend Cloud Function.
 * @param {object} payload - The data to send to the backend function.
 * @returns {Promise<object>} - The JSON response data from the backend.
 * @throws {Error} - Throws an error if the backend call fails.
 */
async function callPTEBackend(payload) {
  try {
    console.log("Sending payload to PTE backend:", payload);
    // Ensure Content-Type is set for Firebase Functions when sending JSON
    const response = await axios.post(PTERequestUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
    });
    console.log("Received response from PTE backend:", response.data);
    return response.data; // Return the data directly
  } catch (error) {
    console.error("Error calling PTE backend:", error.response?.data || error.message);
    // Extract the error message sent back from the Cloud Function, or use a default
    const backendError = error.response?.data?.error || error.message || "PTE Backend Communication Error";
    // It might be useful to log the full error response for debugging
    if (error.response) {
        console.error("Backend Error Response Body:", error.response.data);
    }
    throw new Error(backendError); // Re-throw a cleaner error for the component to handle
  }
}

/**
 * Specific function to request a chat completion from the PTE backend.
 */
export async function getPTECompletion({
  prompt,
  conversationHistory = [],
  systemPrompt,
  targetApi,
  model,
  stream = false, // Pass stream flag, backend ignores it for now
  temperature = 0.7,
  max_tokens = 2000
}) {
    const payload = {
        prompt,
        // Ensure history only contains essential fields recognized by APIs
        conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
         })),
        systemPrompt,
        targetApi,
        model,
        stream,
        temperature,
        max_tokens
    };
    return callPTEBackend(payload);
}

/**
 * Specific function to request image generation from the PTE backend.
 */
export async function getPTEImage({
  prompt,
  model = "dall-e-3" // Default DALL-E 3 model
}) {
     const payload = {
        prompt,
        targetApi: "openai-image",
        model: model,
        // Add other parameters like size, quality, style if needed by backend
     };
     return callPTEBackend(payload);
}

// Add other specific functions (like transcription) here if you implement them in the backend
// export async function getPTETranscription(audioBlob) { ... }