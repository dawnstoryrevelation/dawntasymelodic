<!-- src/views/AgentChatView.vue - SUPERCHARGED VERSION! -->
<template>
  <div class="agent-chat-container">
    <!-- Main two-column layout with enhanced responsiveness -->
    <div class="agent-chat-layout" :class="{ 'browser-active': showBrowser }">
      <!-- Chat Panel - Enhanced with visual indicators -->
      <div class="chat-panel">
        <div class="chat-header">
          <h1 class="chat-title">
            <i class="ri-robot-line"></i> DawntasyAI Agent
            <span class="status-badge" :class="{ 'active': isActive }">
              {{ isActive ? 'ONLINE' : 'STANDBY' }}
            </span>
          </h1>
          <div class="chat-controls">
            <button @click="startNewChat" class="control-button new-chat-button">
              <i class="ri-add-line"></i> New Session
            </button>
            <button v-if="showBrowser" @click="toggleBrowser" class="control-button">
              <i class="ri-computer-line"></i> Hide Browser
            </button>
            <button v-else @click="toggleBrowser" class="control-button">
              <i class="ri-computer-line"></i> Show Browser
            </button>
          </div>
        </div>

        <!-- Enhanced Chat Messages Area with scroll animations -->
        <div ref="messagesContainer" class="messages-container">
          <div v-if="messages.length === 0" class="empty-chat">
            <div class="empty-chat-content">
              <div class="ai-agent-logo">
                <i class="ri-robot-line"></i>
              </div>
              <h2>Welcome to DawntasyAI Web Agent</h2>
              <p>I can search the web, analyze images, and help with complex tasks in real-time. Watch me browse the web to find exactly what you need!</p>
              <div class="suggestion-chips">
                <button @click="insertSuggestion('Find me the latest news about artificial intelligence')" class="suggestion-chip">
                  <i class="ri-article-line"></i> AI News
                </button>
                <button @click="insertSuggestion('Search for a chocolate cake recipe with easy ingredients')" class="suggestion-chip">
                  <i class="ri-cake-3-line"></i> Cake Recipe
                </button>
                <button @click="insertSuggestion('What are the best laptop models for developers in 2025?')" class="suggestion-chip">
                  <i class="ri-laptop-line"></i> Best Laptops
                </button>
                <button @click="insertSuggestion('Compare prices for flights from New York to Tokyo next month')" class="suggestion-chip">
                  <i class="ri-flight-takeoff-line"></i> Flight Prices
                </button>
              </div>
            </div>
          </div>

          <div v-for="(message, index) in messages" :key="index" class="message-wrapper"
            :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }">
            
            <!-- Enhanced User Message with Rich Media Support -->
            <div v-if="message.role === 'user'" class="message user-message">
              <div class="user-avatar">
                <div class="avatar-icon">
                  <i class="ri-user-line"></i>
                </div>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="sender-name">You</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
                <p>{{ message.content }}</p>
                <div v-if="message.files && message.files.length > 0" class="file-attachments">
                  <div v-for="(file, fileIndex) in message.files" :key="fileIndex" class="file-attachment">
                    <div class="file-preview" v-if="isImageFile(file)">
                      <img :src="file.dataUrl" alt="Uploaded image" @click="enlargeImage(file.dataUrl)" />
                    </div>
                    <div class="file-info">
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Super-Enhanced AI Message with Thinking Animations & Typing Indicator -->
            <div v-else-if="message.role === 'assistant'" class="message ai-message">
              <div class="ai-avatar">
                <div class="ai-icon" :class="message.mood || 'neutral'">
                  <i v-if="message.isThinking" class="ri-brain-line"></i>
                  <i v-else class="ri-robot-line"></i>
                </div>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="sender-name">DawntasyAI</span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
                
                <!-- Enhanced Thinking/Processing States with Animations -->
                <div v-if="message.isThinking" class="thinking-indicator">
                  <div class="thinking-animation">
                    <div class="thinking-stage">
                      <div class="thinking-icon">
                        <i class="ri-brain-line"></i>
                      </div>
                      <span class="thinking-text">{{ message.thinkingState }}</span>
                    </div>
                    <div class="thinking-dots"><span>.</span><span>.</span><span>.</span></div>
                  </div>
                  
                  <!-- NEW: Thinking Timeline Progress -->
                  <div class="thinking-timeline" v-if="message.thinkingProgress">
                    <div class="thinking-progress-outer">
                      <div class="thinking-progress-inner" :style="{ width: message.thinkingProgress + '%' }"></div>
                    </div>
                  </div>
                </div>

                <!-- Regular Message Content with Enhanced Markdown -->
                <div v-else>
                  <div class="markdown-content" v-html="formatMessage(message.content)"></div>
                </div>

                <!-- Enhanced Action Buttons with Accessibility Labels -->
                <div class="message-actions">
                  <!-- Reasoning Toggle Button -->
                  <div v-if="message.reasoning" class="action-button-container">
                    <button @click="showReasoningModal(message)" class="action-button reasoning-button" title="View AI's thinking process">
                      <i class="ri-brain-line"></i> Thinking Process
                    </button>
                  </div>

                  <!-- Browser Toggle Button with Enhanced UI -->
                  <div v-if="message.usedBrowser" class="action-button-container">
                    <button @click="toggleBrowser" class="action-button browser-button" :class="{ 'active': showBrowser }" title="Toggle browser view">
                      <i class="ri-computer-line"></i> {{ showBrowser ? 'Hide' : 'Show' }} Browser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Enhanced Current Thinking Message (if AI is currently processing) -->
          <div v-if="isProcessing" class="message-wrapper ai-message">
            <div class="ai-avatar">
              <div class="ai-icon thinking">
                <i class="ri-brain-line"></i>
              </div>
            </div>
            <div class="message-content">
              <div class="message-header">
                <span class="sender-name">DawntasyAI</span>
                <span class="message-time">{{ formatTime(new Date()) }}</span>
              </div>
              
              <div class="thinking-indicator">
                <div class="thinking-animation">
                  <div class="thinking-stage">
                    <div class="thinking-icon">
                      <i class="ri-brain-line"></i>
                    </div>
                    <span class="thinking-text">{{ currentThinkingState }}</span>
                  </div>
                  <div class="thinking-dots"><span>.</span><span>.</span><span>.</span></div>
                </div>
                
                <!-- Progressive Timeline for Thinking -->
                <div class="thinking-timeline">
                  <div class="thinking-progress-outer">
                    <div class="thinking-progress-inner" :style="{ width: thinkingProgress + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Input Area with Typing Animation -->
        <div class="input-container">
          <div class="file-preview-bar" v-if="uploadedFiles.length > 0">
            <div v-for="(file, index) in uploadedFiles" :key="index" class="file-preview-item">
              <span class="file-icon" v-if="isImageFile(file)">
                <i class="ri-image-line"></i>
              </span>
              <span class="file-icon" v-else>
                <i class="ri-file-line"></i>
              </span>
              <span class="file-name">{{ file.name }}</span>
              <button @click="removeFile(index)" class="remove-file-button" title="Remove file">
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>
          <div class="input-area">
            <textarea
              ref="inputField"
              v-model="inputMessage"
              @keydown.enter.prevent="onEnterKey"
              placeholder="Ask me to search the web for anything..."
              rows="1"
              class="message-input"
              :disabled="isProcessing"
              @input="autoResizeTextarea"
            ></textarea>
            <div class="input-buttons">
              <label class="upload-button" :class="{ 'disabled': isProcessing }" title="Upload file">
                <i class="ri-attachment-line"></i>
                <input 
                  type="file" 
                  @change="handleFileUpload" 
                  multiple 
                  accept="image/*, .pdf, .doc, .docx, .txt, .csv, .xls, .xlsx"
                  hidden
                  :disabled="isProcessing"
                />
              </label>
              <button 
                class="reasoning-toggle-button" 
                :class="{ 'active': showReasoning }"
                @click="toggleReasoning"
                title="Toggle reasoning display"
              >
                <i class="ri-brain-line"></i>
              </button>
              <button 
                class="send-button" 
                @click="sendMessage" 
                :disabled="isProcessing || !canSendMessage"
                title="Send message"
              >
                <i class="ri-send-plane-fill"></i>
              </button>
            </div>
          </div>
          <div class="input-status" v-if="isProcessing">
            <i class="ri-loader-4-line spinning"></i> AI is processing your request...
          </div>
        </div>
      </div>

      <!-- Enhanced Browser Panel with Animated Transitions -->
      <div v-if="showBrowser" class="browser-panel">
        <div class="browser-header">
          <h2><i class="ri-computer-line"></i> AI's Web Browser</h2>
          <div class="browser-controls">
            <button @click="refreshBrowser" class="browser-control-button" title="Refresh browser">
              <i class="ri-refresh-line"></i>
            </button>
            <button @click="toggleBrowser" class="browser-control-button" title="Close browser view">
              <i class="ri-close-line"></i>
            </button>
          </div>
        </div>
        <div class="browser-container">
          <browser-view 
            v-if="currentSessionId" 
            ref="browserView"
            :sessionId="currentSessionId"
            @screenshot="handleScreenshot"
            @browser-status="handleBrowserStatus"
            @typing-status="handleTypingStatus"
          />
          <div v-else class="browser-placeholder">
            <div class="placeholder-content">
              <i class="ri-computer-line"></i>
              <p>AI's web browser will appear here when needed.</p>
              <button @click="initBrowser" class="init-browser-button">
                <i class="ri-rocket-line"></i> Launch Browser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Reasoning Modal with Code Highlighting and Better Structure -->
    <teleport to="body">
      <div v-if="reasoningModalVisible" class="reasoning-modal-backdrop" @click="hideReasoningModal">
        <div class="reasoning-modal" @click.stop>
          <div class="reasoning-modal-header">
            <h2><i class="ri-brain-line"></i> DawntasyAI's Thinking Process</h2>
            <button @click="hideReasoningModal" class="close-modal-button" title="Close modal">
              <i class="ri-close-line"></i>
            </button>
          </div>
          <div class="reasoning-modal-content">
            <div class="reasoning-text" v-html="formatMessage(selectedReasoning)"></div>
          </div>
        </div>
      </div>
    </teleport>
    
    <!-- Image Viewer Modal -->
    <teleport to="body">
      <div v-if="enlargedImage" class="image-modal-backdrop" @click="enlargedImage = null">
        <div class="image-modal" @click.stop>
          <button @click="enlargedImage = null" class="close-modal-button" title="Close image">
            <i class="ri-close-line"></i>
          </button>
          <img :src="enlargedImage" alt="Enlarged image" class="enlarged-image" />
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
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
import { format } from 'date-fns';

