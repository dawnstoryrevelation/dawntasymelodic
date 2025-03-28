// src/services/agentOpenAI.js
import axios from 'axios';
import { analyzeSentiment } from '@/utils/sentimentAnalyzer';

/**
 * Service for AI agent interactions using OpenAI API
 */
export function useAgentOpenAI() {
  // API config
  const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const API_URL = 'https://api.openai.com/v1/chat/completions';
  const MODEL = 'gpt-4o';
  
  /**
   * Process file uploads for vision capabilities
   */
  const processFileForVision = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64Data = event.target.result.split(',')[1]; // Extract base64 content
        resolve({
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${base64Data}`
          }
        });
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  };
  
  /**
   * Generate reasoning for a user message
   */
  const generateReasoning = async (userMessage, chatHistory, files = []) => {
    try {
      // Prepare messages array
      const messages = [
        {
          role: 'system',
          content: `You are DawntasyAI Agent, an advanced AI assistant that can reason step-by-step.
When presented with a query, think carefully about the best approach to solve it.
Break down your reasoning process in detail, analyzing:
1. What the user is asking for
2. What actions would be necessary to fulfill this request
3. What information you need to gather
4. Any web searches or browsing that might be needed
5. How to structure your final response

Your reasoning should be detailed and show your thought process. This is internal reasoning that
will help guide your actions and final response.`
        },
        // Include recent chat history for context
        ...chatHistory.slice(-5),
        {
          role: 'user',
          content: `I need you to provide your detailed reasoning process for how you would answer this query: "${userMessage}"
Be thorough and analytical in your reasoning.`
        }
      ];
      
      // Make API request
      const response = await axios.post(API_URL, {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      return {
        content: response.data.choices[0].message.content,
        role: 'assistant'
      };
    } catch (error) {
      console.error('Error generating reasoning:', error);
      throw new Error('Failed to generate reasoning: ' + error.message);
    }
  };
  
  /**
   * Generate browser actions based on user message and reasoning
   */
  const generateBrowserActions = async (userMessage, reasoning) => {
    try {
      // Prepare messages array
      const messages = [
        {
          role: 'system',
          content: `You are an AI agent that generates browser actions.
Based on the user's request and your reasoning, you'll create a list of browser actions
to be executed by a Puppeteer automation system. Return ONLY a valid JSON array of action objects.

Each action must be an object with these properties:
1. "type": The action type (one of: "navigate", "click", "type", "scroll", "submit", "wait", "screenshot")
2. "description": Short description of what this action accomplishes
3. Additional parameters based on action type:
   - navigate: { "url": "https://example.com" }
   - click: { "selector": "CSS selector" } or { "text": "text to click" }
   - type: { "selector": "CSS selector", "text": "text to type" }
   - scroll: { "direction": "down" or "up", "amount": pixels } 
   - submit: { "selector": "form CSS selector" }
   - wait: { "duration": time in milliseconds }
   - screenshot: {}

Example valid response:
[
  {"type": "navigate", "description": "Go to Google", "url": "https://www.google.com"},
  {"type": "type", "description": "Search for chocolate cake recipe", "selector": "input[name='q']", "text": "best chocolate cake recipe"},
  {"type": "click", "description": "Click search button", "selector": "input[name='btnK']"}
]`
        },
        {
          role: 'user',
          content: `User request: "${userMessage}"
          
My reasoning about this request:
${reasoning}

Based on this, generate the browser actions needed to fulfill this request. Return ONLY a valid JSON array of actions.`
        }
      ];
      
      // Make API request
      const response = await axios.post(API_URL, {
        model: MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      // Parse JSON response
      const responseText = response.data.choices[0].message.content;
      const actions = JSON.parse(responseText).actions || [];
      
      return actions;
    } catch (error) {
      console.error('Error generating browser actions:', error);
      // Return a safe fallback action (navigating to Google)
      return [
        {
          type: 'navigate',
          description: 'Go to Google',
          url: 'https://www.google.com'
        }
      ];
    }
  };
  
  /**
   * Generate final response to the user
   */
  const generateResponse = async (userMessage, chatHistory, files = [], reasoning = '', screenshots = []) => {
    try {
      // Process files for vision if any
      const visionContents = [];
      
      if (files && files.length > 0) {
        for (const file of files) {
          // Only process image files for vision
          if (file.type.startsWith('image/')) {
            try {
              const visionContent = await processFileForVision(file);
              visionContents.push(visionContent);
            } catch (error) {
              console.error('Error processing image for vision:', error);
            }
          }
        }
      }
      
      // Include screenshots if available
      if (screenshots && screenshots.length > 0) {
        // Only include the latest screenshot for context
        const latestScreenshot = screenshots[screenshots.length - 1];
        try {
          // Convert blob URL to base64 if it's a blob URL
          if (latestScreenshot && latestScreenshot.startsWith('blob:')) {
            const response = await fetch(latestScreenshot);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64Data = await new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result.split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            
            visionContents.push({
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Data}`
              }
            });
          } else if (latestScreenshot) {
            visionContents.push({
              type: 'image_url',
              image_url: {
                url: latestScreenshot
              }
            });
          }
        } catch (error) {
          console.error('Error processing screenshot for vision:', error);
        }
      }
      
      // Prepare system message
      const systemMessage = {
        role: 'system',
        content: `You are DawntasyAI Agent, an advanced AI assistant that can browse the web, analyze images, and help with complex tasks.
You have the following capabilities:
1. Web browsing and research - you can search the web for information
2. Image analysis - you can analyze images uploaded by the user
3. Complex problem solving - you can provide detailed, thoughtful answers

When responding:
- Be helpful, accurate, and concise
- If you performed web searches, mention what you found
- If you analyzed images, describe what you saw
- Format your responses using Markdown for readability
- If you're not sure about something, be honest about your limitations

Your responses should be conversational but efficient, focusing on providing the most helpful information.`
      };
      
      // Prepare the content array for the message
      const userMessageContent = [];
      
      // Text message content
      userMessageContent.push({
        type: 'text',
        text: userMessage
      });
      
      // Add vision contents if available
      userMessageContent.push(...visionContents);
      
      // Prepare messages array
      const messages = [
        systemMessage,
        // Include recent chat history for context
        ...chatHistory.slice(-5),
      ];
      
      // Add user message with potential vision content
      if (visionContents.length > 0) {
        messages.push({
          role: 'user',
          content: userMessageContent
        });
      } else {
        messages.push({
          role: 'user',
          content: userMessage
        });
      }
      
      // Add reasoning context as an assistant message
      if (reasoning) {
        messages.push({
          role: 'assistant',
          content: `I've analyzed your request and here's my internal reasoning:
${reasoning}

Now I'll provide a clear and helpful response based on this analysis.`
        });
      }
      
      // Make API request
      const response = await axios.post(API_URL, {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2500
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      const responseText = response.data.choices[0].message.content;
      const mood = analyzeSentiment(responseText);
      
      return {
        content: responseText,
        role: 'assistant',
        mood
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate response: ' + error.message);
    }
  };
  
  return {
    generateReasoning,
    generateBrowserActions,
    generateResponse
  };
}