// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin"); // You might not need admin yet, but good to have
const axios = require("axios"); // For making HTTP requests to OpenAI/Fireworks
const cors = require("cors")({ origin: true }); // To allow requests from your Vue app domain

// Initialize Firebase Admin SDK if you need it for DB access etc. later
// admin.initializeApp();

// Load secrets securely ONLY on the server-side
// These are fetched from the configuration you set via `firebase functions:config:set`
const fireworksApiKey = functions.config().fireworks?.key;
const openaiApiKey = functions.config().openai?.key;

// Define the HTTP Cloud Function
exports.processPTERequest = functions.https.onRequest((request, response) => {
    // 1. Enable CORS - IMPORTANT! Allows your Vue app to call this function
    cors(request, response, async () => {
        // Only allow POST requests
        if (request.method !== 'POST') {
            return response.status(405).send('Method Not Allowed');
        }

        try {
            // 2. Log the incoming request body for debugging
            functions.logger.info("Received request body:", request.body);

            // 3. Extract necessary data from the Vue request body
            const {
                prompt,
                conversationHistory = [], // Default to empty array if not provided
                targetApi,
                model,
                systemPrompt = "You are a helpful assistant.", // Sensible default
                max_tokens = 2000, // Increased default
                temperature = 0.7,
                stream = false // IMPORTANT: For now, we force non-streaming
             } = request.body;

            // 4. Basic Validation
            if (!prompt || !targetApi || !model) {
                functions.logger.error("Validation failed: Missing prompt, targetApi, or model", request.body);
                return response.status(400).json({ error: "Missing required fields: prompt, targetApi, model" });
            }
             if (stream === true) {
                functions.logger.warn("Streaming requested but currently disabled in Step 1. Processing non-streamed.");
                // For Step 1, we override stream to false for simplicity
             }

            let apiUrl;
            let apiKey;
            let requestPayload;
            let apiHeaders;

            // 5. Prepare the request based on the target API
            if (targetApi === "openai") {
                if (!openaiApiKey) {
                    functions.logger.error("OpenAI API key is missing in configuration.");
                    throw new Error("OpenAI API key not configured");
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
                        { role: "system", content: systemPrompt },
                        ...conversationHistory, // Spread previous messages
                        { role: "user", content: prompt }
                    ],
                    max_tokens: max_tokens,
                    temperature: temperature,
                    stream: false // Force non-streaming for now
                };
            } else if (targetApi === "fireworks") {
                if (!fireworksApiKey) {
                     functions.logger.error("Fireworks API key is missing in configuration.");
                    throw new Error("Fireworks API key not configured");
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
                        { role: "system", content: systemPrompt },
                        ...conversationHistory,
                        { role: "user", content: prompt }
                    ],
                    max_tokens: max_tokens,
                    temperature: temperature,
                    stream: false // Force non-streaming for now
                };
            } else if (targetApi === "openai-image") {
                 if (!openaiApiKey) {
                     functions.logger.error("OpenAI API key is missing for image generation.");
                    throw new Error("OpenAI API key not configured");
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
                    size: "1024x1024",
                    quality: "standard",
                    style: "vivid"
                 };
            }
            // Add your Whisper transcription logic here if you want to keep it backend
            // else if (targetApi === "openai-whisper") { ... }
            else {
                 functions.logger.error("Invalid targetApi specified:", targetApi);
                return response.status(400).json({ error: "Invalid targetApi specified" });
            }

            // 6. Make the external API call using Axios
            functions.logger.info(`Making ${stream ? 'streaming' : 'non-streaming'} request to ${targetApi} (${model}) at ${apiUrl}`);

            // --- NON-STREAMING IMPLEMENTATION FOR STEP 1 ---
            const apiResponse = await axios.post(apiUrl, requestPayload, {
                headers: apiHeaders,
                timeout: 60000 // 60 second timeout
            });

            functions.logger.info(`${targetApi} API call successful.`);

            // 7. Send the complete API response back to Vue
            response.status(200).json(apiResponse.data);
            // --- END OF NON-STREAMING IMPLEMENTATION ---

        } catch (error) {
            // Enhanced Error Logging
            let statusCode = 500;
            let errorMessage = "An error occurred processing your request.";
            let errorDetails = {};

            if (axios.isAxiosError(error)) {
                functions.logger.error("Axios Error calling external API:", {
                    message: error.message,
                    url: error.config?.url,
                    status: error.response?.status,
                    data: error.response?.data,
                });
                statusCode = error.response?.status || 502; // 502 Bad Gateway if external API fails
                errorMessage = error.response?.data?.error?.message || `External API Error (${statusCode})`;
                errorDetails = error.response?.data || {};
            } else {
                 functions.logger.error("Generic Error in Cloud Function:", {
                    message: error.message,
                    stack: error.stack,
                 });
                 errorMessage = error.message || "Internal Server Error";
            }

            // Send detailed error back to frontend (consider security implications in production)
            response.status(statusCode).json({
                 error: errorMessage,
                 details: errorDetails // You might want to remove details in production
            });
        }
    });
});