// Initialize services
const agentOpenAI = useAgentOpenAI();
const puppeteerService = usePuppeteerService();
const firebaseChat = useFirebaseChat();
const auth = getAuth();

// State variables with enhanced tracking
const currentChatId = ref(null);
const messages = ref([]);
const inputMessage = ref('');
const uploadedFiles = ref([]);
const isProcessing = ref(false);
const currentThinkingState = ref('Thinking');
const thinkingProgress = ref(0);
const isActive = ref(false);
const enlargedImage = ref(null);

// Enhanced thinking states for more dynamic visualization
const thinkingSteps = ref([]);
let currentThinkingStep = 0;
let thinkingIntervalId = null;

// Browser state with enhanced tracking
const showBrowser = ref(false);
const browserActive = ref(false);
const currentSessionId = ref(null);
const browserScreenshots = ref([]);
const typingStatus = ref({
  isTyping: false,
  text: '',
  selector: null
});

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

// Enhanced chat initialization with error handling
onMounted(async () => {
  console.log("🚀 Initializing AI Agent Chat View");
  
  // Generate a new chat ID if not loaded from existing chat
  currentChatId.value = uuidv4();
  
  // Auto focus the input field
  if (inputField.value) {
    inputField.value.focus();
  }
  
  // Start browser session proactively with optimized loading
  try {
    console.log("🔄 Proactively initializing browser session");
    initBrowser();
  } catch (error) {
    console.error('Error initializing browser session:', error);
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
  
  // Add event listener for browser back button
  window.addEventListener('beforeunload', handleBeforeUnload);
});

// Clean up resources
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  clearThinkingAnimation();
  
  // Clean up browser session
  if (currentSessionId.value) {
    try {
      puppeteerService.endSession(currentSessionId.value);
    } catch (error) {
      console.error('Error ending browser session:', error);
    }
  }
});

