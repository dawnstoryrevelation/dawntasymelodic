<!-- src/views/AgentChatView.vue -->
<template>
  <div class="agent-chat-container">
    <!-- Main two-column layout -->
    <div class="agent-chat-layout" :class="{ 'browser-active': showBrowser }">
      <!-- Chat Panel -->
      <div class="chat-panel">
        <div class="chat-header">
          <h1 class="chat-title">DawntasyAI Agent</h1>
          <div class="chat-controls">
            <button @click="startNewChat" class="control-button">
              <i class="ri-add-line"></i> New Chat
            </button>
            <button v-if="showBrowser" @click="toggleBrowser" class="control-button">
              <i class="ri-computer-line"></i> Hide Browser
            </button>
            <button v-else @click="toggleBrowser" class="control-button">
              <i class="ri-computer-line"></i> Show Browser
            </button>
          </div>
        </div>

        <!-- Chat Messages Area -->
        <div ref="messagesContainer" class="messages-container">
          <div v-if="messages.length === 0" class="empty-chat">
            <div class="empty-chat-content">
              <h2>Welcome to DawntasyAI Agent</h2>
              <p>Ask me to search the web, analyze images, or help with complex tasks.</p>
              <div class="suggestion-chips">
                <button @click="insertSuggestion('Search for the latest AI research papers')" class="suggestion-chip">
                  Search for AI research
                </button>
                <button @click="insertSuggestion('Find me a chocolate cake recipe')" class="suggestion-chip">
                  Find a cake recipe
                </button>
                <button @click="insertSuggestion('What movies are playing near me?')" class="suggestion-chip">
                  Find movies nearby
                </button>
              </div>
            </div>
          </div>

          <div v-for="(message, index) in messages" :key="index" class="message-wrapper"
            :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }">
            
            <!-- User Message -->
            <div v-if="message.role === 'user'" class="message user-message">
              <div class="message-content">
                <p>{{ message.content }}</p>
                <div v-if="message.files && message.files.length > 0" class="file-attachments">
                  <div v-for="(file, fileIndex) in message.files" :key="fileIndex" class="file-attachment">
                    <div class="file-preview" v-if="isImageFile(file)">
                      <img :src="file.dataUrl" alt="Uploaded image" />
                    </div>
                    <div class="file-info">
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Message -->
            <div v-else-if="message.role === 'assistant'" class="message ai-message">
              <div class="ai-avatar">
                <div class="ai-icon" :class="message.mood || 'neutral'">
                  <i class="ri-robot-line"></i>
                </div>
              </div>
              <div class="message-content">
                <!-- Thinking/Processing States -->
                <div v-if="message.isThinking" class="thinking-indicator">
                  <span class="thinking-text">{{ message.thinkingState }}</span>
                  <span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>

                <!-- Regular Message Content -->
                <div v-else>
                  <div class="markdown-content" v-html="formatMessage(message.content)"></div>
                </div>

                <!-- Reasoning Toggle Button -->
                <div v-if="message.reasoning" class="reasoning-toggle">
                  <button @click="showReasoningModal(message)" class="reasoning-button">
                    <i class="ri-brain-line"></i> View Thinking Process
                  </button>
                </div>

                <!-- Browser Toggle (only for actions that used browser) -->
                <div v-if="message.usedBrowser" class="browser-toggle">
                  <button @click="toggleBrowser" class="browser-button">
                    <i class="ri-computer-line"></i> {{ showBrowser ? 'Hide' : 'Show' }} Browser
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Current Thinking Message (if AI is currently processing) -->
          <div v-if="isProcessing" class="message-wrapper ai-message">
            <div class="ai-avatar">
              <div class="ai-icon thinking">
                <i class="ri-brain-line"></i>
              </div>
            </div>
            <div class="message-content">
              <div class="thinking-indicator">
                <span class="thinking-text">{{ currentThinkingState }}</span>
                <span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="input-container">
          <div class="file-preview-bar" v-if="uploadedFiles.length > 0">
            <div v-for="(file, index) in uploadedFiles" :key="index" class="file-preview-item">
              <span class="file-name">Attached: {{ file.name }}</span>
              <button @click="removeFile(index)" class="remove-file-button">
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>
          <div class="input-area">
            <textarea
              ref="inputField"
              v-model="inputMessage"
              @keydown.enter.prevent="sendMessage"
              placeholder="Message DawntasyAI Agent..."
              rows="1"
              class="message-input"
            ></textarea>
            <div class="input-buttons">
              <label class="upload-button">
                <i class="ri-add-line"></i>
                <input 
                  type="file" 
                  @change="handleFileUpload" 
                  multiple 
                  accept="image/*, .pdf, .doc, .docx, .txt, .csv, .xls, .xlsx"
                  hidden
                />
              </label>
              <button 
                class="reasoning-toggle-button" 
                :class="{ 'active': showReasoning }"
                @click="toggleReasoning"
              >
                <i class="ri-brain-line"></i>
              </button>
              <button class="send-button" @click="sendMessage" :disabled="isProcessing || !canSendMessage">
                <i class="ri-send-plane-fill"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Browser Panel -->
      <div v-show="showBrowser" class="browser-panel">
        <div class="browser-header">
          <h2>DawntasyAI's Screen</h2>
          <div class="browser-controls">
            <button @click="refreshBrowser" class="browser-control-button" title="Refresh">
              <i class="ri-refresh-line"></i>
            </button>
            <button @click="toggleBrowser" class="browser-control-button" title="Close">
              <i class="ri-close-line"></i>
            </button>
          </div>
        </div>
      </div>
        </div>
          <browser-view 
  v-if="browserActive && currentSessionId" 
  ref="browserView"
  :sessionId="currentSessionId || ''"
  @screenshot="handleScreenshot"
  @browser-status="handleBrowserStatus"
