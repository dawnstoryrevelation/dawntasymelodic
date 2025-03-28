// src/components/AgentController.js
// This file shows how to integrate the different components in your AgentChatView

import OpenAIService from '../services/OpenAIService';
import PuppeteerService from '../services/PuppeteerService';
import VisionService from '../services/VisionService';
import { ref } from 'vue';

/**
 * Controller for the Agent functionality
 * This demonstrates how to wire up all the services together
 */
export default function useAgentController() {
  // State management
  const isTyping = ref(false);
  const isAgentMode = ref(true);
  const reasoningEnabled = ref(true);
  const browserScreenshot = ref('');
  const currentBrowserUrl = ref('');
  const isAgentActive = ref(false);
  const loadingAgentScreen = ref(false);
  const browserStatusText = ref('Ready');
  const currentReasoning = ref('');
  const currentThinkingState = ref('');
  const thinkingStates = ref([]);
  
  // Initialize thinking states
  const thinkingStateOptions = [
    "Thinking...",
    "Analyzing request...",
    "Processing information...",
    "Searching knowledge base...",
    "Exploring options...",
    "Connecting concepts...",
    "Evaluating context...",
    "Crafting response...",
    "Reviewing facts...",
    "Considering implications...",
    "Organizing thoughts...",
    "Examining patterns...",
    "Synthesizing ideas...",
    "Reviewing previous context...",
    "Formulating hypothesis..."
  ];
  
  /**
   * Process a user message and generate a response
   * @param {Object} userMessage - User message object
   * @returns {Promise<Object>} AI response
   */
  async function processMessage(userMessage) {
    try {
      isTyping.value = true;
      thinkingStates.value = [];
      
      // Start thinking animation
      startThinkingAnimation();
      
      // Process files if attached
      let fileAnalysisResults = [];
      if (userMessage.attachments && userMessage.attachments.length > 0) {
        fileAnalysisResults = await processAttachments(userMessage.attachments);
      }
      
      // Determine if web browsing is needed
      const needsBrowsing = detectBrowsingIntent(userMessage.content);
      
      // If browsing is needed and agent mode is on, activate the browser
      if (needsBrowsing && isAgentMode.value) {
        await activateBrowser(userMessage.content);
      }
      
      // Format messages for OpenAI
      const messages = formatMessagesForAI(userMessage, fileAnalysisResults);
      
      // Process with reasoning if enabled
      const aiResponse = await OpenAIService.processWithReasoning(messages, reasoningEnabled.value);
      
      // Extract reasoning if present
      if (aiResponse.reasoning) {
        currentReasoning.value = aiResponse.reasoning;
      }
      
      // Stop thinking animation
      stopThinkingAnimation();
      
      isTyping.value = false;
      
      return {
        role: 'assistant',
        content: aiResponse.choices[0].message.content,
        reasoning: currentReasoning.value,
        thinking: [...thinkingStates.value]
      };
    } catch (error) {
      console.error('Error processing message:', error);
      isTyping.value = false;
      stopThinkingAnimation();
      
      return {
        role: 'assistant',
        content: 'I encountered an error while processing your request. Please try again.',
        error: error.message
      };
    }
  }
  
  /**
   * Process file attachments
   * @param {Array} attachments - Array of file attachments
   * @returns {Promise<Array>} Analysis results
   */
  async function processAttachments(attachments) {
    const results = [];
    
    addThinkingState("Analyzing attached files...");
    
    for (const attachment of attachments) {
      try {
        // If it's an image, use Vision service
        if (VisionService.isImageFile(attachment.file)) {
          addThinkingState(`Analyzing image: ${attachment.name}...`);
          const visionResult = await VisionService.analyzeImage(attachment.file);
          
          results.push({
            name: attachment.name,
            type: 'image',
            analysis: visionResult.analysis
          });
        } 
        // For other file types, handle accordingly
        else {
          addThinkingState(`Processing file: ${attachment.name}...`);
          
          // Use FileReader to read file content
          const content = await readFileContent(attachment.file);
          
          // Process with OpenAI
          const response = await OpenAIService.processDocument(
            content,
            attachment.name,
            `Analyze this file: ${attachment.name}`
          );
          
          results.push({
            name: attachment.name,
            type: 'document',
            analysis: response.choices[0].message.content
          });
        }
      } catch (error) {
        console.error(`Error processing attachment ${attachment.name}:`, error);
        results.push({
          name: attachment.name,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Read file content as text or base64
   * @param {File} file - File to read
   * @returns {Promise<string>} File content
   */
  function readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // For text files, read as text
      if (file.type.startsWith('text/') || 
          file.type === 'application/json' ||
          file.type === 'application/csv') {
        reader.readAsText(file);
      } else {
        // For binary files, read as data URL
        reader.readAsDataURL(file);
      }
      
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
  
  /**
   * Format messages for AI processing
   * @param {Object} userMessage - User message
   * @param {Array} fileResults - File analysis results
   * @returns {Array} Formatted messages for OpenAI
   */
  function formatMessagesForAI(userMessage, fileResults = []) {
    const messages = [
      {
        role: 'system',
        content: `You are DawntasyAI, an autonomous agent with web browsing and reasoning capabilities.
        ${reasoningEnabled.value ? 'Show your reasoning process when responding to queries.' : ''}
        Today's date is ${new Date().toLocaleDateString()}.`
      },
      {
        role: 'user',
        content: userMessage.content
      }
    ];
    
    // Add file analysis results if available
    if (fileResults.length > 0) {
      // Add file content to the user message
      let fileContent = "\n\nAttached files analysis:\n";
      
      fileResults.forEach(result => {
        fileContent += `\nFile: ${result.name}\n`;
        fileContent += `Type: ${result.type}\n`;
        fileContent += `Analysis: ${result.analysis || "Error processing file"}\n`;
      });
      
      // Update the user message
      messages[1].content += fileContent;
    }
    
    // Add browser context if available
    if (isAgentActive.value && browserScreenshot.value) {
      messages.push({
        role: 'assistant',
        content: `I've browsed to ${currentBrowserUrl.value} and analyzed the content.`
      });
    }
    
    return messages;
  }
  
  /**
   * Detect if a message requires web browsing
   * @param {string} message - User message
   * @returns {boolean} Whether browsing is needed
   */
  function detectBrowsingIntent(message) {
    const browsingKeywords = [
      'search', 'find', 'look up', 'browse', 'google', 'web', 
      'navigate', 'go to', 'website', 'page', 'internet'
    ];
    
    const lowerMessage = message.toLowerCase();
    return browsingKeywords.some(keyword => lowerMessage.includes(keyword));
  }
  
  /**
   * Activate the browser for web navigation
   * @param {string} query - User query
   */
  async function activateBrowser(query) {
    try {
      isAgentActive.value = true;
      loadingAgentScreen.value = true;
      browserStatusText.value = 'Initializing browser...';
      addThinkingState('Preparing web browser...');
      
      // Initialize Puppeteer session
      await PuppeteerService.initSession();
      
      loadingAgentScreen.value = false;
      browserStatusText.value = 'Browser ready';
      
      // Extract search terms
      const searchTerms = extractSearchTerms(query);
      
      if (searchTerms) {
        addThinkingState(`Searching for: ${searchTerms}...`);
        browserStatusText.value = `Searching for: ${searchTerms}`;
        
        // Perform Google search
        const searchResult = await PuppeteerService.searchGoogle(searchTerms);
        
        // Update browser state
        browserScreenshot.value = searchResult.screenshot;
        currentBrowserUrl.value = searchResult.url;
        browserStatusText.value = 'Analyzing search results...';
        
        // Simulate browsing through results
        await simulateBrowsing(searchResult);
      } else {
        // Just navigate to Google
        const navResult = await PuppeteerService.navigateTo('https://www.google.com');
        browserScreenshot.value = navResult.screenshot;
        currentBrowserUrl.value = navResult.url;
      }
    } catch (error) {
      console.error('Browser activation error:', error);
      loadingAgentScreen.value = false;
      browserStatusText.value = 'Browser error: ' + error.message;
    }
  }
  
  /**
   * Extract search terms from a user query
   * @param {string} query - User query
   * @returns {string|null} Search terms or null
   */
  function extractSearchTerms(query) {
    // Simple extraction - in a real app you might use NLP
    const searchPatterns = [
      /search for (.*)/i,
      /find (.*)/i,
      /look up (.*)/i,
      /search (.*)/i,
      /google (.*)/i
    ];
    
    for (const pattern of searchPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // If no pattern matches but contains search keyword, use the whole query
    if (detectBrowsingIntent(query)) {
      return query;
    }
    
    return null;
  }
  
  /**
   * Simulate browsing through search results
   * @param {Object} searchResult - Search result from Puppeteer
   */
  async function simulateBrowsing(searchResult) {
    const steps = [
      { action: 'scroll', direction: 'down', amount: 300 },
      { action: 'wait', ms: 1000 },
      { action: 'screenshot', message: 'Scrolling through results...' },
      { action: 'scroll', direction: 'down', amount: 500 },
      { action: 'wait', ms: 1500 },
      { action: 'screenshot', message: 'Reading content...' }
    ];
    
    // If search results are available, click the first one
    if (searchResult.searchResults && searchResult.searchResults.length > 0) {
      steps.push(
        { action: 'scroll', direction: 'up', amount: 500 },
        { action: 'wait', ms: 1000 },
        { action: 'click', selector: 'div.g a', message: 'Clicking on top result...' },
        { action: 'wait', ms: 2000 },
        { action: 'screenshot', message: 'Analyzing page content...' },
        { action: 'scroll', direction: 'down', amount: 400 },
        { action: 'wait', ms: 1500 },
        { action: 'screenshot', message: 'Reading detailed information...' }
      );
    }
    
    // Execute each step
    for (const step of steps) {
      try {
        switch (step.action) {
          case 'scroll':
            await PuppeteerService.scrollPage(step.direction, step.amount);
            break;
          case 'click':
            if (step.message) {
              browserStatusText.value = step.message;
              addThinkingState(step.message);
            }
            await PuppeteerService.clickElement(step.selector);
            break;
          case 'wait':
            await new Promise(resolve => setTimeout(resolve, step.ms));
            break;
          case 'screenshot':
            if (step.message) {
              browserStatusText.value = step.message;
              addThinkingState(step.message);
            }
            const screenshot = await PuppeteerService.takeScreenshot();
            browserScreenshot.value = screenshot;
            currentBrowserUrl.value = (await PuppeteerService.extractText('title')).text;
            break;
        }
      } catch (error) {
        console.error(`Error in browser simulation step ${step.action}:`, error);
      }
    }
    
    browserStatusText.value = 'Browsing complete';
    addThinkingState('Finished gathering information from the web');
  }
  
  /**
   * Start thinking animation with random states
   */
  function startThinkingAnimation() {
    // Add initial thinking states
    addThinkingState(getRandomThinkingState());
    
    // Add more thinking states periodically
    const thinkingInterval = setInterval(() => {
      if (thinkingStates.value.length < 5) {
        addThinkingState(getRandomThinkingState());
      }
    }, 2000);
    
    // Store the interval ID for cleanup
    window.thinkingInterval = thinkingInterval;
  }
  
  /**
   * Stop thinking animation
   */
  function stopThinkingAnimation() {
    if (window.thinkingInterval) {
      clearInterval(window.thinkingInterval);
      window.thinkingInterval = null;
    }
  }
  
  /**
   * Add a thinking state to the list
   * @param {string} state - Thinking state text
   */
  function addThinkingState(state) {
    if (!thinkingStates.value.includes(state)) {
      thinkingStates.value.push(state);
      currentThinkingState.value = state;
    }
  }
  
  /**
   * Get a random thinking state
   * @returns {string} Random thinking state
   */
  function getRandomThinkingState() {
    return thinkingStateOptions[
      Math.floor(Math.random() * thinkingStateOptions.length)
    ];
  }
  
  /**
   * Close the browser and clean up
   */
  async function closeBrowser() {
    if (isAgentActive.value) {
      try {
        await PuppeteerService.closeSession();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
      
      isAgentActive.value = false;
      browserScreenshot.value = '';
      currentBrowserUrl.value = '';
    }
  }
  
  return {
    // State
    isTyping,
    isAgentMode,
    reasoningEnabled,
    browserScreenshot,
    currentBrowserUrl,
    isAgentActive,
    loadingAgentScreen,
    browserStatusText,
    currentReasoning,
    currentThinkingState,
    thinkingStates,
    
    // Methods
    processMessage,
    activateBrowser,
    closeBrowser,
    addThinkingState
  };
}