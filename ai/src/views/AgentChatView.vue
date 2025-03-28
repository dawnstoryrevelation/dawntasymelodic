<template>
    <div class="agent-chat-container">
      <!-- Split Layout: Chat on left, Agent Screen on right when active -->
      <div class="chat-section" :class="{ 'minimized': isAgentActive }">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="logo">
            <img src="@/assets/dawntasy-logo.png" alt="DawntasyAI Logo" />
            <h1>Dawntasy Q2 SentR</h1>
          </div>
          <div class="header-controls">
            <button class="reasoning-toggle" @click="toggleReasoningVisibility">
              {{ reasoningEnabled ? 'Hide Reasoning' : 'Show Reasoning' }}
            </button>
          </div>
        </div>
  
        <!-- Messages Container -->
        <div class="messages-container" ref="messagesContainer">
          <div v-for="(message, index) in messages" :key="index" 
               :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']">
            
            <!-- User Message -->
            <div v-if="message.role === 'user'" class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div v-if="message.attachments && message.attachments.length > 0" class="attachments">
                <div v-for="(file, fileIndex) in message.attachments" :key="fileIndex" class="attachment">
                  <div class="file-preview">
                    <img v-if="isImageFile(file.name)" :src="file.url" alt="Image preview" class="image-preview" />
                    <div v-else class="file-icon">
                      <i class="fas fa-file"></i>
                    </div>
                  </div>
                  <div class="file-name">{{ file.name }}</div>
                </div>
              </div>
            </div>
  
            <!-- AI Message -->
            <div v-else class="message-content">
              <!-- Thinking States -->
              <div v-if="message.thinking && message.thinking.length > 0" class="thinking-states">
                <div v-for="(state, stateIndex) in message.thinking" :key="stateIndex" class="thinking-state">
                  <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                  </div>
                  <div class="thinking-text">{{ state }}</div>
                </div>
              </div>
              
              <!-- AI Response -->
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              
              <!-- Reasoning Toggle Button -->
              <div v-if="message.reasoning" class="reasoning-toggle-container">
                <button @click="showReasoningModal(message.reasoning)" class="reasoning-button">
                  View Thinking Process
                </button>
              </div>
            </div>
          </div>
  
          <!-- Typing Indicator -->
          <div v-if="isTyping" class="message ai-message thinking">
            <div class="thinking-indicator">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
            <div class="thinking-text">{{ currentThinkingState }}</div>
          </div>
        </div>
  
        <!-- Input Area -->
        <div class="input-container">
          <div class="toolbar">
            <button class="toolbar-button" @click="toggleAgentMode">
              <i class="fas fa-robot"></i>
              <span>{{ isAgentMode ? 'Agent: ON' : 'Agent: OFF' }}</span>
            </button>
            
            <!-- File Upload Button -->
            <div class="file-upload">
              <button class="toolbar-button" @click="triggerFileUpload">
                <i class="fas fa-plus"></i>
              </button>
              <input
                type="file"
                ref="fileInput"
                multiple
                @change="handleFileUpload"
                style="display: none"
              />
            </div>
            
            <!-- Attached Files Display -->
            <div v-if="attachedFiles.length > 0" class="attached-files">
              <div v-for="(file, index) in attachedFiles" :key="index" class="attached-file">
                <span>Attached: {{ file.name }}</span>
                <button @click="removeFile(index)" class="remove-file">×</button>
              </div>
            </div>
            
            <!-- Microphone Button -->
            <button class="toolbar-button" @click="toggleMicrophone">
              <i class="fas" :class="isListening ? 'fa-microphone-alt' : 'fa-microphone'"></i>
            </button>
          </div>
          
          <div class="input-area">
            <textarea
              v-model="userInput"
              placeholder="Message DawntasyAI..."
              @keydown.enter.prevent="sendMessage"
              rows="1"
              ref="messageInput"
            ></textarea>
            <button @click="sendMessage" :disabled="isTyping || (!userInput.trim() && attachedFiles.length === 0)" class="send-button">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
  
      <!-- Agent Screen Section (Right Side) -->
      <div v-if="isAgentActive" class="agent-screen-section">
        <div class="agent-screen-header">
          <h2>DawntasyAI's Screen</h2>
          <button @click="closeAgentScreen" class="close-button">×</button>
        </div>
        <div class="agent-screen-content">
          <div v-if="loadingAgentScreen" class="loading-screen">
            <div class="loading-spinner"></div>
            <p>Initializing autonomous browsing...</p>
          </div>
          <div v-else-if="agentScreenError" class="error-screen">
            <i class="fas fa-exclamation-triangle"></i>
            <p>{{ agentScreenError }}</p>
          </div>
          <div v-else class="browser-view">
            <div class="browser-header">
              <div class="browser-controls">
                <span class="browser-control red"></span>
                <span class="browser-control yellow"></span>
                <span class="browser-control green"></span>
              </div>
              <div class="browser-address-bar">
                <i class="fas fa-lock"></i>
                <span>{{ currentBrowserUrl }}</span>
              </div>
            </div>
            <div class="browser-content">
              <img v-if="browserScreenshot" :src="browserScreenshot" alt="Browser Screenshot" class="browser-screenshot" />
              <div v-else class="browser-placeholder">
                <p>Agent is preparing to browse...</p>
              </div>
            </div>
            <div class="browser-status-bar">
              <div class="browser-status">
                <i class="fas fa-circle" :class="isAgentBrowsing ? 'browsing' : 'idle'"></i>
                <span>{{ browserStatusText }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Reasoning Modal -->
      <div v-if="showReasoning" class="modal reasoning-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>AI Reasoning Process</h2>
            <button @click="closeReasoningModal" class="close-button">×</button>
          </div>
          <div class="modal-body" v-html="currentReasoningText"></div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, watch, nextTick, onMounted } from 'vue';
  import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
  import { db } from '@/firebase';
  import axios from 'axios';
  
  export default {
    name: 'AgentChatView',
    
    setup() {
      // State
      const userInput = ref('');
      const messages = ref([]);
      const isTyping = ref(false);
      const isAgentMode = ref(true);
      const reasoningEnabled = ref(true);
      const attachedFiles = ref([]);
      const isListening = ref(false);
      const fileInput = ref(null);
      const messagesContainer = ref(null);
      const messageInput = ref(null);
      
      // Agent screen state
      const isAgentActive = ref(false);
      const loadingAgentScreen = ref(false);
      const agentScreenError = ref('');
      const browserScreenshot = ref('');
      const currentBrowserUrl = ref('https://www.google.com');
      const isAgentBrowsing = ref(false);
      const browserStatusText = ref('Agent ready');
      
      // Reasoning modal state
      const showReasoning = ref(false);
      const currentReasoningText = ref('');
      const currentThinkingState = ref('Thinking...');
      
      // Thinking states pool
      const thinkingStates = [
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
      
      // Firestore collection reference
      const messagesCollectionRef = collection(db, 'agentMessages');
      
      // Methods
      const formatMessage = (text) => {
        if (!text) return '';
        // Replace URLs with clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
      };
      
      const scrollToBottom = async () => {
        await nextTick();
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      };
      
      const sendMessage = async () => {
        if ((!userInput.value.trim() && attachedFiles.value.length === 0) || isTyping.value) return;
        
        const userMessage = {
          role: 'user',
          content: userInput.value.trim(),
          timestamp: serverTimestamp(),
          attachments: [...attachedFiles.value]
        };
        
        messages.value.push(userMessage);
        userInput.value = '';
        scrollToBottom();
        
        // Save message to Firestore
        try {
          await addDoc(messagesCollectionRef, userMessage);
        } catch (error) {
          console.error('Error saving message:', error);
        }
        
        // Clear attached files
        attachedFiles.value = [];
        
        // Generate AI response
        generateResponse(userMessage);
      };
      
      const generateResponse = async (userMessage) => {
        isTyping.value = true;
        
        // Show thinking states
        const thinkingInterval = setInterval(() => {
          currentThinkingState.value = thinkingStates[Math.floor(Math.random() * thinkingStates.length)];
        }, 2000);
        
        // Generate thinking steps
        const thinking = [];
        for (let i = 0; i < 4; i++) {
          const randomState = thinkingStates[Math.floor(Math.random() * thinkingStates.length)];
          thinking.push(randomState);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Initiate agent browsing if in agent mode
        if (isAgentMode.value && userMessage.content.includes('search') || 
            userMessage.content.includes('browse') || 
            userMessage.content.includes('find')) {
          activateAgentScreen();
        }
        
        // Generate reasoning
        let reasoning = '';
        if (reasoningEnabled.value) {
          reasoning = generateReasoningText(userMessage.content);
        }
        
        // Mock API call to OpenAI with delay
        setTimeout(async () => {
          clearInterval(thinkingInterval);
          isTyping.value = false;
          
          // Add AI response
          const aiMessage = {
            role: 'assistant',
            content: await mockOpenAIResponse(userMessage),
            timestamp: serverTimestamp(),
            thinking: thinking,
            reasoning: reasoning
          };
          
          messages.value.push(aiMessage);
          scrollToBottom();
          
          // Save AI response to Firestore
          try {
            await addDoc(messagesCollectionRef, aiMessage);
          } catch (error) {
            console.error('Error saving AI response:', error);
          }
          
          // If agent mode is active, update browser simulation
          if (isAgentActive.value) {
            simulateBrowserNavigation();
          }
        }, 3000);
      };
      
      const mockOpenAIResponse = async (userMessage) => {
        // In a real implementation, this would call the OpenAI API
        // For now, we'll return a mock response
        
        let response = "I've analyzed your request and found some relevant information.";
        
        // Check for file attachments
        if (userMessage.attachments && userMessage.attachments.length > 0) {
          const hasImages = userMessage.attachments.some(file => isImageFile(file.name));
          
          if (hasImages) {
            response += " I've analyzed the image(s) you provided using Vision OCR.";
            response += " The image appears to contain [example text that would be detected by OCR].";
          } else {
            response += " I've analyzed the file(s) you uploaded.";
            response += " The content includes [example analysis of the file content].";
          }
        }
        
        // Add web browsing context if agent mode
        if (isAgentMode.value && (userMessage.content.includes('search') || 
                                  userMessage.content.includes('browse') || 
                                  userMessage.content.includes('find'))) {
          response += " Based on my web search, I found several relevant results that address your query.";
          response += " I've navigated through several pages to find the most accurate information.";
          response += " You can see the process in the browser view.";
        }
        
        return response;
      };
      
      const generateReasoningText = (userPrompt) => {
        // Generate mock reasoning text (would be from the AI in real implementation)
        let reasoning = "Hmm. So the user just asked ";
        
        if (userPrompt.includes('search') || userPrompt.includes('find')) {
          reasoning += "to perform several web searches. Let's investigate this. First, let's break this down. ";
          reasoning += "What do we need? Aha! We need to first undergo a comprehensive Google search for relevant information. ";
          reasoning += "The query seems to be about '" + userPrompt.split(' ').slice(0, 3).join(' ') + "...' which suggests ";
          reasoning += "I should focus on authoritative sources. Let me plan my approach: ";
          reasoning += "1. Analyze the key terms in the query to identify search parameters ";
          reasoning += "2. Formulate specific search strings to maximize relevance ";
          reasoning += "3. Evaluate search results for credibility and relevance ";
          reasoning += "4. Extract and synthesize information from multiple sources ";
          reasoning += "5. Structure the findings in a coherent, helpful response ";
          reasoning += "Let me proceed with this structured approach to ensure I provide accurate information.";
        } else if (userPrompt.includes('file') || userPrompt.includes('image')) {
          reasoning += "to analyze a file or image. I'll need to carefully examine the contents. ";
          reasoning += "For images, I'll use my vision capabilities to identify visual elements, text through OCR, ";
          reasoning += "and contextual information. For documents, I'll parse the text, understand the structure, ";
          reasoning += "and extract key information. Let me methodically work through this to ensure I catch all important details.";
        } else {
          reasoning += "a question that requires careful consideration. Let me think step by step through this. ";
          reasoning += "The essence of this query appears to be about '" + userPrompt.split(' ').slice(0, 3).join(' ') + "...' ";
          reasoning += "I need to consider multiple angles here. What's the underlying need? ";
          reasoning += "What context might be missing that I should account for? ";
          reasoning += "What level of detail would be most helpful in my response? ";
          reasoning += "Let me construct a response that addresses the core question while providing valuable context.";
        }
        
        return reasoning;
      };
      
      const triggerFileUpload = () => {
        fileInput.value.click();
      };
      
      const handleFileUpload = (event) => {
        const files = event.target.files;
        if (!files.length) return;
        
        Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            attachedFiles.value.push({
              name: file.name,
              type: file.type,
              size: file.size,
              url: e.target.result
            });
          };
          reader.readAsDataURL(file);
        });
        
        // Reset file input for future uploads
        event.target.value = '';
      };
      
      const removeFile = (index) => {
        attachedFiles.value.splice(index, 1);
      };
      
      const isImageFile = (filename) => {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
      };
      
      const toggleMicrophone = () => {
        isListening.value = !isListening.value;
        // Microphone functionality would be implemented here
      };
      
      const toggleAgentMode = () => {
        isAgentMode.value = !isAgentMode.value;
        if (!isAgentMode.value && isAgentActive.value) {
          closeAgentScreen();
        }
      };
      
      const toggleReasoningVisibility = () => {
        reasoningEnabled.value = !reasoningEnabled.value;
      };
      
      const showReasoningModal = (reasoningText) => {
        currentReasoningText.value = reasoningText;
        showReasoning.value = true;
      };
      
      const closeReasoningModal = () => {
        showReasoning.value = false;
      };
      
      // Agent screen methods
      const activateAgentScreen = () => {
        isAgentActive.value = true;
        loadingAgentScreen.value = true;
        agentScreenError.value = '';
        browserScreenshot.value = '';
        
        // Simulate loading delay
        setTimeout(() => {
          loadingAgentScreen.value = false;
          simulateBrowserInit();
        }, 2000);
      };
      
      const closeAgentScreen = () => {
        isAgentActive.value = false;
        browserScreenshot.value = '';
        currentBrowserUrl.value = 'https://www.google.com';
      };
      
      const simulateBrowserInit = () => {
        // In a real implementation, this would initialize Puppeteer
        // For now, we'll use a placeholder image
        browserScreenshot.value = 'https://via.placeholder.com/800x600?text=Google+Search+Page';
        currentBrowserUrl.value = 'https://www.google.com';
        browserStatusText.value = 'Browser initialized';
      };
      
      const simulateBrowserNavigation = () => {
        // Simulate browser navigation
        isAgentBrowsing.value = true;
        browserStatusText.value = 'Searching...';
        
        // Sequence of browser events
        setTimeout(() => {
          browserScreenshot.value = 'https://via.placeholder.com/800x600?text=Search+Results+Page';
          currentBrowserUrl.value = 'https://www.google.com/search?q=example+search';
          browserStatusText.value = 'Analyzing search results';
        }, 2000);
        
        setTimeout(() => {
          browserScreenshot.value = 'https://via.placeholder.com/800x600?text=Clicking+Result+1';
          currentBrowserUrl.value = 'https://example.com/result-page';
          browserStatusText.value = 'Reading content';
        }, 4000);
        
        setTimeout(() => {
          browserScreenshot.value = 'https://via.placeholder.com/800x600?text=Scrolling+Down+Page';
          browserStatusText.value = 'Finding relevant information';
        }, 6000);
        
        setTimeout(() => {
          isAgentBrowsing.value = false;
          browserStatusText.value = 'Information gathered';
        }, 8000);
      };
      
      // Load messages from Firestore
      onMounted(() => {
        const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));
        
        onSnapshot(q, (snapshot) => {
          const fetchedMessages = [];
          snapshot.forEach((doc) => {
            fetchedMessages.push({ id: doc.id, ...doc.data() });
          });
          
          // Filter out messages that might have incorrect timestamp
          messages.value = fetchedMessages.filter(msg => msg.role && (msg.role === 'user' || msg.role === 'assistant'));
          scrollToBottom();
        });
      });
      
      // Auto-resize textarea
      watch(userInput, async () => {
        await nextTick();
        if (messageInput.value) {
          messageInput.value.style.height = 'auto';
          messageInput.value.style.height = messageInput.value.scrollHeight + 'px';
        }
      });
      
      // Reset to chat view when agent mode is turned off
      watch(isAgentMode, (newValue) => {
        if (!newValue) {
          isAgentActive.value = false;
        }
      });
      
      return {
        userInput,
        messages,
        isTyping,
        isAgentMode,
        reasoningEnabled,
        attachedFiles,
        isListening,
        fileInput,
        messagesContainer,
        messageInput,
        isAgentActive,
        loadingAgentScreen,
        agentScreenError,
        browserScreenshot,
        currentBrowserUrl,
        isAgentBrowsing,
        browserStatusText,
        showReasoning,
        currentReasoningText,
        currentThinkingState,
        formatMessage,
        sendMessage,
        triggerFileUpload,
        handleFileUpload,
        removeFile,
        isImageFile,
        toggleMicrophone,
        toggleAgentMode,
        toggleReasoningVisibility,
        showReasoningModal,
        closeReasoningModal,
        activateAgentScreen,
        closeAgentScreen
      };
    }
  };
  </script>
  
  <style scoped>
  .agent-chat-container {
    display: flex;
    width: 100%;
    height: 100vh;
    background-color: #121212;
    color: #f0f0f0;
    font-family: 'Inter', sans-serif;
  }
  
  /* Split Layout Styling */
  .chat-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: all 0.3s ease;
  }
  
  .chat-section.minimized {
    flex: 0.4;
  }
  
  .agent-screen-section {
    flex: 0.6;
    border-left: 1px solid #2c2c2c;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
  }
  
  /* Header Styling */
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background-color: #1a1a1a;
    border-bottom: 1px solid #2c2c2c;
  }
  
  .logo {
    display: flex;
    align-items: center;
  }
  
  .logo img {
    height: 32px;
    margin-right: 10px;
  }
  
  .logo h1 {
    font-size: 1.3rem;
    font-weight: 600;
    color: #4169e1; /* Royal Blue */
    margin: 0;
  }
  
  .header-controls button {
    background-color: #2c2c2c;
    color: #4682b4; /* Cerulean */
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .header-controls button:hover {
    background-color: #363636;
  }
  
  /* Messages Container */
  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .message {
    display: flex;
    flex-direction: column;
    max-width: 85%;
  }
  
  .user-message {
    align-self: flex-end;
  }
  
  .ai-message {
    align-self: flex-start;
  }
  
  .message-content {
    padding: 12px 16px;
    border-radius: 18px;
    position: relative;
  }
  
  .user-message .message-content {
    background-color: #4169e1; /* Royal Blue */
    color: white;
    border-bottom-right-radius: 4px;
  }
  
  .ai-message .message-content {
    background-color: #2c2c2c;
    color: #f0f0f0;
    border-bottom-left-radius: 4px;
  }
  
  .message-text {
    font-size: 0.95rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  .message-text a {
    color: #4682b4; /* Cerulean */
    text-decoration: underline;
  }
  
  /* Attachments */
  .attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
  }
  
  .attachment {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 120px;
  }
  
  .file-preview {
    width: 100px;
    height: 80px;
    background-color: #1a1a1a;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }
  
  .image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .file-icon {
    font-size: 2rem;
    color: #4682b4; /* Cerulean */
  }
  
  .file-name {
    font-size: 0.8rem;
    margin-top: 5px;
    text-align: center;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  /* Thinking Indicator */
  .thinking {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .thinking-indicator {
    display: flex;
    gap: 5px;
  }
  
  .dot {
    width: 8px;
    height: 8px;
    background-color: #4682b4; /* Cerulean */
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }
  
  .dot:nth-child(2) {
    animation-delay: 0.3s;
  }
  
  .dot:nth-child(3) {
    animation-delay: 0.6s;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.4; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  
  .thinking-text {
    font-size: 0.9rem;
    color: #a0a0a0;
  }
  
  /* Thinking States */
  .thinking-states {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
    opacity: 0.7;
  }
  
  .thinking-state {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.85rem;
    color: #a0a0a0;
  }
  
  /* Reasoning Button */
  .reasoning-toggle-container {
    margin-top: 10px;
    display: flex;
    justify-content: flex-start;
  }
  
  .reasoning-button {
    background-color: transparent;
    color: #4682b4; /* Cerulean */
    border: 1px solid #4682b4;
    border-radius: 4px;
    padding: 5px 10px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .reasoning-button:hover {
    background-color: rgba(70, 130, 180, 0.1);
  }
  
  /* Input Container */
  .input-container {
    padding: 15px 20px;
    background-color: #1a1a1a;
    border-top: 1px solid #2c2c2c;
  }
  
  .toolbar {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
  }
  
  .toolbar-button {
    background-color: transparent;
    color: #a0a0a0;
    border: none;
    padding: 5px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }
  
  .toolbar-button:hover {
    color: #4682b4; /* Cerulean */
    background-color: rgba(70, 130, 180, 0.1);
  }
  
  .toolbar-button i {
    font-size: 1.1rem;
  }
  
  /* Attached Files Display in Toolbar */
  .attached-files {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .attached-file {
    background-color: #2c2c2c;
    padding: 4px 8px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
  }
  
  .remove-file {
    background: none;
    border: none;
    color: #a0a0a0;
    font-size: 1rem;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    margin-left: 5px;
  }
  
  .remove-file:hover {
    color: #ff5252;
  }
  
  /* Input Area */
  .input-area {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background-color: #2c2c2c;
    border-radius: 8px;
    padding: 10px 15px;
  }
  
  textarea {
    flex: 1;
    background-color: transparent;
    border: none;
    outline: none;
    color: #f0f0f0;
    font-size: 0.95rem;
    font-family: inherit;
    resize: none;
    max-height: 150px;
    line-height: 1.5;
  }
  
  textarea::placeholder {
    color: #a0a0a0;
  }
  
  .send-button {
    background-color: #4169e1; /* Royal Blue */
    color: white;
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .send-button:hover {
    background-color: #3a5fcd;
  }
  
  .send-button:disabled {
    background-color: #2c2c2c;
    color: #666;
    cursor: not-allowed;
  }
  
  /* Agent Screen Styling */
  .agent-screen-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background-color: #1a1a1a;
    border-bottom: 1px solid #2c2c2c;
  }
  
  .agent-screen-header h2 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #4682b4; /* Cerulean */
    margin: 0;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #a0a0a0;
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
  }
  
  .close-button:hover {
    color: #ff5252;
  }
  
  .agent-screen-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .loading-screen {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    gap: 20px;
  }
  
  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #2c2c2c;
    border-top: 5px solid #4682b4; /* Cerulean */
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-screen {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    gap: 20px;
    color: #ff5252;
  }
  
  .error-screen i {
    font-size: 3rem;
  }
  
  /* Browser View */
  .browser-view {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .browser-header {
    display: flex;
    flex-direction: column;
    background-color: #2c2c2c;
    padding: 10px;
    border-bottom: 1px solid #3c3c3c;
  }
  
  .browser-controls {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .browser-control {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  
  .browser-control.red {
    background-color: #ff5f56;
  }
  
  .browser-control.yellow {
    background-color: #ffbd2e;
  }
  
  .browser-control.green {
    background-color: #27c93f;
  }
  
  .browser-address-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #1a1a1a;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .browser-address-bar i {
    color: #27c93f;
    font-size: 0.8rem;
  }
  
  .browser-content {
    flex: 1;
    overflow: auto;
    background-color: white;
    position: relative;
  }
  
  .browser-screenshot {
    width: 100%;
    height: auto;
    display: block;
  }
  
  .browser-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #666;
    background-color: #f5f5f5;
  }
  
  .browser-status-bar {
    padding: 8px 12px;
    background-color: #2c2c2c;
    border-top: 1px solid #3c3c3c;
  }
  
  .browser-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: #a0a0a0;
  }
  
  .browser-status i {
    font-size: 0.7rem;
  }
  
  .browser-status i.browsing {
    color: #27c93f;
  }
  
  .browser-status i.idle {
    color: #a0a0a0;
  }
  
  /* Reasoning Modal */
  .modal {
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
  }
  
  .modal-content {
    background-color: #1a1a1a;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.3);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background-color: #2c2c2c;
    border-bottom: 1px solid #3c3c3c;
  }
  
  .modal-header h2 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #4682b4; /* Cerulean */
    margin: 0;
  }
  
  .modal-body {
    padding: 20px;
    overflow-y: auto;
    font-size: 0.95rem;
    line-height: 1.6;
    max-height: calc(80vh - 60px);
    white-space: pre-wrap;
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .agent-chat-container {
      flex-direction: column;
    }
    
    .chat-section {
      height: 50vh;
    }
    
    .chat-section.minimized {
      height: 30vh;
      flex: none;
    }
    
    .agent-screen-section {
      height: 70vh;
      flex: none;
      border-left: none;
      border-top: 1px solid #2c2c2c;
    }
    
    .modal-content {
      width: 95%;
    }
  }
  </style>