/>
<div v-else class="browser-placeholder">
  <div class="placeholder-content">
    <i class="ri-computer-line"></i>
    <p>AI browser will appear when needed.</p>
  </div>
</div>

    <!-- Reasoning Modal -->
    <teleport to="body">
      <div v-if="reasoningModalVisible" class="reasoning-modal-backdrop" @click="hideReasoningModal">
        <div class="reasoning-modal" @click.stop>
          <div class="reasoning-modal-header">
            <h2>DawntasyAI's Thinking Process</h2>
            <button @click="hideReasoningModal" class="close-modal-button">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="reasoning-modal-content">
            <div class="reasoning-text" v-html="formatMessage(selectedReasoning)"></div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import BrowserView from '@/components/agent/BrowserView.vue';
import { useAgentOpenAI } from '@/services/agentOpenAI';
import { usePuppeteerService } from '@/services/puppeteerService';
import { useFirebaseChat } from '@/services/agentFirebase';
import { getAuth } from 'firebase/auth';

// Initialize services
const agentOpenAI = useAgentOpenAI();
const puppeteerService = usePuppeteerService();
const firebaseChat = useFirebaseChat();
const auth = getAuth();

// State variables
const currentChatId = ref(null);
const messages = ref([]);
const inputMessage = ref('');
const uploadedFiles = ref([]);
const isProcessing = ref(false);
const currentThinkingState = ref('Thinking');
const thinkingStates = [
  'Thinking',
  'Analyzing your request',
  'Processing information',
  'Searching the web',
  'Examining data',
  'Gathering resources',
  'Comparing options',
  'Synthesizing information',
  'Evaluating solutions',
  'Planning next steps',
  'Formulating response'
];

// Browser state
const showBrowser = ref(false);
const browserActive = ref(false);
const currentSessionId = ref(null);
const browserScreenshots = ref([]);

// Reasoning state
const showReasoning = ref(true);
const reasoningModalVisible = ref(false);
const selectedReasoning = ref('');

// DOM references
const messagesContainer = ref(null);
const inputField = ref(null);
const browserView = ref(null);

// Computed properties
const canSendMessage = computed(() => {
  return inputMessage.value.trim() !== '' || uploadedFiles.value.length > 0;
});

