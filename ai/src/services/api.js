// src/services/api.js
import axios from 'axios';

// Firebase function URL - WILL BE AUTOMATICALLY DEPLOYED
// For local testing with Firebase emulator use: http://localhost:5001/YOUR-PROJECT-ID/us-central1/processPTERequest
// For production use the deployed URL format shown below
const PTE_REQUEST_URL = 'https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/processPTERequest';

/**
 * Generic function to call the PTE backend Cloud Function.
 * @param {object} payload - The data to send to the backend function.
 * @returns {Promise<object>} - The JSON response data from the backend.
 * @throws {Error} - Throws an error if the backend call fails.
 */
async function callPTEBackend(payload) {
  try {
    console.log("🚀 Sending payload to server:", payload);
    
    // Call your Firebase Function instead of OpenAI directly!
    const response = await axios.post(PTE_REQUEST_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log("✅ Received response from server:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error calling server:", error.response?.data || error.message);
    
    // Extract the error message sent back from the Cloud Function
    const backendError = error.response?.data?.error || error.message || "Server Communication Error";
    
    // Log the full error response for debugging
    if (error.response) {
      console.error("Server Error Response:", error.response.data);
    }
    
    throw new Error(backendError);
  }
}

/**
 * Send chat completion request through our secured server-side function.
 */
export async function getCompletion({
  prompt,
  conversationHistory = [],
  systemPrompt = "You are a helpful assistant.",
  model = "gpt-4o-mini",
  temperature = 0.7,
  maxTokens = 1000
}) {
  const payload = {
    prompt,
    conversationHistory: conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    systemPrompt,
    targetApi: "openai", // Specify which backend API to use
    model,
    temperature,
    maxTokens
  };
  
  return callPTEBackend(payload);
}

/**
 * Request image generation through our secured server-side function.
 */
export async function generateImage({
  prompt,
  model = "dall-e-3" // Default to DALL-E 3
}) {
  const payload = {
    prompt,
    targetApi: "openai-image", // Specify image generation
    model,
  };
  
  return callPTEBackend(payload);
}