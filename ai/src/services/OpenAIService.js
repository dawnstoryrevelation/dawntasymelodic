// src/services/OpenAIService.js

import axios from 'axios';

/**
 * Service to handle OpenAI API interactions
 */
class OpenAIService {
  constructor() {
    this.apiBaseUrl = process.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1';
    this.apiKey = process.env.VITE_OPENAI_API_KEY || '';
    
    // Configure axios with default headers
    this.api = axios.create({
      baseURL: this.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
  }

  /**
   * Set or update the API key
   * @param {string} apiKey - OpenAI API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.api.defaults.headers.Authorization = `Bearer ${apiKey}`;
  }

  /**
   * Send a chat completion request to OpenAI
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} OpenAI response
   */
  async chatCompletion(messages, options = {}) {
    const defaultOptions = {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    const requestOptions = { ...defaultOptions, ...options, messages };

    try {
      const response = await this.api.post('/chat/completions', requestOptions);
      return response.data;
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error('Failed to get response from AI service');
    }
  }

  /**
   * Process an image with vision capabilities
   * @param {string} base64Image - Base64 encoded image
   * @param {string} prompt - Text prompt for the image
   * @returns {Promise<Object>} OpenAI vision response
   */
  async processImageWithVision(base64Image, prompt = 'What does this image show?') {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ];

    const options = {
      model: 'gpt-4o', // Using the model with vision capabilities
      max_tokens: 1000
    };

    try {
      return await this.chatCompletion(messages, options);
    } catch (error) {
      console.error('Vision processing error:', error);
      throw new Error('Failed to process image with vision capabilities');
    }
  }

  /**
   * Process a chat with reasoning capabilities
   * @param {Array} messages - Array of message objects
   * @param {boolean} includeReasoning - Whether to include reasoning in the response
   * @returns {Promise<Object>} Response with reasoning
   */
  async processWithReasoning(messages, includeReasoning = true) {
    // Clone messages to avoid modifying the original
    const messagesCopy = [...messages];
    
    if (includeReasoning) {
      // Add a system message to instruct the model to show reasoning
      messagesCopy.unshift({
        role: 'system',
        content: `You are DawntasyAI, an autonomous AI agent with web browsing and reasoning capabilities. 
        When responding to the user, first think step-by-step about how to approach the request.
        Structure your reasoning as a first-person inner monologue like: 
        "Hmm. Let me think through this step by step. I need to understand X before I can determine Y..."
        After your reasoning, provide a clear, concise response to the user's request.`
      });
    }

    try {
      const response = await this.chatCompletion(messagesCopy, {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2000
      });

      // If reasoning is requested, extract it from the response
      if (includeReasoning && response.choices && response.choices.length > 0) {
        const fullContent = response.choices[0].message.content;
        
        // Attempt to separate reasoning from the response
        // This is a simple approach - in production, you might want a more robust method
        const reasoningMatch = fullContent.match(/^(Hmm\..*?)(?:\n\n|$)/s);
        
        if (reasoningMatch) {
          const reasoning = reasoningMatch[1].trim();
          const actualResponse = fullContent.substring(reasoningMatch[0].length).trim();
          
          return {
            ...response,
            reasoning,
            actualResponse,
            choices: [{
              ...response.choices[0],
              message: {
                ...response.choices[0].message,
                content: actualResponse
              }
            }]
          };
        }
      }

      return response;
    } catch (error) {
      console.error('Reasoning processing error:', error);
      throw new Error('Failed to process with reasoning capabilities');
    }
  }

  /**
   * Process a document or file
   * @param {string} fileContent - File content
   * @param {string} fileName - File name
   * @param {string} prompt - Prompt for processing the file
   * @returns {Promise<Object>} OpenAI response
   */
  async processDocument(fileContent, fileName, prompt = 'Analyze this document') {
    // Determine file type
    const fileExtension = fileName.split('.').pop().toLowerCase();
    let fileType = 'text';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      fileType = 'image';
    } else if (['pdf', 'docx', 'xlsx', 'csv'].includes(fileExtension)) {
      fileType = 'document';
    }
    
    // Create appropriate messages based on file type
    let messages = [];
    
    if (fileType === 'image') {
      // For images, use vision capabilities
      return this.processImageWithVision(fileContent, prompt);
    } else {
      // For text or documents, send as text
      messages = [
        {
          role: 'user',
          content: `${prompt}\n\nFile name: ${fileName}\n\nContent:\n${fileContent}`
        }
      ];
    }
    
    try {
      return await this.chatCompletion(messages, {
        model: 'gpt-4o',
        max_tokens: 2000
      });
    } catch (error) {
      console.error('Document processing error:', error);
      throw new Error('Failed to process document');
    }
  }
}

export default new OpenAIService();