// Initialize chat
onMounted(async () => {
  // Generate a new chat ID if not loaded from existing chat
  currentChatId.value = uuidv4();
  
  // Auto focus the input field
  if (inputField.value) {
    inputField.value.focus();
  }
  
  // Check if user is authenticated
  const user = auth.currentUser;
  if (user) {
    try {
      // Load chat history if this is an existing chat
      // Implement this when you have the chat ID from the route
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }
});

// Methods
const startNewChat = () => {
  messages.value = [];
  uploadedFiles.value = [];
  inputMessage.value = '';
  currentChatId.value = uuidv4();
  showBrowser.value = false;
  browserActive.value = false;
  if (currentSessionId.value) {
    puppeteerService.endSession(currentSessionId.value);
    currentSessionId.value = null;
  }
};

const toggleBrowser = () => {
  showBrowser.value = !showBrowser.value;
};

const refreshBrowser = async () => {
  if (browserView.value && browserActive.value) {
    await browserView.value.refresh();
  }
};

const sendMessage = async () => {
  if (isProcessing.value || (!inputMessage.value.trim() && uploadedFiles.value.length === 0)) {
    return;
  }

  const messageContent = inputMessage.value.trim();
  
  // Add user message to chat
  const userMessage = {
    role: 'user',
    content: messageContent,
    timestamp: new Date(),
    files: [...uploadedFiles.value]
  };
  
  messages.value.push(userMessage);
  
  // Clear input and files
  inputMessage.value = '';
  uploadedFiles.value = [];
  
  // Scroll to bottom
  await nextTick();
  scrollToBottom();
  
  // Start processing
  isProcessing.value = true;
  startThinkingAnimation();
  
  // Start a browser session if needed
  if (!currentSessionId.value) {
    try {
      const { sessionId } = await puppeteerService.startSession();
      currentSessionId.value = sessionId;
    } catch (error) {
      console.error('Failed to start browser session:', error);
    }
  }
  
  try {
    // Initialize response placeholder with thinking state
    const responsePlaceholder = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isThinking: true,
      thinkingState: currentThinkingState.value,
      mood: 'thinking',
      reasoning: '',
      usedBrowser: false
    };
    
    messages.value.push(responsePlaceholder);
    
    // Generate reasoning first
    const reasoningResponse = await agentOpenAI.generateReasoning(
      messageContent, 
      extractChatHistory(),
      userMessage.files
    );
    
    const reasoningText = reasoningResponse.content;
    
    // Update placeholder with reasoning
    const responseIndex = messages.value.length - 1;
    messages.value[responseIndex].reasoning = reasoningText;
    
    // Determine if we need to use the browser
    const shouldUseBrowser = needsBrowserAutomation(messageContent, reasoningText);
    
    if (shouldUseBrowser) {
      // Update thinking state
      messages.value[responseIndex].thinkingState = 'Browsing the web';
      messages.value[responseIndex].usedBrowser = true;
      browserActive.value = true;
      
      // Show browser if it's not already visible
      if (!showBrowser.value) {
        showBrowser.value = true;
      }
      
      // Execute browser actions
      const browserActions = await agentOpenAI.generateBrowserActions(
        messageContent,
        reasoningText
      );
      
      for (const action of browserActions) {
        // Update the thinking state to show what action is being taken
        messages.value[responseIndex].thinkingState = `${action.type}: ${action.description}`;
        
        // Execute the browser action
        await puppeteerService.executeAction(currentSessionId.value, action);
        
        // Capture screenshot after action
        const screenshot = await puppeteerService.takeScreenshot(currentSessionId.value);
        browserScreenshots.value.push(screenshot);
      }
    }
    
    // Generate final response
    const finalResponse = await agentOpenAI.generateResponse(
      messageContent,
      extractChatHistory(),
      userMessage.files,
      reasoningText,
      browserScreenshots.value
    );
    
    // Update message with final response
    messages.value[responseIndex] = {
      role: 'assistant',
      content: finalResponse.content,
      timestamp: new Date(),
      isThinking: false,
      mood: finalResponse.mood || 'neutral',
      reasoning: reasoningText,
      usedBrowser: shouldUseBrowser
    };
    
    // Save messages to Firebase
    if (auth.currentUser) {
      await firebaseChat.saveChat(currentChatId.value, messages.value);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    
    // Add error message
    messages.value.push({
      role: 'assistant',
      content: 'I encountered an error while processing your request. Please try again.',
      timestamp: new Date(),
      isThinking: false,
      mood: 'sad'
    });
  } finally {
    isProcessing.value = false;
    
    // Scroll to bottom
    await nextTick();
    scrollToBottom();
  }
};

const handleFileUpload = (event) => {
  const files = Array.from(event.target.files);
  
  files.forEach(file => {
    // Create a reader for file preview
    const reader = new FileReader();
    
    reader.onload = (e) => {
      uploadedFiles.value.push({
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
        dataUrl: e.target.result
      });
    };
    
    reader.readAsDataURL(file);
  });
  
  // Reset the input element
  event.target.value = '';
};

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1);
};

const formatMessage = (content) => {
  if (!content) return '';
  
  // Configure marked with highlighting
  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true
  });
  
  // Convert markdown to HTML and sanitize
  const rawHtml = marked.parse(content);
  return DOMPurify.sanitize(rawHtml);
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

