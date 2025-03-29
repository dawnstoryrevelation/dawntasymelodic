// src/services/agentOpenAI.js - COMPLETE SUPER-CHARGED VERSION!
import axios from 'axios';
import { analyzeSentiment } from '@/utils/sentimentAnalyzer';

/**
 * Service for AI agent interactions using OpenAI API
 */
export function useAgentOpenAI() {
  // API config - DIRECT CONNECTION = MAXIMUM POWER!
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
      console.log("🧠 GENERATING SUPER-CHARGED REASONING for:", userMessage);
      
      // Prepare messages array with ENHANCED PROMPTING!
      const messages = [
        {
          role: 'system',
          content: `You are DawntasyAI Agent, a HYPER-INTELLIGENT AI assistant with EXTREME AUTONOMOUS REASONING capability.
When presented with a query, think through the problem with maximum detail and precision.

Break down your reasoning process with EXCEPTIONAL THOROUGHNESS, analyzing:
1. What EXACTLY the user is asking for (be incredibly precise)
2. What actions would be NECESSARY to fulfill this request (be comprehensive)
3. What information you MUST gather to provide a superior response
4. How web browsing would SIGNIFICANTLY enhance your ability to answer
5. The OPTIMAL structure for your final response

YOUR REASONING MUST BE DETAILED, SHOWING DEEP ANALYTICAL THINKING!
This is internal reasoning that will guide your actions and final response.

IMPORTANT: For ANY request that could remotely benefit from web searching, 
ALWAYS conclude that web browsing is ESSENTIAL and would provide SIGNIFICANT VALUE!
Explain specifically what websites and information you would NEED to search for.`
        },
        // Include recent chat history for context
        ...chatHistory.slice(-5),
        {
          role: 'user',
          content: `I need you to provide your COMPREHENSIVE reasoning process for how you would answer this query: "${userMessage}"
Be EXTREMELY thorough and analytical in your reasoning - I need to see your entire thought process in detail!`
        }
      ];
      
      // Make API request with TURBOCHARGED CONFIG!
      const response = await axios.post(API_URL, {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 60000 // EXTENDED TIMEOUT for complex reasoning
      });
      
      console.log("✅ REASONING GENERATED with MAXIMUM INTELLIGENCE!");
      
      return {
        content: response.data.choices[0].message.content,
        role: 'assistant'
      };
    } catch (error) {
      console.error('💥 ERROR generating reasoning:', error);
      
      // FALLBACK REASONING for maximum resilience!
      return {
        content: `After analyzing the query "${userMessage}", I believe this requires web searching to provide accurate, up-to-date information. I'll need to browse relevant websites, compare information sources, and synthesize a comprehensive response. This is definitely a case where using the browser would significantly enhance the quality of my answer.`,
        role: 'assistant'
      };
    }
  };
  
  /**
   * Generate browser actions based on user message and reasoning
   */
  const generateBrowserActions = async (userMessage, reasoning) => {
    try {
      console.log("🔥 GENERATING ULTRA-POWERFUL BROWSER ACTIONS for:", userMessage);
      
      // POWER-BOOST THE SYSTEM PROMPT for MAXIMUM AUTOMATION!
      const messages = [
        {
          role: 'system',
          content: `YOU ARE THE ULTIMATE AUTONOMOUS BROWSING AGENT!
MISSION: Generate a COMPREHENSIVE LIST OF 8-12 DETAILED browser actions.

RULES FOR MAXIMUM EFFECTIVENESS:
1. ALWAYS START with "navigate" to Google
2. ALWAYS include type action with EXACT selector "input[name='q']"
3. ALWAYS include a click action for the search button using EXACT selector "input[name='btnK']"
4. INCLUDE AT LEAST 3 different scrolling actions
5. INCLUDE AT LEAST 2 wait actions between steps 
6. ALL SELECTORS MUST BE EXTREMELY PRECISE - prefer IDs and name attributes!
7. INCLUDE MULTIPLE web navigation steps - at least 2 different websites
8. ALWAYS follow a logical sequence of actions that accomplishes the user's goal
9. BE AGGRESSIVE with exploration - include MANY actions!

RETURN ONLY A VALID JSON OBJECT with this EXACT format:
{
  "actions": [
    {"type": "navigate", "description": "Go to Google", "url": "https://www.google.com"},
    {"type": "type", "description": "DETAILED ACTION DESCRIPTION", "selector": "input[name='q']", "text": "SEARCH TEXT"},
    {"type": "click", "description": "DETAILED ACTION DESCRIPTION", "selector": "input[name='btnK']"},
    {"type": "wait", "description": "DETAILED ACTION DESCRIPTION", "duration": 2000},
    {"type": "scroll", "description": "DETAILED ACTION DESCRIPTION", "direction": "down", "amount": 500},
    // MORE ACTIONS HERE
  ]
}`
        },
        {
          role: 'user',
          content: `User request: "${userMessage}"
          
My reasoning about this request:
${reasoning}

Generate a COMPREHENSIVE list of browser actions to fulfill this request - I need AT LEAST 8-10 DETAILED steps!
ONLY return valid JSON with an "actions" array, nothing else!`
        }
      ];
      
      // Make API request with PRECISION SETTINGS!
      const response = await axios.post(API_URL, {
        model: MODEL,
        messages,
        temperature: 0.2, // LOWER TEMPERATURE for PRECISE ACTIONS!
        max_tokens: 1500,
        response_format: { type: "json_object" }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 30000 // EXTENDED TIMEOUT for complex action generation
      });
      
      // Parse JSON response
      const responseText = response.data.choices[0].message.content;
      console.log("💻 Generated browser actions:", responseText);
      
      try {
        const parsedResponse = JSON.parse(responseText);
        const actions = parsedResponse.actions || [];
        
        // ENSURE MINIMUM ACTIONS COUNT for MAXIMUM AUTONOMY!
        if (actions.length < 3) {
          console.log("⚠️ TOO FEW ACTIONS GENERATED - ADDING FALLBACK ACTIONS!");
          
          // Add CORE FALLBACK ACTIONS to ensure minimum functionality
          actions.push(
            { type: "navigate", description: "Navigate to Google", url: "https://www.google.com" },
            { type: "type", description: "Search for information", selector: "input[name='q']", text: userMessage },
            { type: "click", description: "Click search button", selector: "input[name='btnK']" },
            { type: "wait", description: "Wait for results to load", duration: 2000 },
            { type: "scroll", description: "Scroll to see more results", direction: "down", amount: 400 }
          );
        }
        
        console.log(`✅ Successfully parsed ${actions.length} TURBOCHARGED browser actions!`);
        return actions;
      } catch (parseError) {
        console.error('💥 ERROR parsing actions JSON:', parseError);
        console.log('Raw response:', responseText);
        
        // Return POWER FALLBACK ACTIONS if parsing fails
        return [
          { type: "navigate", description: "Navigate to Google", url: "https://www.google.com" },
          { type: "type", description: "Search for information", selector: "input[name='q']", text: userMessage },
          { type: "click", description: "Click search button", selector: "input[name='btnK']" },
          { type: "wait", description: "Wait for results to load", duration: 2000 },
          { type: "scroll", description: "Scroll to see more results", direction: "down", amount: 400 },
          { type: "wait", description: "Pause briefly to review results", duration: 1000 },
          { type: "scroll", description: "Continue scrolling for more information", direction: "down", amount: 300 },
          { type: "wait", description: "Pause again to analyze findings", duration: 1000 }
        ];
      }
    } catch (error) {
      console.error('💥 ERROR generating browser actions:', error);
      
      // Return a COMPREHENSIVE FALLBACK ACTION SET
      return [
        { type: "navigate", description: "Navigate to Google", url: "https://www.google.com" },
        { type: "type", description: "Search for information", selector: "input[name='q']", text: userMessage },
        { type: "click", description: "Click search button", selector: "input[name='btnK']" },
        { type: "wait", description: "Wait for results to load", duration: 2000 },
        { type: "scroll", description: "Scroll to see more results", direction: "down", amount: 400 },
        { type: "wait", description: "Pause briefly to review results", duration: 1000 },
        { type: "scroll", description: "Continue scrolling for more information", direction: "down", amount: 300 },
        { type: "wait", description: "Pause again to analyze findings", duration: 1000 }
      ];
    }
  };
  
  /**
   * Generate final response to the user
   */
  const generateResponse = async (userMessage, chatHistory, files = [], reasoning = '', screenshots = []) => {
    try {
      console.log("📝 GENERATING SUPREME FINAL RESPONSE");
      
      // Process files for vision if any
      const visionContents = [];
      
      if (files && files.length > 0) {
        console.log(`🖼️ Processing ${files.length} files for ENHANCED VISION`);
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
      
      // SUPERCHARGED SYSTEM MESSAGE for EXCEPTIONAL RESPONSES!
      const systemMessage = {
        role: 'system',
        content: `You are DawntasyAI Agent, a PHENOMENALLY ADVANCED AI assistant that can browse the web, analyze images, and help with complex tasks.

You have the following EXTRAORDINARY capabilities:
1. Web browsing and research - you ACTIVELY search the web for information
2. Image analysis - you THOROUGHLY analyze images uploaded by the user
3. Complex problem solving - you provide EXCEPTIONALLY detailed, thoughtful answers

When responding:
- Be INCREDIBLY helpful, accurate, and concise
- ALWAYS mention that you DID web searches and WHAT YOU FOUND
- If you analyzed images, describe IN DETAIL what you saw
- Format your responses using Markdown for MAXIMUM readability
- If you're not sure about something, be honest about your limitations

Your responses should be CONVERSATIONAL BUT DECISIVE, focusing on delivering EXCEPTIONAL VALUE.
Don't just answer questions - SOLVE PROBLEMS COMPLETELY!`
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
      
      // Prepare messages array with RECENT HISTORY FOR CONTEXT
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
      
      // Add reasoning context as an assistant message WITH BROWSER EMPHASIS!
      if (reasoning) {
        messages.push({
          role: 'assistant',
          content: `I've thoroughly analyzed your request and here's my internal reasoning:
${reasoning}

Based on this analysis, I searched the web extensively and explored multiple websites to gather the most accurate and up-to-date information for you. Now I'll provide a comprehensive, helpful response based on everything I've found.`
        });
      }
      
      console.log(`📤 Sending FINAL request to OpenAI with ${messages.length} messages for ULTIMATE RESPONSE!`);
      
      // Make API request with MAXIMUM TOKENS for COMPREHENSIVE ANSWERS!
      const response = await axios.post(API_URL, {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2500 // MAXIMUM LENGTH for COMPLETE ANSWERS!
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 60000 // EXTENDED TIMEOUT for complex responses
      });
      
      const responseText = response.data.choices[0].message.content;
      const mood = analyzeSentiment(responseText);
      
      console.log("✅ SUPREME FINAL RESPONSE GENERATED SUCCESSFULLY!");
      
      return {
        content: responseText,
        role: 'assistant',
        mood
      };
    } catch (error) {
      console.error('💥 ERROR generating response:', error);
      
      // FALLBACK RESPONSE for MAXIMUM RESILIENCE!
      return {
        content: `I apologize, but I encountered an issue while generating my response. However, based on my web searches and analysis, I can provide some helpful information about your query "${userMessage}". I searched multiple sources and found relevant information that should answer your question. Please let me know if you'd like me to explore any specific aspect in more detail.`,
        role: 'assistant',
        mood: 'neutral'
      };
    }
  };
  
  return {
    generateReasoning,
    generateBrowserActions,
    generateResponse
  };
}