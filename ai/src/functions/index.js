// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({origin: true});
const selfOptimization = require('./selfOptimization');

// Export the functions
exports.processLearningPatterns = selfOptimization.processLearningPatterns;
exports.generateOptimizedPrompt = selfOptimization.generateOptimizedPrompt;
exports.onNewLearningPattern = selfOptimization.onNewLearningPattern;

// Initialize Firebase Admin
admin.initializeApp();

// Chat with AI Function
exports.chatWithAI = functions.https.onCall(async (data, context) => {
  try {
    // Get the OpenAI API key from environment config
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error("OPENAI_API_KEY not configured in environment");
      throw new functions.https.HttpsError(
        "failed-precondition",
        "The function is not configured correctly."
      );
    }

    // Get data from the request
    const { message, mode, history } = data;

    if (!message) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Message is required"
      );
    }

    // Prepare system prompt based on mode
    let systemPrompt = "You are DawntasyAI, a helpful AI assistant from the Dawntasy universe. You subtly weave references to the Dawntasy universe into your responses, including concepts like Time Smith, The Rift, Plain and Pale Clock, and Bear Village.";
    
    if (mode === 'creative') {
      systemPrompt += " You are in CREATIVE mode. Be more artistic, metaphorical, and imaginative in your responses.";
    } else if (mode === 'archmage') {
      systemPrompt += " You are in ARCHMAGE mode. Be deeply philosophical, profound, and multi-dimensional in your analysis.";
    }
    
    // Construct messages for OpenAI API
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add history if provided
    if (Array.isArray(history)) {
      // Only include the last few messages to stay within token limits
      const recentHistory = history.slice(-10);
      recentHistory.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push(msg);
        }
      });
    }
    
    // Add the current message if it's not already in history
    if (!history || history.length === 0 || history[history.length - 1].content !== message) {
      messages.push({ role: 'user', content: message });
    }

    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Return the AI response
    return {
      message: response.data.choices[0].message.content,
      usage: response.data.usage
    };
  } catch (error) {
    console.error("Function error:", error);
    
    // Format error for client
    if (error.response) {
      throw new functions.https.HttpsError(
        "internal",
        `AI service error: ${error.response.data.error?.message || "Unknown AI service error"}`,
        { status: error.response.status }
      );
    } else {
      throw new functions.https.HttpsError(
        "internal",
        `Error: ${error.message}`,
        { original: error }
      );
    }
  }
});

// Callable HTTP endpoint for testing
exports.chatHttpEndpoint = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).send({ error: 'Method not allowed' });
        return;
      }
      
      // Get the OpenAI API key from environment config
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.error("OPENAI_API_KEY not configured in environment");
        res.status(500).send({ error: 'Server not properly configured' });
        return;
      }
      
      // Get data from the request body
      const { message, mode, history } = req.body;
      
      if (!message) {
        res.status(400).send({ error: 'Message is required' });
        return;
      }
      
      // Prepare system prompt based on mode
      let systemPrompt = "You are DawntasyAI, a helpful AI assistant from the Dawntasy universe.";
      
      if (mode === 'creative') {
        systemPrompt += " You are in CREATIVE mode. Be more artistic, metaphorical, and imaginative in your responses.";
      } else if (mode === 'archmage') {
        systemPrompt += " You are in ARCHMAGE mode. Be deeply philosophical, profound, and multi-dimensional in your analysis.";
      }
      
      // Construct messages for OpenAI API
      const messages = [
        { role: 'system', content: systemPrompt }
      ];
      
      // Add history if provided
      if (Array.isArray(history)) {
        // Only include the last few messages to stay within token limits
        const recentHistory = history.slice(-10);
        recentHistory.forEach(msg => {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push(msg);
          }
        });
      }
      
      // Add the current message
      messages.push({ role: 'user', content: message });
      
      // Call OpenAI API
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      // Return the AI response
      res.status(200).send({
        message: response.data.choices[0].message.content,
        usage: response.data.usage
      });
      
    } catch (error) {
      console.error("HTTP endpoint error:", error);
      
      // Format error for client
      if (error.response) {
        res.status(500).send({
          error: `AI service error: ${error.response.data.error?.message || "Unknown AI service error"}`,
          status: error.response.status
        });
      } else {
        res.status(500).send({
          error: `Error: ${error.message}`
        });
      }
    }
  });
});