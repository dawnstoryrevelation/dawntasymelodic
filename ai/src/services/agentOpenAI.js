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
      console.log("🧠 GENERATING REASONING for:", userMessage);
      
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

Your reasoning should be thorough and detailed (200-300 words). Show your thought process and consider multiple angles.
This is internal reasoning that will guide your actions and final response.

IMPORTANT: For ANY request that could benefit from web searching, browsing, or accessing current information,
ALWAYS include in your reasoning that web browsing would be helpful.`
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
      
      console.log("✅ Reasoning generated successfully!");
      
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
      console.log("🎮 GENERATING BROWSER ACTIONS for:", userMessage);
      
      // Prepare messages array
      const messages = [
        {
          role: 'system',
          content: `You are an AI agent that generates browser actions.
Based on the user's request, you'll create a LIST OF AT LEAST 5-8 DETAILED browser actions
to be executed by Puppeteer. ALWAYS include multiple steps like navigating, searching, clicking, scrolling.
NEVER return just one action - the user wants to see AUTONOMOUS BROWSING WITH MULTIPLE STEPS!

Return ONLY a valid JSON object with an "actions" property containing an array of action objects:

{
  "actions": [
    {"type": "navigate", "description": "Go to Google", "url": "https://www.google.com"},
    {"type": "type", "description": "Search for chocolate cake recipe", "selector": "input[name='q']", "text": "best chocolate cake recipe"},
    {"type": "click", "description": "Click search button", "selector": "input[name='btnK']"},
    {"type": "wait", "description": "Wait for results to load", "duration": 2000},
    {"type": "scroll", "description": "Scroll down to see more results", "direction": "down", "amount": 400}
  ]
}

IMPORTANT RULES:
1. ALWAYS include Google search as first steps (navigate to Google, type search query, click search)
2. ALWAYS include multiple scroll actions to show exploration
3. ALWAYS include wait actions between steps
4. ALWAYS include descriptive text explaining each action
5. ALWAYS return valid JSON - NO explanations or other text outside the JSON object

For Google search interactions:
- Navigate to "https://www.google.com"
- Use selector "input[name='q']" for the search box
- Use selector "input[name='btnK']" or "text: Google Search" for the search button`
        },
        {
          role: 'user',
          content: `User request: "${userMessage}"
          
My reasoning about this request:
${reasoning}

Generate a comprehensive list of browser actions to fulfill this request. ONLY return valid JSON with an "actions" array.`
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
      console.log("💻 Generated browser actions:", responseText);
      
      try {
        const parsedResponse = JSON.parse(responseText);
        const actions = parsedResponse.actions || [];
        console.log(`✅ Successfully parsed ${actions.length} browser actions`);
        
        return actions;
      } catch (parseError) {
        console.error('Error parsing actions JSON:', parseError);
        console.log('Raw response:', responseText);
        
        // Return fallback actions if parsing fails
        return [
          {
            type: 'navigate',
            description: 'Go to Google',
            url: 'https://www.google.com'
          },
          {
            type: 'type',
            description: 'Search for information',
            selector: 'input[name="q"]',
            text: userMessage
          },
          {
            type: 'click',
            description: 'Click search button',
            selector: 'input[name="btnK"]'
          }
        ];
      }
    } catch (error) {
      console.error('Error generating browser actions:', error);
      // Return a safe fallback action (navigating to Google)
      return [
        {
          type: 'navigate',
          description: 'Go to Google',
          url: 'https://www.google.com'
        },
        {
          type: 'type',
          description: 'Search for information',
          selector: 'input[name="q"]',
          text: userMessage
        },
        {
          type: 'click',
          description: 'Click search button',
          selector: 'input[name="btnK"]'
        }
      ];
    }
  };
  
  /**
   * Generate final response to the user
   */
  const generateResponse = async (userMessage, chatHistory, files = [], reasoning = '', screenshots = []) => {
    try {
      console.log("📝 GENERATING FINAL RESPONSE");
      
      // Process files for vision if any
      const visionContents = [];
      
      if (files && files.length > 0) {
        console.log(`🖼️ Processing ${files.length} files for vision`);
        for (const file of files) {
          // Only process image files for vision
          if (file.type.startsWith('image/')) {
            try {
              const visionContent = await processFileForVision(file);
              visionContents.push(visionContent);
              console.log(`✅ Processed image file: ${file.name}`);
            } catch (error) {
              console.error('Error processing image for vision:', error);
            }
          }
        }
      }
      
      // Include screenshots if available
      if (screenshots && screenshots.length > 0) {
        console.log(`🖼️ Processing ${screenshots.length} browser screenshots`);
        // Only include the latest screenshot for context
        const latestScreenshot = screenshots[screenshots.length - 1];
        try {
          // Convert blob URL to base64 if it's a blob URL
          if (latestScreenshot && latestScreenshot.startsWith('blob:')) {
            console.log("🔄 Converting blob URL to base64");
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
            console.log("✅ Screenshot converted and added to vision content");
          } else if (latestScreenshot) {
            visionContents.push({
              type: 'image_url',
              image_url: {
                url: latestScreenshot
              }
            });
            console.log("✅ Screenshot added to vision content");
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

Now I'll provide a clear and helpful response based on this analysis and the web browsing I've done.`
        });
      }
      
      console.log(`📤 Sending final request to OpenAI with ${messages.length} messages`);
      
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
      
      console.log("✅ Final response generated successfully!");
      
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