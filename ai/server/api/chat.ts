// ai/server/api/chat.js
import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Server configuration error: API key is missing' 
      });
    }
    
    // Get request body
    const { messages, model, temperature, max_tokens } = req.body;
    
    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages array is required' });
    }
    
    // Make request to OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model || 'gpt-3.5-turbo',
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Return the response
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error calling OpenAI:', error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || 'Error processing your request',
      details: error.message
    });
  }
}