const isImageFile = (file) => {
  return file && file.type && file.type.startsWith('image/');
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const insertSuggestion = (suggestion) => {
  inputMessage.value = suggestion;
  inputField.value.focus();
};

const startThinkingAnimation = () => {
  // Rotate through thinking states
  let stateIndex = 0;
  const intervalId = setInterval(() => {
    stateIndex = (stateIndex + 1) % thinkingStates.length;
    currentThinkingState.value = thinkingStates[stateIndex];
    
    // Update the last message if it's a thinking message
    if (!isProcessing.value) {
      clearInterval(intervalId);
      return;
    }
    
    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage && lastMessage.isThinking) {
      lastMessage.thinkingState = currentThinkingState.value;
    }
  }, 3000);
};

const toggleReasoning = () => {
  showReasoning.value = !showReasoning.value;
};

const showReasoningModal = (message) => {
  selectedReasoning.value = message.reasoning;
  reasoningModalVisible.value = true;
};

const hideReasoningModal = () => {
  reasoningModalVisible.value = false;
};

const extractChatHistory = () => {
  return messages.value.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

const handleScreenshot = (screenshotData) => {
  browserScreenshots.value.push(screenshotData);
};

const handleBrowserStatus = (status) => {
  browserActive.value = status.active;
};

const needsBrowserAutomation = (message, reasoning) => {
  // Simple heuristic based on keywords and reasoning
  const automationKeywords = [
    'search', 'find', 'look up', 'google', 'browse', 'website', 'page',
    'check', 'compare', 'book', 'reserve', 'navigate', 'go to'
  ];
  
  const lowerMessage = message.toLowerCase();
  const lowerReasoning = reasoning.toLowerCase();
  
  // Check if any automation keywords are in the message or reasoning
  const needsAutomation = automationKeywords.some(keyword => 
    lowerMessage.includes(keyword) || lowerReasoning.includes(keyword)
  );
  
  // Also check for explicit browser references
  const explicitBrowserReference = lowerMessage.includes('browser') || 
                                 lowerReasoning.includes('browser') ||
                                 lowerReasoning.includes('web search') ||
                                 lowerReasoning.includes('search engine');
  
  return needsAutomation || explicitBrowserReference;
};
</script>

<style scoped>
.agent-chat-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #0f172a;
  color: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.agent-chat-layout {
  display: flex;
  height: 100%;
  width: 100%;
  transition: all 0.3s ease;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 100%;
  transition: all 0.3s ease;
}

.browser-active .chat-panel {
  flex: 0 0 50%;
  max-width: 50%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #1e293b;
  border-bottom: 1px solid #334155;
}

.chat-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #60a5fa;
  margin: 0;
}

.chat-controls {
  display: flex;
  gap: 0.5rem;
}

.control-button {
  background-color: #334155;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.control-button:hover {
  background-color: #475569;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 90%;
  animation: fadeIn 0.3s ease;
}

.user-message {
  align-self: flex-end;
}

.ai-message {
  align-self: flex-start;
  display: flex;
  gap: 0.75rem;
}

.message {
  padding: 1rem;
  border-radius: 12px;
  position: relative;
}

.user-message .message-content {
  background-color: #3b82f6;
  color: white;
  border-radius: 12px;
  padding: 1rem;
}

.ai-message .message-content {
  background-color: #1e293b;
  color: white;
  border-radius: 12px;
  padding: 1rem;
}

.ai-avatar {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.ai-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #3b82f6;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.25rem;
}

.ai-icon.thinking {
  background-color: #8b5cf6;
  animation: pulse 2s infinite;
}

.ai-icon.excited {
  background-color: #f59e0b;
}

.ai-icon.happy {
  background-color: #10b981;
}

.ai-icon.sad {
  background-color: #6b7280;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.thinking-text {
  font-weight: 500;
}

.thinking-dots {
  display: flex;
}

.thinking-dots span {
  opacity: 0;
  animation: dotFade 1.4s infinite;
  animation-fill-mode: both;
}

.thinking-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.reasoning-toggle, .browser-toggle {
  margin-top: 0.75rem;
}

