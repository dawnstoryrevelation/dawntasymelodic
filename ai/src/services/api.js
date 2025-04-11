// src/services/api.js
import axios from "axios";

// Firebase function URL
const AI_REQUEST_URL = process.env.VITE_FIREBASE_FUNCTION_URL || "https://us-central1-dawntasyai.cloudfunctions.net/processAiRequest";

/**
 * Generic function to call the AI backend Cloud Function.
 * @param {object} data - The data to send to the backend function (e.g., { task, payload }).
 * @returns {Promise<object>} - The JSON response data from the backend.
 * @throws {Error} - Throws an error if the backend call fails.
 */
async function callAiRequest(data) {
  try {
    console.log("🚀 Sending payload to server:", JSON.stringify(data).substring(0, 200) + "...");
    const response = await axios.post(AI_REQUEST_URL, data, {
      headers: { "Content-Type": "application/json" },
    });
    console.log("✅ Received response from server:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error calling server:", error.response?.data || error.message);
    const backendError = error.response?.data?.error || error.message || "Server Communication Error";
    console.error("Server Error Response:", error.response?.data);
    throw new Error(backendError);
  }
}

/**
 * Send chat completion request through our secured server-side function.
 */
async function getCompletion({
  prompt,
  conversationHistory = [],
  systemPrompt = "You are a helpful assistant.",
  model = "gpt-4o-mini",
  temperature = 0.7,
  maxTokens = 1000,
}) {
  const payload = {
    task: "chat_completion",
    payload: {
      prompt,
      history: conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      system_prompt: systemPrompt,
      model,
      temperature,
      max_tokens: maxTokens,
    },
  };
  return callAiRequest(payload);
}

/**
 * Request image generation through our secured server-side function.
 */
async function generateImage({ prompt, model = "dall-e-3" }) {
  const payload = {
    task: "image_generation",
    payload: {
      prompt,
      model,
    },
  };
  return callAiRequest(payload);
}

export { callAiRequest, getCompletion, generateImage };