// Handle page leave prompt
const handleBeforeUnload = (event) => {
  if (messages.value.length > 1) {
    event.preventDefault();
    event.returnValue = '';
  }
};

// Initialize browser session
const initBrowser = async () => {
  try {
    console.log("🚀 Starting new browser session");
    const { sessionId } = await puppeteerService.startSession();
    currentSessionId.value = sessionId;
    console.log("✅ Browser session started:", sessionId);
    
    // Initialize the browser
    await puppeteerService.initializeBrowser(sessionId);
    browserActive.value = true;
    isActive.value = true;
  } catch (error) {
    console.error('Failed to start browser session:', error);
    // Don't show error to user - we'll handle this gracefully when needed
  }
};

// Methods
const startNewChat = () => {
  if (messages.value.length > 0 && !confirm("Start a new chat? Your current conversation will be saved but cleared from view.")) {
    return;
  }
  
  messages.value = [];
  uploadedFiles.value = [];
  inputMessage.value = '';
  currentChatId.value = uuidv4();
  showBrowser.value = false;
  
  // Keep browser session alive, just hide it
  if (browserView.value) {
    browserView.value.refresh();
  }
  
  // Auto focus the input field
  if (inputField.value) {
    inputField.value.focus();
  }
  
  // Scroll to top
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = 0;
  }
};