.reasoning-button, .browser-button {
  background-color: transparent;
  color: #60a5fa;
  border: 1px solid #60a5fa;
  border-radius: 6px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reasoning-button:hover, .browser-button:hover {
  background-color: rgba(96, 165, 250, 0.1);
}

.input-container {
  padding: 1rem;
  background-color: #1e293b;
  border-top: 1px solid #334155;
}

.file-preview-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.file-preview-item {
  background-color: #334155;
  color: white;
  border-radius: 6px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remove-file-button {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  font-size: 1rem;
}

.remove-file-button:hover {
  color: white;
}

.input-area {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  background-color: #334155;
  color: white;
  border: 1px solid #475569;
  border-radius: 12px;
  resize: none;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  max-height: 150px;
  transition: all 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.3);
}

.input-buttons {
  display: flex;
  gap: 0.5rem;
}

.upload-button, .reasoning-toggle-button, .send-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: none;
  background-color: #334155;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-button:hover, .reasoning-toggle-button:hover, .send-button:hover {
  background-color: #475569;
}

.reasoning-toggle-button.active {
  background-color: #3b82f6;
}

.send-button {
  background-color: #3b82f6;
}

.send-button:hover {
  background-color: #2563eb;
}

.send-button:disabled {
  background-color: #334155;
  cursor: not-allowed;
  opacity: 0.7;
}

.file-attachments {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-attachment {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.5rem;
}

.file-preview {
  width: 3rem;
  height: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #334155;
  border-radius: 4px;
  overflow: hidden;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-weight: 500;
}

.file-size {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Browser Panel Styles */
.browser-panel {
  flex: 0 0 50%;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  background-color: #0f172a;
  border-left: 1px solid #334155;
  animation: slideIn 0.3s ease;
}

.browser-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #1e293b;
  border-bottom: 1px solid #334155;
}

.browser-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #60a5fa;
  margin: 0;
}

.browser-controls {
  display: flex;
  gap: 0.5rem;
}

.browser-control-button {
  background-color: #334155;
  color: white;
  border: none;
  border-radius: 6px;
  width: 2rem;
  height: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.browser-control-button:hover {
  background-color: #475569;
}

.browser-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.browser-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1e293b;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #94a3b8;
  text-align: center;
  padding: 2rem;
}

.placeholder-content i {
  font-size: 3rem;
}

.placeholder-content p {
  font-size: 1.125rem;
}

/* Empty Chat Styles */
.empty-chat {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.empty-chat-content {
  max-width: 30rem;
  padding: 2rem;
}

.empty-chat h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #60a5fa;
  margin-bottom: 1rem;
}

.empty-chat p {
  font-size: 1.125rem;
  color: #94a3b8;
  margin-bottom: 2rem;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.suggestion-chip {
  background-color: #334155;
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-chip:hover {
  background-color: #3b82f6;
}

/* Reasoning Modal Styles */
.reasoning-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.reasoning-modal {
  width: 90%;
  max-width: 48rem;
  max-height: 80vh;
  background-color: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: scaleIn 0.2s ease;
}

.reasoning-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #334155;
  border-bottom: 1px solid #475569;
}

.reasoning-modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #60a5fa;
  margin: 0;
}

.close-modal-button {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.close-modal-button:hover {
  color: white;
}

.reasoning-modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.reasoning-text {
  line-height: 1.7;
}

/* Markdown content styles */
.markdown-content {
  line-height: 1.7;
}

.markdown-content p {
  margin-top: 0;
  margin-bottom: 1rem;
}

.markdown-content h1, 
.markdown-content h2, 
.markdown-content h3, 
.markdown-content h4 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: #60a5fa;
  font-weight: 600;
}

.markdown-content h1 {
  font-size: 1.5rem;
}

.markdown-content h2 {
  font-size: 1.25rem;
}

.markdown-content h3 {
  font-size: 1.125rem;
}

.markdown-content h4 {
  font-size: 1rem;
}

.markdown-content ul, 
.markdown-content ol {
  margin-top: 0;
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.markdown-content li {
  margin-bottom: 0.5rem;
}

.markdown-content a {
  color: #60a5fa;
  text-decoration: underline;
}

.markdown-content code {
  background-color: #334155;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 0.875em;
}

.markdown-content pre {
  background-color: #0f172a;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin-top: 0;
  margin-bottom: 1rem;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes dotFade {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}

/* Responsive Styles */
@media (max-width: 768px) {
  .agent-chat-layout {
    flex-direction: column;
  }
  
  .chat-panel, .browser-active .chat-panel {
    flex: 1 0 50%;
    max-width: 100%;
    height: 50%;
  }
  
  .browser-panel {
    flex: 1 0 50%;
    max-width: 100%;
    height: 50%;
    border-left: none;
    border-top: 1px solid #334155;
  }
}
</style>