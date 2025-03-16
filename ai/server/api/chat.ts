// server/api/chat.js
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const apiKey = process.env.VITE_OPENAI_API_KEY;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Validate environment variables
if (!apiKey) {
  console.error('ERROR: VITE_OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

// API endpoint for chat
app.post('/api/chat', async (req: express.Request, res: express.Response) => {
  try {
    const { message, mode, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Prepare messages for OpenAI API
    let systemPrompt = "You are DawntasyAI, a helpful AI assistant from the Dawntasy universe.";
    
    // Adjust system prompt based on selected mode
    if (mode === 'creative') {
      systemPrompt += " You are in CREATIVE mode. Be more artistic, metaphorical, and imaginative in your responses.";
    } else if (mode === 'archmage') {
      systemPrompt += " You are in ARCHMAGE mode. Be deeply philosophical, profound, and multi-dimensional in your analysis.";
    }

    // Construct messages array for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).filter(msg => msg.role === 'user' || msg.role === 'assistant')
    ];

    // Make the request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return res.status(response.status).json({ 
        error: 'Error communicating with AI service',
        details: error.error?.message || 'Unknown error'
      });
    }

    const data = await response.json();
    
    return res.json({
      message: data.choices[0].message.content,
      usage: data.usage
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;
createServer(app).listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;