const toggleBrowser = () => {
  showBrowser.value = !showBrowser.value;
  
  // If first time showing, make sure we have a browser session
  if (showBrowser.value && !currentSessionId.value) {
    initBrowser();
  }
  
  // Force recalculation of layout
  nextTick(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

const refreshBrowser = async () => {
  if (browserView.value && browserActive.value) {
    await browserView.value.refresh();
  }
};

// Handle Enter key with modifier support
const onEnterKey = (event) => {
  // Only send on plain Enter (not with shift key for new lines)
  if (!event.shiftKey) {
    sendMessage();
  }
};

// Auto resize textarea based on content
const autoResizeTextarea = () => {
  if (!inputField.value) return;
  
  inputField.value.style.height = 'auto';
  inputField.value.style.height = Math.min(inputField.value.scrollHeight, 150) + 'px';
};

// Clear thinking animation interval
const clearThinkingAnimation = () => {
  if (thinkingIntervalId) {
    clearInterval(thinkingIntervalId);
    thinkingIntervalId = null;
  }
};

// Enhanced thinking animation with dynamic steps and progress tracking
const startThinkingAnimation = async (userMessage) => {
  // Clear any existing animation
  clearThinkingAnimation();
  
  // Reset
  thinkingProgress.value = 0;
  currentThinkingStep = 0;
  
  try {
    // Generate dynamic thinking steps based on user query
    thinkingSteps.value = await agentOpenAI.generateThinkingSteps(userMessage);
  } catch (error) {
    console.error('Error generating thinking steps:', error);
    // Fallback to simple thinking states
    thinkingSteps.value = [
      { text: "Analyzing your request...", duration: 2000 },
      { text: "Planning web search strategy...", duration: 2000 },
      { text: "Preparing to browse the web...", duration: 2000 }
    ];
  }
  
  // Calculate total duration for progress tracking
  const totalDuration = thinkingSteps.value.reduce((sum, step) => sum + step.duration, 0);
  let elapsedDuration = 0;
  
  // Rotate through thinking states
  thinkingIntervalId = setInterval(() => {
    if (!isProcessing.value) {
      clearThinkingAnimation();
      return;
    }
    
    // Get current step
    const currentStep = thinkingSteps.value[currentThinkingStep];
    
    // Update thinking state with current step text
    currentThinkingState.value = currentStep.text;
    
    // Update progress percentage
    elapsedDuration += 100; // Interval is 100ms
    thinkingProgress.value = Math.min(95, Math.round((elapsedDuration / totalDuration) * 100));
    
    // Update the last message if it's a thinking message
    const lastMessage = messages.value[messages.value.length - 1];
    if (lastMessage && lastMessage.isThinking) {
      lastMessage.thinkingState = currentThinkingState.value;
      lastMessage.thinkingProgress = thinkingProgress.value;
    }
    
    // Move to next step after duration
    if (elapsedDuration >= (currentThinkingStep + 1) * currentStep.duration) {
      currentThinkingStep = (currentThinkingStep + 1) % thinkingSteps.value.length;
    }
  }, 100);
};

// Enhanced send message function with real-time updates
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
  
  // Reset textarea height
  if (inputField.value) {
    inputField.value.style.height = 'auto';
  }
  
  // Scroll to bottom
  await nextTick();
  scrollToBottom();
  
  // Start processing
  isProcessing.value = true;
  
  // Ensure browser session exists
  if (!currentSessionId.value) {
    try {
      await initBrowser();
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
      thinkingState: "Analyzing your request...",
      thinkingProgress: 0,
      mood: 'thinking',
      reasoning: '',
      usedBrowser: false
    };
    
    messages.value.push(responsePlaceholder);
    
    // Start thinking animation
    startThinkingAnimation(messageContent);
    
    // Generate reasoning first - DEEP ANALYSIS PHASE
    const reasoningResponse = await agentOpenAI.generateReasoning(
      messageContent, 
      extractChatHistory(),
      userMessage.files
    );
    
    const reasoningText = reasoningResponse.content;
    
    // Update placeholder with reasoning
    const responseIndex = messages.value.length - 1;
    messages.value[responseIndex].reasoning = reasoningText;
    
    // ALWAYS use browser for more impressive demos
    // but we'll check reasoning to tailor browsing behavior
    const shouldUseBrowser = true;
    
    if (shouldUseBrowser) {
      // Update thinking state for BROWSING PHASE
      messages.value[responseIndex].thinkingState = 'Searching the web for information...';
      messages.value[responseIndex].usedBrowser = true;
      browserActive.value = true;
      
      // ALWAYS show browser for visual impact
      showBrowser.value = true;
      
      // Make sure browserScreenshots is reset
      browserScreenshots.value = [];
      
      // Generate and execute browser actions with MAXIMUM RESILIENCE!
      try {
        thinkingProgress.value = 30; // Update progress
        
        const browserActions = await agentOpenAI.generateBrowserActions(
          messageContent,
          reasoningText
        );
        
        console.log("🌟 BROWSER ACTIONS:", browserActions);
        thinkingProgress.value = 40;
        
        // FAIL-PROOF ACTION EXECUTION LOOP!
        for (let i = 0; i < browserActions.length; i++) {
          const action = browserActions[i];
          
          // Update the thinking state to show what action is being taken
          messages.value[responseIndex].thinkingState = `${action.type}: ${action.description}`;
          
          // Update progress based on action index
          thinkingProgress.value = 40 + Math.floor((i / browserActions.length) * 40);
          messages.value[responseIndex].thinkingProgress = thinkingProgress.value;
          
          // SUPER-RESILIENT execution with try-catch for EACH action!
          try {
            console.log(`🚀 Executing action: ${action.type} - ${action.description}`);
            
            // For click actions, trigger visual click indicator
            if (action.type === 'click' && browserView.value) {
              browserView.value.simulateClick();
            }
            
            // For scroll actions, trigger visual scroll indicator
            if (action.type === 'scroll' && browserView.value) {
              browserView.value.simulateScroll();
            }
            
            // Execute the action
            await puppeteerService.executeAction(currentSessionId.value, action);
            
            // SHORTER pause for MORE RESPONSIVE ACTION SEQUENCE!
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Capture screenshot after action with ERROR HANDLING!
            try {
              const screenshot = await puppeteerService.takeScreenshot(currentSessionId.value);
              if (screenshot) {
                browserScreenshots.value.push(screenshot);
                console.log(`📸 Screenshot captured after ${action.type} action`);
              }
            } catch (screenshotError) {
              console.error('Error capturing screenshot, BUT CONTINUING:', screenshotError);
              // KEEP GOING ANYWAY - We prioritize actions over screenshots!
            }
          } catch (actionError) {
            console.warn(`⚠️ Action ${action.type} failed but CONTINUING NEXT ACTION:`, actionError);
            // DON'T STOP - Just go to the next action! THIS IS THE KEY FIX!
            continue;
          }
        }
      } catch (actionSequenceError) {
        console.error('🚨 Error in action sequence, but CONTINUING WITH RESPONSE!', actionSequenceError);
        // Even if actions completely fail, we still generate a response!
      }
    }
    
    // Update progress to near complete
    thinkingProgress.value = 90;
    messages.value[responseIndex].thinkingProgress = thinkingProgress.value;
    messages.value[responseIndex].thinkingState = "Synthesizing information...";
    
    // Generate final response - FINAL ANSWER PHASE
    const finalResponse = await agentOpenAI.generateResponse(
      messageContent,
      extractChatHistory(),
      userMessage.files,
      reasoningText,
      browserScreenshots.value
    );
    
    // Complete loading bar
    thinkingProgress.value = 100;
    
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
    
    // Save messages to Firebase if authenticated
    if (auth.currentUser) {
      try {
        await firebaseChat.saveChat(currentChatId.value, messages.value);
      } catch (saveError) {
        console.error('Error saving chat to Firebase:', saveError);
      }
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
    thinkingProgress.value = 0;
    clearThinkingAnimation();
    
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
  
  // Auto focus back to input field
  if (inputField.value) {
    inputField.value.focus();
  }
};

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1);
  
  // Auto focus back to input field
  if (inputField.value) {
    inputField.value.focus();
  }
};

// Enhanced message formatting with better code highlighting
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

// Format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return format(date, 'h:mm a');
};

