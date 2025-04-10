// netlify/functions/processPTERequest.js
const axios = require('axios');

// Access API keys securely from Netlify Environment Variables (set in Netlify UI)
const openaiApiKey = process.env.VITE_OPENAI_API_KEY;
const fireworksApiKey = process.env.VITE_FIREWORKS_API_KEY;

exports.handler = async (event, context) => {
    // Allow requests from anywhere for now, or restrict origin in Netlify _headers
    const headers = {
        'Access-Control-Allow-Origin': '*', // Or restrict to your specific domain in production
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and preflight OPTIONS
    };

    // Handle CORS preflight requests (sent by browsers)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204, // No Content
            headers,
            body: '',
        };
    }

    // Only allow POST requests for actual processing
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        // 1. Parse data from the request body sent by Vue
        // Netlify automatically parses JSON bodies if Content-Type is correct
        const requestBody = JSON.parse(event.body || '{}');
        console.log("Netlify function received body:", requestBody); // Log for debugging

        const {
            prompt,
            conversationHistory = [],
            targetApi,
            model,
            systemPrompt = "You are a helpful assistant.",
            max_tokens = 2000,
            temperature = 0.7,
            stream = false // Forcing non-streaming in Step 1
        } = requestBody;

        // 2. Basic Validation
        if (!prompt || !targetApi || !model) {
            console.error("Validation failed:", requestBody);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Missing required fields: prompt, targetApi, model" }),
            };
        }
        if (stream === true) {
            console.warn("Streaming requested but disabled in Step 1");
        }

        let apiUrl;
        let apiKey;
        let requestPayload;
        let apiHeaders;

        // 3. Prepare request based on target API
        if (targetApi === "openai") {
            if (!openaiApiKey) throw new Error("OpenAI API key not configured in Netlify env");
            apiUrl = "https://api.openai.com/v1/chat/completions";
            apiKey = `Bearer ${openaiApiKey}`;
            apiHeaders = { "Authorization": apiKey, "Content-Type": "application/json" };
            requestPayload = {
                model, messages: [{ role: "system", content: systemPrompt }, ...conversationHistory, { role: "user", content: prompt }],
                max_tokens, temperature, stream: false // Force non-streaming
            };
        } else if (targetApi === "fireworks") {
            if (!fireworksApiKey) throw new Error("Fireworks API key not configured in Netlify env");
            apiUrl = "https://api.fireworks.ai/inference/v1/chat/completions";
            apiKey = `Bearer ${fireworksApiKey}`;
            apiHeaders = { "Authorization": apiKey, "Content-Type": "application/json" };
            requestPayload = {
                model, messages: [{ role: "system", content: systemPrompt }, ...conversationHistory, { role: "user", content: prompt }],
                max_tokens, temperature, stream: false // Force non-streaming
            };
        } else if (targetApi === "openai-image") {
            if (!openaiApiKey) throw new Error("OpenAI API key not configured for image");
            apiUrl = "https://api.openai.com/v1/images/generations";
            apiKey = `Bearer ${openaiApiKey}`;
            apiHeaders = { "Authorization": apiKey, "Content-Type": "application/json" };
            requestPayload = { model, prompt, n: 1, size: "1024x1024", quality: "standard", style: "vivid" };
        } else {
            console.error("Invalid targetApi:", targetApi);
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid targetApi specified" }) };
        }

        // 4. Make the external API call using Axios
        console.log(`Making request to ${targetApi} (${model}) at ${apiUrl}`);
        const apiResponse = await axios.post(apiUrl, requestPayload, {
             headers: apiHeaders,
             timeout: 60000 // 60 seconds
        });
        console.log(`${targetApi} API call successful.`);

        // 5. Return the successful response back to Vue
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(apiResponse.data), // Return the actual data from the external API
        };

    } catch (error) {
        // Enhanced Error Handling
        console.error("Error in Netlify Function:", error.message);
        let statusCode = 500;
        let errorMessage = "An error occurred processing your request.";
        let errorDetails = {};

        if (axios.isAxiosError(error)) {
            console.error("Axios Error details:", { status: error.response?.status, data: error.response?.data });
            statusCode = error.response?.status || 502; // Bad Gateway for external errors
            errorMessage = error.response?.data?.error?.message || `External API Error (${statusCode})`;
            errorDetails = error.response?.data || {};
        } else {
            errorDetails = { message: error.message };
        }

        return {
            statusCode: statusCode,
            headers,
            body: JSON.stringify({
                error: errorMessage,
                // details: errorDetails // Optional: include details, consider security
            }),
        };
    }
};