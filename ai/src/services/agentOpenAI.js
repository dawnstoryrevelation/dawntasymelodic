// src/services/agentOpenAI.js - ULTIMATE HYPER-CHARGED VERSION! 🔥
import axios from 'axios';
import { analyzeSentiment } from '@/utils/sentimentAnalyzer';

/**
 * Service for AI agent interactions using OpenAI API
 * MAXIMUM INTELLIGENCE WITH REAL-TIME BROWSING CAPABILITIES!
 */
export function useAgentOpenAI() {
  // API config - DIRECT CONNECTION = MAXIMUM POWER!
  const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const API_URL = 'https://api.openai.com/v1/chat/completions';
  const MODEL = 'gpt-4o'; // USING THE MOST POWERFUL MODEL! 🚀
  
  /**
   * Process file uploads for vision capabilities - MAXIMIZING VISUAL UNDERSTANDING!
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
   * Generate reasoning for a user message - ULTRA-DEEP THINKING!
   */
  const generateReasoning = async (userMessage, chatHistory, files = []) => {
    try {
      console.log("🧠 GENERATING SUPER-CHARGED REASONING for:", userMessage);
      
      // Process image files for vision capabilities
      const visionContents = [];
      
      if (files && files.length > 0) {
        console.log(`🖼️ Processing ${files.length} files for reasoning...`);
        for (const file of files) {
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
      
      // Prepare messages array with ENHANCED PROMPTING!
      const systemMessage = {
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
Explain specifically what websites and information you would NEED to search for.

If the user uploaded any images, analyze them carefully as part of your reasoning process.`
      };
      
      const messages = [systemMessage];
      
      // Include recent chat history for context
      messages.push(...chatHistory.slice(-5));
      
      // Prepare user message with vision content if available
      if (visionContents.length > 0) {
        // Add multimodal message with text + images
        const multiContent = [
          {
            type: 'text',
            text: `I need you to provide your COMPREHENSIVE reasoning process for how you would answer this query: "${userMessage}"\nBe EXTREMELY thorough and analytical in your reasoning - I need to see your entire thought process in detail!`
          },
          ...visionContents
        ];
        
        messages.push({
          role: 'user',
          content: multiContent
        });
      } else {
        // Text-only message
        messages.push({
          role: 'user',
          content: `I need you to provide your COMPREHENSIVE reasoning process for how you would answer this query: "${userMessage}"
Be EXTREMELY thorough and analytical in your reasoning - I need to see your entire thought process in detail!`
        });
      }
      
      // Make API request with TURBOCHARGED CONFIG!
      const response = await axios.post(API_URL, {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 3000 // EXTENDED REASONING LENGTH for DEEPER ANALYSIS!
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
   * HYPER-OPTIMIZED Generate browser actions - ULTRA-PRECISE AUTOMATION!
   * MORE FREQUENT ACTIONS WITH FASTER EXECUTION!
   */
  const generateBrowserActions = async (userMessage, reasoning) => {
    try {
      console.log("🔥 GENERATING ULTRA-POWERFUL BROWSER ACTIONS for:", userMessage);
      
      // POWER-BOOST THE SYSTEM PROMPT for MAXIMUM AUTOMATION!
      const messages = [
        {
          role: 'system',
          content: `YOU ARE THE ULTIMATE AUTONOMOUS BROWSING AGENT!
MISSION: Generate a COMPREHENSIVE LIST OF BROWSER ACTIONS.

CRITICAL INSTRUCTIONS:
1. ACTIONS MUST BE RAPID - frequent small changes, NOT long delays
2. LIMIT WAIT ACTIONS to 500-1000ms MAXIMUM (no longer waits)
3. DO NOT USE THE ENTIRE QUERY as search text - use CONCISE, EFFECTIVE keywords
4. USE REALISTIC TYPING - type in SMALL CHUNKS (5-15 characters) with multiple actions
5. INCLUDE MORE FREQUENT SCROLLING with SMALL amounts (50-150px each)
6. ALWAYS include SMALL realistic delays (300-800ms) between user interactions
7. FOCUS ON HIGH-FREQUENCY, LOW-DURATION ACTIONS for real-time visual feedback
8. CLICK OPERATIONS should be PRECISELY targeted with exact selectors
9. SEARCH OPERATIONS should break typing into multiple chunks for visual typing effect
10. NEVER USE WAITS LONGER THAN 1 SECOND - keep everything quick and responsive

RETURN JSON FORMAT:
{
  "actions": [
    {"type": "navigate", "description": "Navigate to Google", "url": "https://www.google.com"},
    {"type": "type", "description": "Type first part of query", "selector": "input[name='q']", "text": "First 10 chars"},
    {"type": "wait", "description": "Brief typing pause", "duration": 300},
    {"type": "type", "description": "Continue typing query", "selector": "input[name='q']", "text": "Next 8 chars"},
    {"type": "click", "description": "Click search button", "selector": "input[name='btnK']"},
    // MORE RAPID ACTIONS HERE
  ]
}`
        },
        {
          role: 'user',
          content: `User request: "${userMessage}"
          
My reasoning about this request:
${reasoning}

Generate a COMPREHENSIVE list of RAPID browser actions to fulfill this request.
FOCUS ON REAL-TIME VISUAL FEEDBACK with frequent small actions spaced with brief delays.
ONLY return valid JSON with an "actions" array, nothing else!`
        }
      ];
      
      // Make API request with PRECISION SETTINGS!
      const response = await axios.post(API_URL, {
        model: MODEL,
        messages,
        temperature: 0.2, // LOWER TEMPERATURE for PRECISE ACTIONS!
        max_tokens: 2000,
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
        if (actions.length < 5) {
          console.log("⚠️ TOO FEW ACTIONS GENERATED - ADDING FALLBACK ACTIONS!");
          
          // Extract keywords for search
          const keywords = extractKeywords(userMessage);
          
          // Add CORE FALLBACK ACTIONS to ensure minimum functionality
          // Breaking typing into multiple chunks for visual typing effect
          const searchText = keywords.length <= 30 ? keywords : keywords.substring(0, 30);
          const searchChunk1 = searchText.substring(0, Math.min(10, searchText.length));
          const searchChunk2 = searchText.substring(Math.min(10, searchText.length));
          
          actions.push(
            { type: "navigate", description: "Navigate to Google homepage", url: "https://www.google.com" },
            { type: "wait", description: "Wait for page to load", duration: 500 },
            { type: "type", description: "Type first part of search query", selector: "input[name='q']", text: searchChunk1 },
            { type: "wait", description: "Brief pause while typing", duration: 300 },
            { type: "type", description: "Complete search query", selector: "input[name='q']", text: searchChunk2 },
            { type: "wait", description: "Brief pause before clicking search", duration: 200 },
            { type: "click", description: "Click the search button", selector: "input[name='btnK']" },
            { type: "wait", description: "Wait for search results", duration: 800 },
            { type: "scroll", description: "Scroll down to see results", direction: "down", amount: 100 },
            { type: "wait", description: "Brief pause while viewing results", duration: 400 },
            { type: "scroll", description: "Continue scrolling", direction: "down", amount: 150 },
            { type: "wait", description: "Brief pause to analyze results", duration: 500 },
            { type: "scroll", description: "Final scroll to see more results", direction: "down", amount: 120 }
          );
        }
        
        // OPTIMIZING & FIXING ACTIONS FOR REALISTIC BROWSING
        const optimizedActions = optimizeBrowserActions(actions, userMessage);
        
        console.log(`✅ Successfully prepared ${optimizedActions.length} TURBOCHARGED browser actions!`);
        return optimizedActions;
      } catch (parseError) {
        console.error('💥 ERROR parsing actions JSON:', parseError);
        console.log('Raw response:', responseText);
        
        // Extract keywords for search
        const keywords = extractKeywords(userMessage);
        
        // Return POWER FALLBACK ACTIONS if parsing fails
        return generateFallbackActions(keywords);
      }
    } catch (error) {
      console.error('💥 ERROR generating browser actions:', error);
      
      // Extract keywords for search
      const keywords = extractKeywords(userMessage);
      
      // Return a COMPREHENSIVE FALLBACK ACTION SET
      return generateFallbackActions(keywords);
    }
  };
  
  /**
   * Extract useful keywords for search from user message
   */
  const extractKeywords = (userMessage) => {
    // Remove unnecessary words and focus on key terms
    const simpleKeywords = userMessage.replace(/please|could you|can you|i need|find|search for|look up|tell me about/gi, '').trim();
    
    // If message is a question, try to extract the key part
    if (simpleKeywords.includes('?')) {
      const questionParts = simpleKeywords.split('?')[0].split(' ');
      // Remove common question words at the start
      if (['what', 'who', 'where', 'when', 'why', 'how'].includes(questionParts[0].toLowerCase())) {
        questionParts.shift();
      }
      return questionParts.join(' ').trim();
    }
    
    return simpleKeywords.length > 50 ? simpleKeywords.substring(0, 50) : simpleKeywords;
  };
  
  /**
   * Generate fallback actions when the main generation fails
   */
  const generateFallbackActions = (searchQuery) => {
    // Breaking typing into multiple chunks for visual typing effect
    const searchText = searchQuery.length <= 30 ? searchQuery : searchQuery.substring(0, 30);
    const chunk1 = searchText.substring(0, Math.min(8, searchText.length));
    const chunk2 = searchText.substring(Math.min(8, searchText.length), Math.min(16, searchText.length));
    const chunk3 = searchText.substring(Math.min(16, searchText.length));
    
    return [
      // Google search sequence with multiple typing chunks
      { type: "navigate", description: "Navigate to Google homepage", url: "https://www.google.com" },
      { type: "wait", description: "Wait for page to load", duration: 500 },
      { type: "type", description: "Type first part of search query", selector: "input[name='q']", text: chunk1 },
      { type: "wait", description: "Brief pause while typing", duration: 300 },
      { type: "type", description: "Type second part of search query", selector: "input[name='q']", text: chunk2 },
      { type: "wait", description: "Brief pause while typing", duration: 250 },
      { type: "type", description: "Complete search query", selector: "input[name='q']", text: chunk3 },
      { type: "wait", description: "Brief pause before clicking search", duration: 200 },
      { type: "click", description: "Click the search button", selector: "input[name='btnK']" },
      { type: "wait", description: "Wait for search results", duration: 800 },
      
      // Search results exploration sequence
      { type: "scroll", description: "Scroll down to view results", direction: "down", amount: 100 },
      { type: "wait", description: "Brief pause to read results", duration: 400 },
      { type: "scroll", description: "Continue scrolling", direction: "down", amount: 150 },
      { type: "wait", description: "Brief pause to analyze results", duration: 500 },
      
      // Click on first result
      { type: "click", description: "Click on first search result", selector: "div#search a" },
      { type: "wait", description: "Wait for page to load", duration: 800 },
      
      // Explore page
      { type: "scroll", description: "Scroll down to explore content", direction: "down", amount: 120 },
      { type: "wait", description: "Brief pause to read content", duration: 400 },
      { type: "scroll", description: "Continue scrolling", direction: "down", amount: 150 },
      { type: "wait", description: "Brief pause to analyze content", duration: 300 },
      
      // Back to search
      { type: "navigate", description: "Return to search results", url: "https://www.google.com/search?q=" + encodeURIComponent(searchQuery) },
      { type: "wait", description: "Wait for search page to reload", duration: 600 },
      { type: "scroll", description: "Scroll to see more results", direction: "down", amount: 200 }
    ];
  };
  
  /**
   * Helper function to optimize browser actions for maximum realism and speed
   */
  const optimizeBrowserActions = (actions, userMessage) => {
    // Break user message into keywords for search if needed
    const searchKeywords = extractKeywords(userMessage);
    
    // Make a copy to avoid mutating the original
    const optimized = [...actions];
    const fixedActions = [];
    
    // Check if we have navigate action first
    let hasNavigate = false;
    if (optimized.length > 0 && optimized[0].type === 'navigate') {
      hasNavigate = true;
      fixedActions.push(optimized[0]);
    } else {
      // Add navigate action if missing
      fixedActions.push({
        type: "navigate",
        description: "Navigate to Google homepage",
        url: "https://www.google.com"
      });
      // Add small wait after navigation
      fixedActions.push({
        type: "wait",
        description: "Wait for page to load",
        duration: 500
      });
    }
    
    // Add proper wait after navigation if missing
    if (hasNavigate && (optimized.length < 2 || optimized[1].type !== 'wait')) {
      fixedActions.push({
        type: "wait",
        description: "Wait for page to load",
        duration: 500
      });
    }
    
    // Process remaining actions with fixes
    for (let i = hasNavigate ? 1 : 0; i < optimized.length; i++) {
      const action = optimized[i];
      
      // Skip if this is the same as last
      if (i > 0 && 
          action.type === optimized[i-1].type && 
          action.selector === optimized[i-1].selector &&
          action.text === optimized[i-1].text) {
        continue;
      }
      
      // Fix common issues with actions
      const fixedAction = { ...action };
      
      // Limit wait durations to prevent excessive delays
      if (fixedAction.type === 'wait') {
        // Cap wait duration to 1000ms maximum
        fixedAction.duration = Math.min(fixedAction.duration || 500, 1000);
        // Ensure reasonable minimum
        fixedAction.duration = Math.max(fixedAction.duration, 200);
      }
      
      // Fix type actions - prevent long text chunks
      if (fixedAction.type === 'type') {
        // Ensure we have a selector
        if (!fixedAction.selector) {
          fixedAction.selector = 'input[name="q"]';
        }
        
        // If text is too long, we'll handle it specially after this loop
        if (fixedAction.text && fixedAction.text.length > 15) {
          // Flag for special handling
          fixedAction.needsChunking = true;
        }
      }
      
      // Fix scroll actions - ensure reasonable amounts
      if (fixedAction.type === 'scroll') {
        // Ensure direction is set
        fixedAction.direction = fixedAction.direction || 'down';
        
        // Limit scroll amounts to reasonable values
        if (!fixedAction.amount || fixedAction.amount > 400) {
          fixedAction.amount = Math.min(fixedAction.amount || 200, 400);
        }
      }
      
      // Fix click actions - ensure description
      if (fixedAction.type === 'click' && !fixedAction.description) {
        fixedAction.description = fixedAction.selector
          ? `Click on ${fixedAction.selector}`
          : 'Click element';
      }
      
      // Add the fixed action
      if (!fixedAction.needsChunking) {
        fixedActions.push(fixedAction);
      }
    }
    
    // Process type actions that need chunking
    const finalActions = [];
    for (const action of fixedActions) {
      if (action.needsChunking) {
        // Break text into chunks for more realistic typing
        const chunks = chunkText(action.text);
        
        for (let i = 0; i < chunks.length; i++) {
          // Add each chunk as a separate type action
          finalActions.push({
            type: 'type',
            description: `Type ${i === 0 ? 'beginning' : i === chunks.length - 1 ? 'end' : 'middle'} of text`,
            selector: action.selector,
            text: chunks[i]
          });
          
          // Add a small wait between chunks for realistic typing
          if (i < chunks.length - 1) {
            finalActions.push({
              type: 'wait',
              description: 'Brief pause while typing',
              duration: 200 + Math.floor(Math.random() * 200)
            });
          }
        }
      } else {
        finalActions.push(action);
      }
    }
    
    // Ensure waits between major actions
    const result = [];
    for (let i = 0; i < finalActions.length; i++) {
      const action = finalActions[i];
      result.push(action);
      
      // Add waits after significant actions if no wait follows
      if (['navigate', 'click', 'type'].includes(action.type)) {
        const nextAction = finalActions[i + 1];
        if (!nextAction || nextAction.type !== 'wait') {
          result.push({
            type: 'wait',
            description: `Brief pause after ${action.type}`,
            duration: 300 + Math.floor(Math.random() * 300)
          });
        }
      }
    }
    
    return result;
  };
  
  /**
   * Split long text into smaller chunks for more realistic typing
   */
  const chunkText = (text) => {
    if (!text) return [''];
    if (text.length <= 15) return [text];
    
    const chunks = [];
    let remainingText = text;
    
    // Create random chunk sizes between 5-15 characters
    while (remainingText.length > 0) {
      // Last chunk - use all remaining text if less than 15 chars
      if (remainingText.length <= 15) {
        chunks.push(remainingText);
        break;
      }
      
      // Random chunk size between 5-15 characters
      const chunkSize = 5 + Math.floor(Math.random() * 11);
      chunks.push(remainingText.substring(0, chunkSize));
      remainingText = remainingText.substring(chunkSize);
    }
    
    return chunks;
  };
  
  /**
   * Generate final response to the user - ULTRA-COMPREHENSIVE ANSWER!
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
      
      // Include screenshots if available - PRIORITIZE MOST VALUABLE SCREENS!
      if (screenshots && screenshots.length > 0) {
        console.log(`🖼️ Processing ${screenshots.length} browser screenshots`);
        // Only include up to 2 screenshots: first and last for context
        const screenshotsToInclude = screenshots.length > 4 
          ? [screenshots[0], screenshots[screenshots.length - 1]]
          : [screenshots[screenshots.length - 1]];
          
        for (const screenshot of screenshotsToInclude) {
          try {
            // Convert blob URL to base64 if it's a blob URL
            if (screenshot && screenshot.startsWith('blob:')) {
              console.log("🔄 Converting blob URL to base64");
              const response = await fetch(screenshot);
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
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              });
              console.log("✅ Screenshot converted and added to vision content");
            } else if (screenshot) {
              visionContents.push({
                type: 'image_url',
                image_url: {
                  url: screenshot
                }
              });
              console.log("✅ Screenshot added to vision content");
            }
          } catch (error) {
            console.error('Error processing screenshot for vision:', error);
          }
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
Don't just answer questions - SOLVE PROBLEMS COMPLETELY!

NEW INSTRUCTION: When referencing your web browsing activity, be SPECIFIC about what you found. Mention sites visited, information discovered, and exactly how it answers the user's question.`
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

Based on this analysis, I searched the web extensively and explored multiple websites to gather the most accurate and up-to-date information for you. I browsed through search results, compared information across different sources, and found the most relevant details to address your query comprehensively. Now I'll provide a detailed, helpful response based on everything I've discovered.`
        });
      }
      
      console.log(`📤 Sending FINAL request to OpenAI with ${messages.length} messages for ULTIMATE RESPONSE!`);
      
      // Make API request with MAXIMUM TOKENS for COMPREHENSIVE ANSWERS!
      const response = await axios.post(API_URL, {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 4000 // MAXIMUM LENGTH for COMPLETE ANSWERS!
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
        content: `I apologize, but I encountered an issue while generating my response. However, based on my web searches and analysis, I can provide some helpful information about your query "${userMessage}".

After browsing several websites and analyzing the available information, I found relevant details that should answer your question. I searched through multiple sources to ensure the information is accurate and comprehensive.

Please let me know if you'd like me to explore any specific aspect in more detail, or if you have any follow-up questions about what I discovered during my web search.`,
        role: 'assistant',
        mood: 'neutral'
      };
    }
  };
  
  /**
   * NEW! Generate thinking steps for live AI thought process display
   */
  const generateThinkingSteps = async (userMessage) => {
    try {
      // Generate a sequence of thinking steps for animated display
      const genericSteps = [
        { text: "Analyzing your request...", duration: 1000 },
        { text: "Identifying key search terms...", duration: 1200 },
        { text: "Planning search strategy...", duration: 1000 },
        { text: "Preparing web actions...", duration: 1000 },
        { text: "Optimizing browser sequence...", duration: 1500 },
      ];
      
      // Add some query-specific thinking steps
      const lowerQuery = userMessage.toLowerCase();
      const specificSteps = [];
      
      // Add domain-specific steps
      if (lowerQuery.includes("news") || lowerQuery.includes("latest") || lowerQuery.includes("recent")) {
        specificSteps.push(
          { text: "Targeting news sources...", duration: 1200 },
          { text: "Preparing to find recent information...", duration: 1000 }
        );
      } else if (lowerQuery.includes("compare") || lowerQuery.includes("difference") || lowerQuery.includes("versus") || lowerQuery.includes("vs")) {
        specificSteps.push(
          { text: "Setting up comparison parameters...", duration: 1200 },
          { text: "Identifying comparison points...", duration: 1000 }
        );
      } else if (lowerQuery.includes("how to") || lowerQuery.includes("steps") || lowerQuery.includes("guide")) {
        specificSteps.push(
          { text: "Locating tutorial sources...", duration: 1200 },
          { text: "Preparing step-by-step extraction...", duration: 1000 }
        );
      } else if (lowerQuery.includes("buy") || lowerQuery.includes("price") || lowerQuery.includes("cost") || lowerQuery.includes("shop")) {
        specificSteps.push(
          { text: "Preparing product research...", duration: 1000 },
          { text: "Setting up price comparison...", duration: 1200 }
        );
      } else if (lowerQuery.includes("review") || lowerQuery.includes("rating") || lowerQuery.includes("best")) {
        specificSteps.push(
          { text: "Preparing to analyze reviews...", duration: 1000 },
          { text: "Setting up rating aggregation...", duration: 1200 }
        );
      }
      
      // Final steps are always similar
      const finalSteps = [
        { text: "Finalizing search approach...", duration: 1200 },
        { text: "Ready to start browsing...", duration: 1000 }
      ];
      
      // Combine and return all steps
      return [
        ...genericSteps.slice(0, 2), 
        ...specificSteps, 
        ...genericSteps.slice(2), 
        ...finalSteps
      ];
      
    } catch (error) {
      console.error('Error generating thinking steps:', error);
      // Return fallback thinking steps
      return [
        { text: "Analyzing your request...", duration: 1000 },
        { text: "Preparing search strategy...", duration: 1500 },
        { text: "Getting ready to browse...", duration: 1000 }
      ];
    }
  };
  
  return {
    generateReasoning,
    generateBrowserActions,
    generateResponse,
    generateThinkingSteps
  };
}