// Format file size with appropriate units
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

// Check if file is an image
const isImageFile = (file) => {
  return file && file.type && file.type.startsWith('image/');
};

// Smooth scroll to bottom
const scrollToBottom = () => {
  if (messagesContainer.value) {
    const container = messagesContainer.value;
    const targetScroll = container.scrollHeight - container.clientHeight;
    
    // Use smooth scrolling with animation
    const startPosition = container.scrollTop;
    const distance = targetScroll - startPosition;
    const duration = 300; // ms
    const startTime = performance.now();
    
    function scrollStep(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use ease-out function for natural feeling
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      
      container.scrollTop = startPosition + distance * easeProgress;
      
      if (progress < 1) {
        window.requestAnimationFrame(scrollStep);
      }
    }
    
    window.requestAnimationFrame(scrollStep);
  }
};

// Insert suggestion into input field with smooth typing animation
const insertSuggestion = (suggestion) => {
  // Clear any existing text
  inputMessage.value = '';
  
  // Focus the input field
  inputField.value.focus();
  
  // Type suggestion with animation effect
  let currentLength = 0;
  const typingInterval = setInterval(() => {
    if (currentLength < suggestion.length) {
      currentLength++;
      inputMessage.value = suggestion.substring(0, currentLength);
      autoResizeTextarea();
    } else {
      clearInterval(typingInterval);
    }
  }, 20);
};

