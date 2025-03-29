<!-- src/views/AgentChatView.vue -->
<template>
  <div class="agent-chat-container">
    <!-- Cosmic Header -->
    <div class="cosmic-header">
      <h1 class="cosmic-title">DawntasyAI Agent</h1>
      <div class="agent-mode-selector">
        <button 
          class="mode-button" 
          :class="{ active: agentMode === 'default' }"
          @click="setAgentMode('default')">
          <i class="ri-robot-line"></i> Standard
        </button>
        <button 
          class="mode-button" 
          :class="{ active: agentMode === 'expert' }"
          @click="setAgentMode('expert')">
          <i class="ri-brain-line"></i> Expert
        </button>
        <button 
          class="mode-button" 
          :class="{ active: agentMode === 'creative' }"
          @click="setAgentMode('creative')">
          <i class="ri-lightbulb-flash-line"></i> Creative
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="chat-content-area">
      <!-- Messages Panel -->
      <div class="messages-panel" ref="messagesPanel">
        <div class="messages-container">
          <!-- Welcome Message -->
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="welcome-icon">
              <i class="ri-robot-line"></i>
            </div>
            <h2>DawntasyAI Agent</h2>
            <p>Your autonomous AI assistant that can browse the web in real-time to answer your questions.</p>
            <div class="welcome-tips">
              <div class="tip">
                <i class="ri-search-line"></i>
                <span>Ask me to search the web and find information</span>
              </div>
              <div class="tip">
                <i class="ri-global-line"></i>
                <span>I can visit websites and analyze content</span>
              </div>
              <div class="tip">
                <i class="ri-file-list-line"></i>
                <span>I can research topics and compile findings</span>
              </div>
            </div>
          </div>

          <!-- Conversation Messages -->
          <template v-for="(message, index) in messages" :key="index">
            <!-- User Message -->
            <div v-if="message.role === 'user'" class="message user-message">
              <div class="message-avatar">
                <div class="user-avatar">
                  <i class="ri-user-fill"></i>
                </div>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>

            <!-- Assistant Message -->
            <div v-else-if="message.role === 'assistant'" class="message assistant-message">
              <div class="message-avatar">
                <div class="assistant-avatar" :class="message.mood || 'neutral'">
                  <i class="ri-robot-fill"></i>
                </div>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>

            <!-- System Message (for status updates) -->
            <div v-else-if="message.role === 'system'" class="message system-message">
              <div class="system-content">
                <i :class="message.icon || 'ri-information-line'"></i>
                <span v-html="formatMessage(message.content)"></span>
              </div>
            </div>
          </template>

          <!-- Thinking Indicator -->
          <div v-if="isThinking" class="message assistant-message thinking">
            <div class="message-avatar">
              <div class="assistant-avatar thinking">
                <i class="ri-robot-fill"></i>
              </div>
            </div>
            <div class="message-content">
              <div class="thinking-indicator">
                <div class="thinking-text">{{ thinkingText }}</div>
                <div class="thinking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Browser View Panel -->
      <div class="browser-panel" v-if="showBrowser">
        <div class="browser-toolbar">
          <div class="browser-tools">
            <button class="browser-tool-button" @click="refreshBrowser">
              <i class="ri-refresh-line"></i>
            </button>
            <button class="browser-tool-button" @click="toggleBrowser">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="browser-status">
            <div class="status-indicator" :class="{ active: browserActive }">
              <span class="status-pulse"></span>
              <span class="status-text">{{ browserStatusText }}</span>
            </div>
          </div>
        </div>

        <!-- Browser View Component -->
        <BrowserView 
          v-if="browserSessionId" 
          :sessionId="browserSessionId" 
          :currentAction="currentBrowserAction"
          :actionData="currentBrowserActionData"
          @screenshot="handleScreenshot" 
          @browser-status="handleBrowserStatus"
          ref="browserView" 
        />

        <!-- Simplified Action Log -->
        <div class="action-log" v-if="showActionLog">
          <div class="action-log-header">
            <h3>Browser Actions</h3>
            <button class="toggle-log-button" @click="toggleActionLog">
              <i class="ri-eye-off-line"></i>
            </button>
          </div>
          <div class="action-log-content">
            <div 
              v-for="(action, index) in actionLog" 
              :key="index" 
              class="action-item"
              :class="{ 'current': index === currentActionIndex, 'completed': index < currentActionIndex }"
            >
              <div class="action-icon">
                <i :class="getActionIcon(action.type)"></i>
              </div>
              <div class="action-details">
                <div class="action-description">{{ action.description || getActionDescription(action) }}</div>
                <div v-if="action.type === 'type'" class="action-data">
                  <span class="action-label">Text:</span> "{{ action.text }}"
                </div>
                <div v-if="action.type === 'navigate'" class="action-data">
                  <span class="action-label">URL:</span> {{ action.url }}
                </div>
              </div>
              <div class="action-status">
                <i v-if="index < currentActionIndex" class="ri-check-line"></i>
                <i v-else-if="index === currentActionIndex" class="ri-loader-4-line spinning"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area">
      <div class="input-container">
        <textarea 
          ref="messageInput"
          v-model="userInput" 
          class="message-input"
          placeholder="Ask me anything..." 
          @keydown.enter.prevent="sendMessage"
          :disabled="isThinking"
        ></textarea>
        <button 
          class="send-button" 
          @click="sendMessage" 
          :disabled="isThinking || !userInput.trim()">
          <i class="ri-send-plane-fill"></i>
        </button>
      </div>
      <div class="input-options">
        <button 
          class="option-button" 
          @click="toggleBrowser" 
          :class="{ active: showBrowser }">
          <i class="ri-computer-line"></i>
          <span>{{ showBrowser ? 'Hide Browser' : 'Show Browser' }}</span>
        </button>
        <button 
          v-if="showBrowser" 
          class="option-button" 
          @click="toggleActionLog" 
          :class="{ active: showActionLog }">
          <i class="ri-list-check"></i>
          <span>{{ showActionLog ? 'Hide Actions' : 'Show Actions' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useAgentOpenAI } from '@/services/agentOpenAI';
import { usePuppeteerService } from '@/services/puppeteerService';
import { useFirebaseChat } from '@/services/agentFirebase';
import { v4 as uuidv4 } from 'uuid';
import BrowserView from '@/components/agent/BrowserView.vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Services
const agentOpenAI = useAgentOpenAI();
const puppeteerService = usePuppeteerService();
const firebaseChat = useFirebaseChat();

// State variables
const chatId = ref(uuidv4());
const userInput = ref('');
const messages = ref([]);
const isThinking = ref(false);
const thinkingText = ref('Thinking');
const thinkingPhases = ref([
  'Thinking',
  'Analyzing your request',
  'Researching the web',
  'Formulating response',
  'Processing information'
]);
const currentThinkingPhase = ref(0);

// Browser state
const showBrowser = ref(false);
const browserSessionId = ref('');
const browserActive = ref(false);
const browserStatusText = ref('Inactive');
const screenshots = ref([]);
const browsedPages = ref([]);
const currentBrowserAction = ref(null);
const currentBrowserActionData = ref({});
const captchaEncountered = ref(false);

// Action log state
const showActionLog = ref(true);
const actionLog = ref([]);
const currentActionIndex = ref(-1);

// Agent mode
const agentMode = ref('default');

// DOM References
const messagesPanel = ref(null);
const messageInput = ref(null);
const browserView = ref(null);

// Computed properties
const browserInUse = computed(() => browserSessionId.value && browserActive.value);

// Set agent mode
const setAgentMode = (mode) => {
  agentMode.value = mode;
  
  // Add system message about mode change
  addSystemMessage(`Agent mode switched to ${mode} mode`, 'ri-settings-4-line');
};

// Format time for display
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format message content with Markdown
const formatMessage = (content) => {
  if (!content) return '';
  
  // Replace newlines with <br> in code blocks
  const processedContent = content.replace(/```([\s\S]*?)```/g, (match) => {
    return match.replace(/\n/g, '<br>');
  });
  
  // Use marked to convert Markdown to HTML
  const rawHtml = marked(processedContent);
  
  // Sanitize HTML to prevent XSS
  return DOMPurify.sanitize(rawHtml);
};

// Get icon for action type
const getActionIcon = (actionType) => {
  switch (actionType) {
    case 'navigate': return 'ri-global-line';
    case 'click': return 'ri-cursor-fill';
    case 'type': return 'ri-text-input';
    case 'scroll': return 'ri-arrow-down-s-line';
    case 'wait': return 'ri-time-line';
    case 'submit': return 'ri-send-plane-line';
    default: return 'ri-question-line';
  }
};

// Get description for action type
const getActionDescription = (action) => {
  switch (action.type) {
    case 'navigate': return `Navigate to ${action.url}`;
    case 'click': return `Click ${action.selector || 'element'}`;
    case 'type': return `Type "${action.text?.substring(0, 15)}${action.text?.length > 15 ? '...' : ''}"`;
    case 'scroll': return `Scroll ${action.direction || 'down'}`;
    case 'wait': return `Wait ${action.duration ? (action.duration/1000) + 's' : ''}`;
    case 'submit': return `Submit form`;
    default: return `${action.type} action`;
  }
};

// Handle browser status updates
const handleBrowserStatus = (status) => {
  browserActive.value = status.active;
  browserStatusText.value = status.active ? 'Active' : 'Inactive';
};

// Handle screenshot updates
const handleScreenshot = (screenshotUrl) => {
  if (screenshotUrl) {
    screenshots.value.push(screenshotUrl);
    
    // Keep only the latest 3 screenshots to save memory
    if (screenshots.value.length > 3) {
      // Get URL to revoke
      const oldScreenshot = screenshots.value.shift();
      
      // Revoke the object URL to free memory
      if (oldScreenshot && oldScreenshot.startsWith('blob:')) {
        URL.revokeObjectURL(oldScreenshot);
      }
    }
  }
};

// Toggle browser visibility
const toggleBrowser = () => {
  showBrowser.value = !showBrowser.value;
  
  if (showBrowser.value && !browserSessionId.value) {
    initializeBrowser();
  }
};

// Toggle action log visibility
const toggleActionLog = () => {
  showActionLog.value = !showActionLog.value;
};

// Refresh browser
const refreshBrowser = async () => {
  if (browserView.value) {
    await browserView.value.refresh();
  }
};

// Initialize the browser session
const initializeBrowser = async () => {
  try {
    // Start a new browser session
    const sessionResponse = await puppeteerService.startSession();
    browserSessionId.value = sessionResponse.sessionId;
    
    console.log(`🚀 Browser session started: ${browserSessionId.value}`);
    addSystemMessage('Browser session started', 'ri-computer-line');
  } catch (error) {
    console.error('Error starting browser session:', error);
    addSystemMessage('Failed to start browser session', 'ri-error-warning-line');
  }
};

// Add a system message
const addSystemMessage = (content, icon = 'ri-information-line') => {
  messages.value.push({
    role: 'system',
    content,
    icon,
    timestamp: new Date()
  });
  
  // Scroll to bottom
  scrollToBottom();
};

// Add a message to the chat
const addMessage = (role, content, mood = null) => {
  messages.value.push({
    role,
    content,
    mood,
    timestamp: new Date()
  });
  
  // Scroll to bottom
  scrollToBottom();
};

// Scroll to bottom of messages panel
const scrollToBottom = async () => {
  await nextTick();
  if (messagesPanel.value) {
    messagesPanel.value.scrollTop = messagesPanel.value.scrollHeight;
  }
};

// Animate thinking dots
const startThinkingAnimation = () => {
  isThinking.value = true;
  currentThinkingPhase.value = 0;
  thinkingText.value = thinkingPhases.value[0];
  
  // Change thinking text periodically
  const thinkingInterval = setInterval(() => {
    currentThinkingPhase.value = (currentThinkingPhase.value + 1) % thinkingPhases.value.length;
    thinkingText.value = thinkingPhases.value[currentThinkingPhase.value];
    scrollToBottom();
  }, 3000);
  
  return thinkingInterval;
};

// Stop thinking animation
const stopThinkingAnimation = (interval) => {
  isThinking.value = false;
  clearInterval(interval);
};

// Update thinking text
const updateThinkingText = (text) => {
  thinkingText.value = text;
  scrollToBottom();
};

// Execute browser actions
const executeBrowserActions = async (actions) => {
  if (!browserSessionId.value || !browserActive.value) {
    console.log('Browser not ready, initializing...');
    await initializeBrowser();
    
    // Brief delay to allow browser to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Reset action log and index
  actionLog.value = actions;
  currentActionIndex.value = -1;
  
  // Clear page data for this new browsing session
  browsedPages.value = [];
  captchaEncountered.value = false;
  
  // Execute each action in sequence
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    currentActionIndex.value = i;
    
    // Set current action for visual feedback
    currentBrowserAction.value = action.type;
    currentBrowserActionData.value = action;
    
    // Update thinking text
    updateThinkingText(`${action.description || getActionDescription(action)}`);
    
    try {
      console.log(`🚀 Executing action: ${action.type} - ${action.description || ''}`);
      
      // Execute the action
      const result = await puppeteerService.executeAction(browserSessionId.value, action);
      
      // Check for CAPTCHA detection
      if (result.captchaDetected) {
        console.log('🛡️ CAPTCHA detected! Taking evasive action...');
        addSystemMessage('CAPTCHA detected, taking evasive action', 'ri-shield-check-line');
        captchaEncountered.value = true;
        
        // Try to handle the CAPTCHA
        await puppeteerService.handleCaptcha(browserSessionId.value);
        
        // Skip to next action that's not dependent on this one
        while (
          i < actions.length - 1 && 
          ['click', 'type', 'submit'].includes(actions[i + 1].type)
        ) {
          i++;
        }
      }
      
      // Extract page info after navigation actions
      // Extract page info after navigation actions
if (action.type === 'navigate' || (action.type === 'click' && result.url !== browsedPages.value[browsedPages.value.length - 1]?.url)) {
  try {
    // Get current page content
    const pageContent = await puppeteerService.getPageContent(browserSessionId.value)
      .catch(error => {
        console.warn("⚠️ Could not get page content, continuing anyway:", error.message);
        return null;
      });
    
    // Extract and store page info if content was retrieved
    if (pageContent) {
      try {
        const pageInfo = await agentOpenAI.extractPageInfo(pageContent, result.url || action.url);
        browsedPages.value.push(pageInfo);
      } catch (error) {
        console.warn("⚠️ Could not extract page info:", error.message);
        // Still add basic page info
        browsedPages.value.push({
          url: result.url || action.url || "Unknown URL",
          title: "Webpage", 
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Add minimal page info when content can't be retrieved
      browsedPages.value.push({
        url: result.url || action.url || "Unknown URL",
        title: "Visited Page", 
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error processing page:', error);
    // Don't let this error stop the process
  }
}
      
      // Pause briefly between actions for visual feedback
      await new Promise(resolve => setTimeout(resolve, 400));
      
    } catch (error) {
      console.error(`⚠️ Action type ${action.type} failed but CONTINUING NEXT ACTION:`, error);
      
      // Continue with next action instead of stopping
      addSystemMessage(`Browser action failed: ${error.message}`, 'ri-error-warning-line');
    }
  }
  
  // Clear current action
  currentBrowserAction.value = null;
  currentBrowserActionData.value = {};
  currentActionIndex.value = actions.length;
  
  // Update thinking text
  updateThinkingText('Processing gathered information');
  
  return {
    pages: browsedPages.value,
    captchaEncountered: captchaEncountered.value
  };
};

// Send message
const sendMessage = async () => {
  const message = userInput.value.trim();
  if (!message || isThinking.value) return;
  
  // Clear input
  userInput.value = '';
  
  // Add user message
  addMessage('user', message);
  
  // Start thinking animation
  const thinkingInterval = startThinkingAnimation();
  
  try {
    // 1. Generate reasoning
    updateThinkingText('Analyzing your request');
    const reasoningResult = await agentOpenAI.generateReasoning(message, messages.value);
    const reasoning = reasoningResult.content;
    
    // 2. Generate browser actions
    updateThinkingText('Planning web research');
    const actions = await agentOpenAI.generateBrowserActions(message, reasoning);
    
    // 3. Execute browser actions
    updateThinkingText('Browsing the web');
    console.log('Show browser for visual feedback');
    showBrowser.value = true;
    
    const browsingResult = await executeBrowserActions(actions);
    
    // 4. Generate response
    updateThinkingText('Formulating response');
    const response = await agentOpenAI.generateResponse(
      message,
      messages.value,
      [], // files
      reasoning,
      screenshots.value,
      browsingResult.pages,
      browsingResult.captchaEncountered,
      agentMode.value
    );
    
    // 5. Add assistant message
    addMessage('assistant', response.content, response.mood);
    
    // 6. Save conversation (if using Firebase)
    try {
      await firebaseChat.saveChat(chatId.value, messages.value);
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    addSystemMessage(`Error: ${error.message}`, 'ri-error-warning-line');
  } finally {
    // Stop thinking animation
    stopThinkingAnimation(thinkingInterval);
  }
};

// Lifecycle hooks
onMounted(async () => {
  // Focus input field
  if (messageInput.value) {
    messageInput.value.focus();
  }
  
  // Load existing chat if provided via URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlChatId = urlParams.get('chatId');
  
  if (urlChatId) {
    chatId.value = urlChatId;
    try {
      const chatData = await firebaseChat.loadChat(urlChatId);
      if (chatData && chatData.messages) {
        messages.value = chatData.messages;
        
        // Scroll to bottom
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      addSystemMessage('Failed to load previous conversation', 'ri-error-warning-line');
    }
  } else {
    // Initialize new chat
    console.log('New chat created with ID:', chatId.value);
  }
});

onUnmounted(async () => {
  // Clean up browser session
  if (browserSessionId.value) {
    try {
      await puppeteerService.endSession(browserSessionId.value);
      console.log('Browser session ended');
    } catch (error) {
      console.error('Error ending browser session:', error);
    }
  }
  
  // Clean up screenshots
  screenshots.value.forEach(screenshot => {
    if (screenshot.startsWith('blob:')) {
      URL.revokeObjectURL(screenshot);
    }
  });
});

// Watch for browser visibility changes
watch(showBrowser, (newValue) => {
  if (newValue && !browserSessionId.value) {
    // Initialize browser if it's not already initialized
    initializeBrowser();
  }
});
</script>

<style scoped>
.agent-chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #4c1d95 100%);
  color: #f8fafc;
  font-family: 'Inter', sans-serif;
}

.cosmic-header {
  padding: 1rem 1.5rem;
  background-color: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(139, 92, 246, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.cosmic-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(90deg, #a78bfa, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
}

.agent-mode-selector {
  display: flex;
  gap: 0.5rem;
}

.mode-button {
  background-color: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s ease;
}

.mode-button:hover {
  background-color: rgba(30, 41, 59, 1);
  color: #f8fafc;
}

.mode-button.active {
  background-color: #4f46e5;
  border-color: #6366f1;
  color: white;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
}

.chat-content-area {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.messages-panel {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.messages-container {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.welcome-message {
  background-color: rgba(30, 41, 59, 0.5);
  border-radius: 0.75rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: 2rem 0;
}

.welcome-icon {
  background: linear-gradient(135deg, #4f46e5, #8b5cf6);
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.welcome-message h2 {
  margin: 0.5rem 0;
  font-size: 1.5rem;
  background: linear-gradient(90deg, #a78bfa, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-message p {
  color: #94a3b8;
  margin-bottom: 1.5rem;
}

.welcome-tips {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
  width: 100%;
}

.tip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #cbd5e1;
}

.tip i {
  color: #8b5cf6;
  font-size: 1.25rem;
}

.message {
  display: flex;
  margin-bottom: 1rem;
  animation: fadeIn 0.3s ease;
}

.user-message {
  justify-content: flex-end;
}

.assistant-message {
  justify-content: flex-start;
}

.system-message {
  justify-content: center;
  margin: 0.5rem 0;
}

.message-avatar {
  margin: 0 0.5rem;
  flex-shrink: 0;
}

.user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
}

.assistant-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  position: relative;
}

.assistant-avatar.thinking::after {
  content: '';
  position: absolute;
  top: -5px;
  right: -5px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: #10b981;
  animation: pulse 1.5s infinite;
}

.message-content {
  max-width: 80%;
  background-color: rgba(30, 41, 59, 0.7);
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  position: relative;
}

.user-message .message-content {
  background-color: rgba(79, 70, 229, 0.4);
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.message-text {
  color: #e2e8f0;
  line-height: 1.5;
  word-break: break-word;
}

.message-text p {
  margin: 0.5rem 0;
}

.message-text p:first-child {
  margin-top: 0;
}

.message-text p:last-child {
  margin-bottom: 0;
}

.message-text a {
  color: #93c5fd;
  text-decoration: underline;
}

.message-text pre {
  background-color: rgba(15, 23, 42, 0.5);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}

.message-text code {
  font-family: 'Fira Code', monospace;
  font-size: 0.875rem;
}

.message-time {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
  text-align: right;
}

.system-content {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: rgba(51, 65, 85, 0.5);
  border-radius: 2rem;
  font-size: 0.875rem;
  color: #cbd5e1;
}

.thinking-indicator {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.thinking-text {
  font-size: 1rem;
  color: #cbd5e1;
}

.thinking-dots {
  display: flex;
  gap: 0.25rem;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #8b5cf6;
  animation: bounceDots 1.4s infinite ease-in-out both;
}

.thinking-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

.browser-panel {
  width: 40%;
  max-width: 800px;
  min-width: 400px;
  background-color: #0f172a;
  border-left: 1px solid rgba(139, 92, 246, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.browser-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #1e293b;
  border-bottom: 1px solid #334155;
}

.browser-tools {
  display: flex;
  gap: 0.5rem;
}

.browser-tool-button {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: #94a3b8;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.browser-tool-button:hover {
  background-color: #334155;
  color: white;
}

.browser-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

.status-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #94a3b8;
}

.status-indicator.active .status-pulse {
  background-color: #10b981;
  animation: pulse 2s infinite;
}

.action-log {
  border-top: 1px solid #334155;
  margin-top: auto;
  max-height: 35%;
  display: flex;
  flex-direction: column;
}

.action-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #1e293b;
}

.action-log-header h3 {
  margin: 0;
  font-size: 0.875rem;
  color: #cbd5e1;
}

.toggle-log-button {
  background-color: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
}

.action-log-content {
  overflow-y: auto;
  padding: 0.5rem;
  flex: 1;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.375rem;
  margin-bottom: 0.25rem;
  background-color: rgba(30, 41, 59, 0.5);
  transition: all 0.2s ease;
}

.action-item.current {
  background-color: rgba(79, 70, 229, 0.2);
  border-left: 3px solid #4f46e5;
}

.action-item.completed {
  opacity: 0.7;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: rgba(51, 65, 85, 0.5);
  border-radius: 0.375rem;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.action-details {
  flex: 1;
  overflow: hidden;
  font-size: 0.875rem;
}

.action-description {
  color: #cbd5e1;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-data {
  color: #94a3b8;
  font-size: 0.75rem;
}

.action-label {
  color: #64748b;
}

.action-status {
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.spinning {
  animation: spin 1.5s linear infinite;
}

.input-area {
  padding: 1rem;
  background-color: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(139, 92, 246, 0.3);
}

.input-container {
  display: flex;
  background-color: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 0.75rem;
  padding: 0.75rem;
  transition: all 0.2s ease;
}

.input-container:focus-within {
  border-color: #4f46e5;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

.message-input {
  flex: 1;
  background-color: transparent;
  border: none;
  color: #e2e8f0;
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  outline: none;
  max-height: 120px;
  min-height: 24px;
}

.message-input::placeholder {
  color: #64748b;
}

.send-button {
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 0.5rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-end;
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  background-color: #4338ca;
  transform: translateY(-1px);
}

.send-button:disabled {
  background-color: #4f46e5;
  opacity: 0.5;
  cursor: not-allowed;
}

.input-options {
  display: flex;
  margin-top: 0.5rem;
  gap: 0.5rem;
}

.option-button {
  background-color: transparent;
  color: #94a3b8;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-button:hover {
  background-color: rgba(51, 65, 85, 0.5);
  color: #cbd5e1;
}

.option-button.active {
  background-color: rgba(79, 70, 229, 0.2);
  border-color: #4f46e5;
  color: #a5b4fc;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounceDots {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .chat-content-area {
    flex-direction: column;
  }
  
  .browser-panel {
    width: 100%;
    min-width: unset;
    max-width: unset;
    height: 50%;
    border-left: none;
    border-top: 1px solid rgba(139, 92, 246, 0.3);
  }
  
  .messages-panel {
    height: 50%;
  }
}
</style>