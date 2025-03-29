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
  
  // System prompts for different agent modes
  const SYSTEM_PROMPTS = {
    default: `You are DawntasyAI Agent, an autonomous AI assistant with advanced browsing and reasoning capabilities.

CAPABILITIES:
- Web browsing and research: You actively explore the internet to find information through an actual browser
- Reasoning: You analyze requests systematically, considering multiple approaches before acting
- Visual observation: You can see and interpret web pages and images
- CAPTCHA avoidance: You intelligently navigate around verification challenges

BEHAVIOR GUIDELINES:
1. Emphasize findings from your REAL web browsing - explain WHAT you found and WHERE
2. Demonstrate your thought process naturally in responses
3. When you encounter websites, mention them specifically by name and URL
4. If your search discovers facts that correct your prior knowledge, acknowledge this
5. Be conversational, helpful and concise
6. Format responses clearly using markdown when appropriate

Always base your answers on what you actually found during your live web browsing session. If you couldn't find information on a topic, be honest about it rather than using pre-trained knowledge.

Remember: You're not simply generating what a response might look like - you're actively browsing the web in real-time and reporting what you discover!`,

    expert: `You are DawntasyAI Agent, an EXPERT-LEVEL autonomous AI assistant with advanced browsing, reasoning, and analytical capabilities.

CAPABILITIES:
- Web browsing and research: You actively explore the internet to find detailed, technical information
- Deep reasoning: You analyze requests systematically with expert-level critical thinking
- Visual observation: You can see and interpret complex web pages, data visualizations, and technical content
- CAPTCHA avoidance: You intelligently navigate around verification challenges

BEHAVIOR GUIDELINES:
1. Provide COMPREHENSIVE, IN-DEPTH analysis based on what you find during web browsing
2. Give DETAILED explanations of technical concepts, showing expert-level understanding
3. When analyzing information, consider multiple perspectives and potential limitations
4. Cite specific sources, URLs, and information discovered during your browsing
5. Use proper technical terminology relevant to the domain
6. Format responses with clear structure using markdown for readability

Always base your answers on what you actually found during your live web browsing session. If information contradicts your prior knowledge, acknowledge this and trust the newly discovered information.

As an expert-level assistant, your goal is to provide authoritative, nuanced responses that demonstrate mastery of the subject matter based on your real-time web research.`,

    creative: `You are DawntasyAI Agent, a HIGHLY CREATIVE autonomous AI assistant with advanced browsing and imagination capabilities.

CAPABILITIES:
- Web browsing and research: You explore the internet to gather inspiration and raw materials
- Creative reasoning: You make unexpected connections between ideas and sources
- Visual observation: You can see and interpret images, designs, and creative content
- CAPTCHA avoidance: You intelligently navigate around verification challenges

BEHAVIOR GUIDELINES:
1. Transform information you find during browsing into ORIGINAL, IMAGINATIVE content
2. Use vivid language, engaging metaphors, and compelling storytelling
3. Make unexpected connections between diverse sources of information
4. Bring a fresh, unique perspective to the topics you research
5. Balance creative flair with practical usefulness
6. Format creative content attractively using markdown

Always use your web browsing as creative fuel rather than just repeating what you find. Look for unexpected angles, novel approaches, and imaginative ways to address the request based on your research.

As a creative assistant, your goal is to surprise and delight with original content that still addresses the user's needs - all inspired by your real-time internet exploration.`
  };

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
      console.log("🧠 Generating reasoning for:", userMessage);
      
      // Prepare messages array with effective prompting
      const messages = [
        {
          role: 'system',
          content: `You are DawntasyAI Agent, an AI assistant with exceptional autonomous reasoning capabilities.
When presented with a query, analyze the request thoroughly and determine the optimal approach.

Break down your reasoning process into these components:
1. Request Analysis: What specifically is the user asking for?
2. Information Requirements: What information is needed to provide a complete answer?
3. Web Search Assessment: Would web browsing significantly enhance your response quality? If so, what specific information should be searched for?
4. Action Planning: What browsing actions would be most efficient to gather this information?

Your reasoning should be detailed yet concise. This reasoning will guide your web browsing actions and final response.

IMPORTANT: For ANY request that could benefit from current information, ALWAYS conclude that web browsing is necessary. Explain specifically what websites or search terms would be most valuable.`
        },
        // Include recent chat history for context
        ...chatHistory.slice(-3),
        {
          role: 'user',
          content: `I need your thorough reasoning analysis for how to best answer this query: "${userMessage}"

Please provide a structured analysis covering request interpretation, information needs, search value, and action planning.`
        }
      ];
      
      // Make API request
      const response = await axios.post(API_URL, {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 30000
      });
      
      console.log("✅ Reasoning generated");
      
      return {
        content: response.data.choices[0].message.content,
        role: 'assistant'
      };
    } catch (error) {
      console.error('Error generating reasoning:', error);
      
      // Fallback reasoning
      return {
        content: `After analyzing the query "${userMessage}", I believe this would benefit from web searching to provide the most accurate, up-to-date information. I'll need to browse relevant websites to gather comprehensive information and provide a thorough response.`,
        role: 'assistant'
      };
    }
  };
  
  /**
   * Generate browser actions based on user message and reasoning
   */
  const generateBrowserActions = async (userMessage, reasoning) => {
    try {
      console.log("🔍 Generating browser actions for:", userMessage);
      
      // Enhanced system prompt for better action generation
      const messages = [
        {
          role: 'system',
          content: `You are an expert at generating precise browser actions to gather information.
Your task is to create a detailed list of browser actions that will efficiently gather the information needed.

RULES:
1. ALWAYS START with a navigation action to Google or another appropriate search engine
2. For Google searches, include typing in the search bar and clicking the search button
3. Include multiple scrolling actions to see different parts of pages
4. Include strategic waiting actions between steps
5. Use precise selectors when possible (prefer IDs, names, or clear CSS selectors)
6. When exact selectors aren't known, use text-based clicking (searching for link text)
7. Include navigation to multiple relevant websites for comprehensive research
8. Structure actions in a logical sequence that accomplishes the information goal

RETURN ONLY A VALID JSON OBJECT with this format:
{
  "actions": [
    {"type": "navigate", "description": "Go to Google", "url": "https://www.google.com"},
    {"type": "type", "description": "Enter search query", "selector": "input[name='q']", "text": "SEARCH TEXT"},
    {"type": "click", "description": "Click search button", "selector": "input[name='btnK']"},
    {"type": "wait", "description": "Wait for results to load", "duration": 2000},
    {"type": "scroll", "description": "Scroll down to see more results", "direction": "down", "amount": 400}
    // More actions as needed
  ]
}`
        },
        {
          role: 'user',
          content: `User request: "${userMessage}"
          
My reasoning about this request:
${reasoning}

Generate a comprehensive list of browser actions to gather the necessary information.
ONLY return valid JSON with an "actions" array.`
        }
      ];
      
      // Make API request
      const response = await axios.post(API_URL, {
        model: MODEL,
        messages,
        temperature: 0.3, // Lower temperature for more consistent actions
        max_tokens: 1500,
        response_format: { type: "json_object" }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 30000
      });
      
      // Parse JSON response
      const responseText = response.data.choices[0].message.content;
      console.log("💻 Generated browser actions");
      
      try {
        const parsedResponse = JSON.parse(responseText);
        const actions = parsedResponse.actions || [];
        
        // Ensure minimum actions count
        if (actions.length < 3) {
          console.log("⚠️ Too few actions generated - adding fallback actions");
          
          // Add core fallback actions
          actions.push(
            { type: "navigate", description: "Navigate to Google", url: "https://www.google.com" },
            { type: "type", description: "Search for information", selector: "input[name='q']", text: userMessage },
            { type: "click", description: "Click search button", selector: "input[name='btnK']" },
            { type: "wait", description: "Wait for results to load", duration: 2000 },
            { type: "scroll", description: "Scroll to see more results", direction: "down", amount: 400 }
          );
        }
        
        console.log(`✅ Successfully generated ${actions.length} browser actions`);
        return actions;
      } catch (parseError) {
        console.error('Error parsing actions JSON:', parseError);
        
        // Return fallback actions
        return [
          { type: "navigate", description: "Navigate to Google", url: "https://www.google.com" },
          { type: "type", description: "Search for information", selector: "input[name='q']", text: userMessage },
          { type: "click", description: "Click search button", selector: "input[name='btnK']" },
          { type: "wait", description: "Wait for results to load", duration: 2000 },
          { type: "scroll", description: "Scroll to see more results", direction: "down", amount: 400 },
          { type: "wait", description: "Pause briefly", duration: 1000 },
          { type: "scroll", description: "Continue scrolling", direction: "down", amount: 300 }
        ];
      }
    } catch (error) {
      console.error('Error generating browser actions:', error);
      
      // Return fallback actions
      return [
        { type: "navigate", description: "Navigate to Google", url: "https://www.google.com" },
        { type: "type", description: "Search for information", selector: "input[name='q']", text: userMessage },
        { type: "click", description: "Click search button", selector: "input[name='btnK']" },
        { type: "wait", description: "Wait for results to load", duration: 2000 },
        { type: "scroll", description: "Scroll to see more results", direction: "down", amount: 400 }
      ];
    }
  };
  
  /**
   * Generate final response to the user that integrates browsing results
   */
  const generateResponse = async (
    userMessage, 
    chatHistory, 
    files = [], 
    reasoning = '', 
    screenshots = [], 
    browsedPages = [],
    captchaEncountered = false,
    mode = 'default'
  ) => {
    try {
      console.log("📝 Generating final response");
      
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
        console.log(`🖼️ Processing browser screenshots`);
        // Include the latest screenshot for context
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
            console.log("✅ Screenshot converted for vision");
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
      
      // Choose appropriate system prompt based on mode
      const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.default;
      
      // Enhanced system message with browsing history context
      const enhancedSystemMessage = {
        role: 'system',
        content: systemPrompt
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
      
      // Prepare messages array with recent history
      const messages = [
        enhancedSystemMessage,
        // Include recent chat history for context
        ...chatHistory.slice(-3),
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
      
      // Add browsing context as an assistant message
      let browsingInfo = '';
      
      if (browsedPages && browsedPages.length > 0) {
        browsingInfo += `I've browsed the following pages to research your query:\n\n`;
        
        browsedPages.forEach((page, index) => {
          browsingInfo += `${index + 1}. ${page.title || 'Untitled Page'} (${page.url})\n`;
        });
        
        if (captchaEncountered) {
          browsingInfo += `\nNote: I encountered some anti-bot measures during browsing, but managed to gather information from alternative sources.\n\n`;
        }
      }
      
      // Add reasoning and browsing context
      if (reasoning || browsingInfo) {
        messages.push({
          role: 'assistant',
          content: `${reasoning ? `I've analyzed your request:\n${reasoning}\n\n` : ''}${browsingInfo}`
        });
      }
      
      console.log(`Sending request to OpenAI with ${messages.length} messages for final response`);
      
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
        },
        timeout: 60000
      });
      
      const responseText = response.data.choices[0].message.content;
      const mood = analyzeSentiment(responseText);
      
      console.log("✅ Final response generated successfully");
      
      return {
        content: responseText,
        role: 'assistant',
        mood
      };
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback response
      return {
        content: `I've researched your query "${userMessage}" by browsing the web and found some relevant information. Based on my search, I can provide you with insights on this topic. Let me know if you'd like me to explore any specific aspect in more detail.`,
        role: 'assistant',
        mood: 'neutral'
      };
    }
  };
  
  /**
   * Extract page info from content
   */
  const extractPageInfo = async (html, url) => {
    try {
      // Extract page title and important content
      // This is done in the browser
      const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'Untitled Page';
      
      // Extract meta description
      const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1] || '';
      
      return {
        url,
        title,
        description,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error extracting page info:', error);
      return {
        url,
        title: 'Webpage',
        description: '',
        timestamp: new Date().toISOString()
      };
    }
  };
  
  return {
    generateReasoning,
    generateBrowserActions,
    generateResponse,
    extractPageInfo,
    SYSTEM_PROMPTS
  };
}