// Toggle reasoning visibility
const toggleReasoning = () => {
  showReasoning.value = !showReasoning.value;
};

// Show reasoning modal
const showReasoningModal = (message) => {
  selectedReasoning.value = message.reasoning;
  reasoningModalVisible.value = true;
  
  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
};

// Hide reasoning modal
const hideReasoningModal = () => {
  reasoningModalVisible.value = false;
  document.body.style.overflow = '';
};

// Show enlarged image
const enlargeImage = (imageUrl) => {
  enlargedImage.value = imageUrl;
  
  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';
};

// Extract chat history for context
const extractChatHistory = () => {
  return messages.value.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

// Handler for browser screenshot events
const handleScreenshot = (screenshotData) => {
  console.log("📸 New screenshot received!");
  browserScreenshots.value.push(screenshotData);
};

// Handler for browser status events
const handleBrowserStatus = (status) => {
  browserActive.value = status.active;
  isActive.value = status.active;
};

// NEW: Handler for typing status events
const handleTypingStatus = (status) => {
  typingStatus.value = status;
};
</script>

<style scoped>
/* Base Container Styling with Enhanced Visual Appeal */
.agent-chat-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
  color: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.agent-chat-layout {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
  transition: all 0.3s ease;
}

/* Enhanced Chat Panel with Depth Effects */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

.browser-active .chat-panel {
  flex: 0 0 50%;
  width: 50%;
  max-width: 50%;
}

/* Enhanced Header with Status Indicators */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #334155;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chat-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #60a5fa;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chat-title i {
  font-size: 1.25rem;
}

/* Status Badge */
.status-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 9999px;
  background-color: #334155;
  color: #94a3b8;
  margin-left: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.status-badge.active {
  background-color: #10b981;
  color: white;
}

.chat-controls {
  display: flex;
  gap: 0.5rem;
}

/* Enhanced Buttons with Hover Effects */
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
  transition: all 0.2s;
}

.control-button:hover {
  background-color: #475569;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.new-chat-button {
  background-color: #3b82f6;
}

.new-chat-button:hover {
  background-color: #2563eb;
}

/* Enhanced Messages Container with Improved Spacing */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: #0f172a;
  scrollbar-width: thin;
  scrollbar-color: #334155 #1e293b;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: #1e293b;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: #334155;
  border-radius: 3px;
}

/* Message Wrapper and Layout with Enhanced Animation */
.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 90%;
  animation: messageAppear 0.3s ease-out;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-message {
  align-self: flex-end;
}

.ai-message {
  align-self: flex-start;
  display: flex;
  gap: 0.75rem;
}

/* Message Styling with Enhanced Typography and Layout */
.message {
  padding: 0;
  position: relative;
  display: flex;
  gap: 0.75rem;
}

.user-message .message-content {
  background-color: #3b82f6;
  color: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ai-message .message-content {
  background-color: #1e293b;
  color: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Message Header */
.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.sender-name {
  font-weight: 600;
  font-size: 0.875rem;
}

.message-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

/* Avatar Styling */
.ai-avatar, .user-avatar {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.avatar-icon, .ai-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.25rem;
}

.user-avatar .avatar-icon {
  background-color: #6366f1;
}

.ai-icon {
  background-color: #3b82f6;
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

.ai-icon.neutral {
  background-color: #3b82f6;
}

.ai-icon.sad {
  background-color: #6b7280;
}

/* Enhanced Thinking Indicator with Progress Timeline */
.thinking-indicator {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.thinking-animation {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.thinking-stage {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.thinking-icon {
  background-color: rgba(139, 92, 246, 0.2);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.875rem;
  color: #a78bfa;
}

.thinking-text {
  font-weight: 500;
  color: #94a3b8;
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

/* Thinking Progress Timeline */
.thinking-timeline {
  margin-top: 0.25rem;
}

.thinking-progress-outer {
  height: 3px;
  background-color: rgba(148, 163, 184, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.thinking-progress-inner {
  height: 100%;
  background-color: #8b5cf6;
  border-radius: 2px;
  transition: width 0.3s ease-out;
}

/* Message Actions */
.message-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.action-button-container {
  margin-top: 0.25rem;
}

.action-button {
  background-color: transparent;
  border: 1px solid rgba(96, 165, 250, 0.5);
  color: #60a5fa;
  border-radius: 6px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: rgba(96, 165, 250, 0.1);
  border-color: #60a5fa;
}

.action-button.active {
  background-color: rgba(96, 165, 250, 0.2);
  border-color: #60a5fa;
}

/* Enhanced Input Area */
.input-container {
  padding: 1rem;
  background-color: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
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
  animation: fadeIn 0.3s ease;
}

.file-icon {
  display: flex;
  align-items: center;
  font-size: 1rem;
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

.message-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
  transform: translateY(-1px);
}

.upload-button.disabled {
  opacity: 0.7;
  cursor: not-allowed;
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
  transform: none;
}

/* Input Status */
.input-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* File Attachments */
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
  cursor: pointer;
}

.file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.file-preview img:hover {
  transform: scale(1.05);
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

/* Browser Panel with Enhanced Styling */
.browser-panel {
  flex: 0 0 50%;
  width: 50%;
  max-width: 50%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #0f172a;
  border-left: 1px solid #334155;
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease;
}

.browser-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #334155;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.browser-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #60a5fa;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  transition: all 0.2s;
}

.browser-control-button:hover {
  background-color: #475569;
  transform: translateY(-1px);
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
  gap: 1.5rem;
  color: #94a3b8;
  text-align: center;
  padding: 2rem;
  max-width: 400px;
}

.placeholder-content i {
  font-size: 3rem;
  color: #60a5fa;
}

.placeholder-content p {
  font-size: 1.125rem;
  line-height: 1.6;
}

.init-browser-button {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.init-browser-button:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Empty Chat Styling with Enhanced Animation */
.empty-chat {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

.empty-chat-content {
  max-width: 32rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.ai-agent-logo {
  font-size: 3rem;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  animation: pulseFade 2s infinite;
}

.empty-chat h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #60a5fa;
  margin: 0;
}

.empty-chat p {
  font-size: 1.125rem;
  color: #94a3b8;
  line-height: 1.6;
  margin: 0 0 1rem;
}

.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  max-width: 500px;
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
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.suggestion-chip:hover {
  background-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Reasoning Modal with Enhanced Overlay Effects */
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
  backdrop-filter: blur(4px);
}

.reasoning-modal {
  width: 90%;
  max-width: 60rem;
  max-height: 80vh;
  background-color: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  border: 1px solid #334155;
}

.reasoning-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #334155;
  border-bottom: 1px solid #475569;
}

.reasoning-modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #60a5fa;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-modal-button {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-modal-button:hover {
  color: white;
  background-color: rgba(148, 163, 184, 0.1);
}

.reasoning-modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #334155 #1e293b;
}

.reasoning-modal-content::-webkit-scrollbar {
  width: 6px;
}

.reasoning-modal-content::-webkit-scrollbar-track {
  background: #1e293b;
}

.reasoning-modal-content::-webkit-scrollbar-thumb {
  background-color: #334155;
  border-radius: 3px;
}

.reasoning-text {
  line-height: 1.7;
}

/* Image Modal for Enlarged Images */
.image-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
  backdrop-filter: blur(8px);
}

.image-modal {
  position: relative;
  max-width: 90%;
  max-height: 90vh;
  animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.enlarged-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

/* Markdown content styling */
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
  transition: color 0.2s;
}

.markdown-content a:hover {
  color: #93c5fd;
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
  border: 1px solid #334155;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

.markdown-content blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin-left: 0;
  color: #94a3b8;
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.markdown-content table th,
.markdown-content table td {
  padding: 0.5rem 0.75rem;
  border: 1px solid #334155;
}

.markdown-content table th {
  background-color: #1e293b;
  font-weight: 600;
}

.markdown-content table tr:nth-child(even) {
  background-color: rgba(30, 41, 59, 0.5);
}

/* Enhanced Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(50px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes modalIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes pulseFade {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

@keyframes dotFade {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Styles with Enhanced Mobile Experience */
@media (max-width: 768px) {
  .agent-chat-layout {
    flex-direction: column;
  }
  
  .chat-panel, .browser-active .chat-panel {
    flex: 1 0 50%;
    width: 100%;
    max-width: 100%;
    height: 50%;
  }
  
  .browser-panel {
    flex: 1 0 50%;
    width: 100%;
    max-width: 100%;
    height: 50%;
    border-left: none;
    border-top: 1px solid #334155;
  }
  
  .empty-chat-content {
    padding: 1.5rem;
  }
  
  .suggestion-chips {
    flex-direction: column;
    width: 100%;
  }
  
  .suggestion-chip {
    width: 100%;
    justify-content: center;
  }
  
  .message-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
  
  .input-buttons {
    align-items: flex-end;
  }
  
  .message {
    max-width: 100%;
  }
}
</style>