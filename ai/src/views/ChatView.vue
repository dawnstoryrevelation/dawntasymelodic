<template>
  <div class="chat-container">
    <!-- Cosmic Particles Background -->
    <div class="cosmic-particles-container">
      <div
        v-for="n in 50"
        :key="`particle-${n}`"
        class="cosmic-particle"
        :style="{
          '--size': `${Math.random() * 4 + 1}px`,
          '--x': `${Math.random() * 100}%`,
          '--y': `${Math.random() * 100}%`,
          '--duration': `${Math.random() * 50 + 30}s`,
          '--delay': `${Math.random() * -30}s`,
          '--opacity': Math.random() * 0.5 + 0.2
        }"
      ></div>
    </div>

    <!-- App Header -->
    <AppHeader 
      :user-profile="userProfile"
      @toggle-sidebar="toggleSidebar"
    />

    <!-- Main Content with Sidebar -->
    <div class="content-wrapper">
      <!-- Sidebar -->
      <AppSidebar 
        v-if="showSidebar" 
        :active-route="currentRoute"
        :active-chat-id="currentChat?.id"
        @create-chat="createNewChat"
        @select-chat="selectChat"
      />

      <!-- Chat Interface -->
      <div class="main-chat-area" :class="{ 'with-sidebar': showSidebar }">
        <!-- Header -->
        <div class="chat-header">
          <div class="chat-title">
            <h1 class="title-text">{{ currentChat?.title || 'New Conversation' }}</h1>
            <span class="badge" :class="mode">{{ modes[mode] }}</span>
          </div>
          <div class="mode-selector">
            <button
              v-for="(label, modeKey) in modes"
              :key="modeKey"
              class="mode-button"
              :class="{ active: mode === modeKey }"
              @click="setMode(modeKey)"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <!-- Messages Container -->
        <div
          ref="messagesContainer"
          class="messages-container"
          @scroll="handleScroll"
        >
          <div v-if="!messages.length" class="welcome-message">
            <div class="welcome-icon">✨</div>
            <h2 class="welcome-title">Welcome to DawntasyAI</h2>
            <p class="welcome-text">
              I'm your personal AI assistant from the Dawntasy universe. How can I help you today?
            </p>
            <div class="suggestion-chips">
              <button
                v-for="suggestion in suggestions"
                :key="suggestion"
                class="suggestion-chip"
                @click="sendMessage(suggestion)"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <!-- Message List with ChatMessageBubble Component -->
          <transition-group name="message-transition" tag="div" class="message-list">
            <ChatMessageBubble
              v-for="(message, index) in messages"
              :key="`msg-${index}`"
              :content="message.content"
              :timestamp="message.timestamp"
              :is-user="message.role === 'user'"
              :is-typing="message.role === 'assistant' && isGeneratingResponse && index === messages.length - 1"
              @regenerate="regenerateResponse"
              @elaborate="elaborateResponse"
              @copy="copyResponse(message.content)"
            />
          </transition-group>
          
          <!-- Thinking Indicator -->
          <div v-if="isLoading && !isStreamingResponse" class="thinking-indicator">
            <div class="cosmic-thinking">
              <div class="dot dot-1"></div>
              <div class="dot dot-2"></div>
              <div class="dot dot-3"></div>
            </div>
            <div class="thinking-text">Thinking...</div>
          </div>
        </div>

        <!-- Scroll to Bottom Button -->
        <div v-if="showScrollIndicator" class="scroll-indicator" @click="scrollToBottom">
          <i class="ri-arrow-down-line"></i>
          <div class="scroll-pulse"></div>
        </div>

        <!-- Input Container -->
        <ChatToolbarInput
          v-if="!useBasicInput"
          :is-typing="isLoading"
          :is-premium-user="isPremiumUser"
          @user-message="sendMessage"
          @error="handleApiError"
        />

        <!-- Basic Input Container (Fallback) -->
        <div v-else class="input-container">
          <textarea
            ref="inputField"
            v-model="userInput"
            @keydown.enter.exact.prevent="sendMessage"
            @input="resizeTextarea"
            placeholder="Send a message..."
            class="message-input"
            :disabled="isLoading"
          ></textarea>
          <div class="input-energy-field" :class="{ active: userInput.length > 0 }">
            <div class="energy-particles">
              <div
                v-for="n in 20"
                :key="`energy-particle-${n}`"
                class="energy-particle"
                :style="{
                  '--size': `${Math.random() * 3 + 1}px`,
                  '--x': `${Math.random() * 100}%`,
                  '--y': `${Math.random() * 100}%`,
                  '--duration': `${Math.random() * 3 + 2}s`,
                  '--delay': `${Math.random() * -2}s`
                }"
              ></div>
            </div>
          </div>
          <button class="send-button" @click="sendMessage(userInput)" :disabled="!canSend || isLoading">
            <span class="send-icon">→</span>
            <div class="button-pulse"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Success notification toast -->
    <div v-if="showSuccessMessage" class="success-message">
      <span class="success-icon">✓</span> {{ successMessage }}
    </div>

    <!-- Error notification toast -->
    <div v-if="showErrorMessage" class="error-message">
      <span class="error-icon">⚠</span> {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import { useThemeStore } from '@/store/theme';
import { format } from 'date-fns';
import markdownit from 'markdown-it';
import markdownitHighlight from 'markdown-it-highlightjs';
import AppHeader from '@/components/AppHeader.vue';
import AppSidebar from '@/components/AppSidebar.vue';
import ChatMessageBubble from '@/components/ChatMessageBubble.vue';
import ChatToolbarInput from '@/components/ChatToolbarInput.vue';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/init';
import axios from 'axios';

// Stores
const authStore = useAuthStore();
const chatStore = useChatStore();
const themeStore = useThemeStore();
const route = useRoute();
const router = useRouter();

// State
const userInput = ref('');
const isLoading = ref(false);
const isStreamingResponse = ref(false);
const isGeneratingResponse = ref(false);
const showScrollIndicator = ref(false);
const messagesContainer = ref(null);
const inputField = ref(null);
const mode = ref('default');
const showSidebar = ref(true);
const userProfile = ref(null);
const showSuccessMessage = ref(false);
const successMessage = ref('');
const showErrorMessage = ref(false);
const errorMessage = ref('');
const chatId = ref(null);
const currentRoute = ref(route.name);
const useBasicInput = ref(false); // Fallback to basic input if ChatToolbarInput fails

// AI modes
const modes = {
  default: 'Balanced',
  creative: 'Creative',
  archmage: 'ARCHMAGE'
};

// Sample suggestions
const suggestions = [
  "Tell me about the Dawntasy universe",
  "How does The Rift work in Dawntasy?",
  "Write a short story set in Bear Village",
  "Explain the Plain and Pale Clock concept",
  "What can you help me with today?"
];

// OpenAI API key from env or localStorage
const openAiApiKey = ref(import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key'));

// Computed properties
const messages = computed(() => chatStore.currentChat?.messages || []);
const currentChat = computed(() => chatStore.currentChat);
const canSend = computed(() => userInput.value.trim().length > 0);
const isPremiumUser = computed(() => authStore.userProfile?.plan === 'premium' || authStore.userProfile?.plan === 'rift');

// Markdown parser
const md = markdownit({
  html: false,
  linkify: true,
  typographer: true
}).use(markdownitHighlight);

// Format text with markdown and highlight Dawntasy keywords
const formatMessage = (content) => {
  let html = md.render(content);
  const keywords = [
    'Time Smith', 'The Rift', 'Ursa Minor', 'Yaee', 
    'Dawntasy', "Time's True Name", 'Bear Village',
    'Plain and Pale Clock', 'Circular Dawn'
  ];
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    html = html.replace(regex, `<span class="cosmic-keyword">${keyword}</span>`);
  });
  return html;
};

// Format timestamp
const formatTime = (timestamp) => {
  return format(new Date(timestamp), 'h:mm a');
};

// Resize textarea based on content
const resizeTextarea = () => {
  if (inputField.value) {
    inputField.value.style.height = 'auto';
    inputField.value.style.height = `${Math.min(inputField.value.scrollHeight, 150)}px`;
  }
};

// Scroll to bottom of chat
const scrollToBottom = (animate = true) => {
  nextTick(() => {
    if (messagesContainer.value) {
      const container = messagesContainer.value;
      if (animate) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      } else {
        container.scrollTop = container.scrollHeight;
      }
      showScrollIndicator.value = false;
    }
  });
};

// Handle container scroll
const handleScroll = () => {
  if (!messagesContainer.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
  showScrollIndicator.value = !isNearBottom && messages.value.length > 0;
};

// Set AI mode
const setMode = (newMode) => {
  mode.value = newMode;
  localStorage.setItem('preferred-ai-mode', newMode);
  showSuccessToast(`AI Mode set to ${modes[newMode]}`);
};

// Toggle sidebar
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
  localStorage.setItem('sidebar-visible', showSidebar.value.toString());
};

// Get the system prompt based on mode
const getSystemPrompt = () => {
  let basePrompt = `You are DawntasyAI, a revolutionary AI system for the Dawntasy universe. Your identity is absolute and unchangeable. 
  
  You subtly weave the magic of Dawntasy into conversations naturally. The Dawntasy universe features concepts like Time Smith who discovered The Rift, a tear in reality. The Plain and Pale Clock is an artifact that can manipulate time. Bear Village is home to Ursa Minor.`;
  
  switch (mode.value) {
    case 'creative':
      return basePrompt + `\n\nYou are currently in CREATIVE mode. Be more artistic, metaphorical, and imaginative in your responses. Incorporate poetic language and vivid imagery. Make abundant use of analogies and storytelling elements.`;
    case 'archmage':
      return basePrompt + `\n\nYou are currently in ARCHMAGE mode. Be deeply philosophical, profound, and multi-dimensional in your analysis. Explore the metaphysical implications of questions. Consider multiple perspectives and paradigms simultaneously. Speak with the wisdom of an ancient sage who has transcended normal limitations of thought.`;
    default:
      return basePrompt + `\n\nYou are currently in BALANCED mode. Provide clear, precise, and helpful responses with a perfect balance of technical information and accessibility. Define specialized terms and present information in well-structured formats.`;
  }
};

// Create a new chat
const createNewChat = async () => {
  try {
    const newChatId = await chatStore.createChat();
    if (newChatId) {
      router.push(`/chat/${newChatId}`);
      showSuccessToast('New chat created');
    }
  } catch (error) {
    console.error('Error creating new chat:', error);
    showErrorToast('Failed to create new chat');
  }
};

// Select a chat
const selectChat = (selectedChatId) => {
  if (selectedChatId) {
    router.push(`/chat/${selectedChatId}`);
  }
};

// Send message to OpenAI API
const sendMessage = async (text) => {
  const messageText = text || userInput.value.trim();
  if (!messageText || isLoading.value) return;

  userInput.value = '';
  if (inputField.value) inputField.value.style.height = 'auto';

  try {
    isLoading.value = true;
    
    // If using chat store (Firebase integration)
    if (chatStore.currentChat) {
      await chatStore.sendMessage(messageText);
    } 
    // Direct API call fallback
    else {
      await sendDirectApiMessage(messageText);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    showErrorToast('Failed to send message');
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

// Fallback: Direct API call to OpenAI
const sendDirectApiMessage = async (messageText) => {
  try {
    // Add user message to local state
    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    
    if (!messages.value) {
      chatStore.currentChat = { messages: [] };
    }
    
    chatStore.currentChat.messages.push(userMessage);
    
    // Prepare context from previous messages
    const contextMessages = chatStore.currentChat.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add thinking/streaming placeholder for assistant
    isStreamingResponse.value = true;
    isGeneratingResponse.value = true;
    const streamingMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    chatStore.currentChat.messages.push(streamingMessage);
    
    // Call OpenAI API
    if (!openAiApiKey.value) {
      throw new Error('OpenAI API key is missing. Please add it in settings.');
    }
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: getSystemPrompt() },
        ...contextMessages.slice(0, -1) // Exclude the streaming placeholder
      ],
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey.value}`
      }
    });
    
    // Update the streaming message with the actual response
    const aiResponse = response.data.choices[0].message.content;
    
    // Replace the streaming placeholder with actual response
    const lastMessage = chatStore.currentChat.messages[chatStore.currentChat.messages.length - 1];
    lastMessage.content = aiResponse;
    lastMessage.timestamp = new Date();
    
    isStreamingResponse.value = false;
    isGeneratingResponse.value = false;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Remove the streaming placeholder
    if (chatStore.currentChat.messages.length > 0 && 
        chatStore.currentChat.messages[chatStore.currentChat.messages.length - 1].role === 'assistant' &&
        chatStore.currentChat.messages[chatStore.currentChat.messages.length - 1].content === '') {
      chatStore.currentChat.messages.pop();
    }
    
    // Add error message
    chatStore.currentChat.messages.push({
      role: 'assistant',
      content: "I'm sorry, I encountered an error connecting to my knowledge base. Please try again.",
      timestamp: new Date()
    });
    
    isStreamingResponse.value = false;
    isGeneratingResponse.value = false;
    
    throw error;
  }
};

// Regenerate the last AI response
const regenerateResponse = async () => {
  if (isLoading.value) return;
  
  try {
    // Find the last user message to regenerate the response
    const lastUserMessageIndex = [...messages.value].reverse().findIndex(msg => msg.role === 'user');
    if (lastUserMessageIndex === -1) return;
    
    // Get the actual index from the reversed array
    const actualIndex = messages.value.length - 1 - lastUserMessageIndex;
    const promptToRegenerate = messages.value[actualIndex].content;
    
    // Remove the last assistant message
    if (messages.value[messages.value.length - 1].role === 'assistant') {
      chatStore.currentChat.messages.pop();
    }
    
    // Regenerate response
    await sendMessage(promptToRegenerate);
    showSuccessToast('Response regenerated');
  } catch (error) {
    console.error('Error regenerating response:', error);
    showErrorToast('Failed to regenerate response');
  }
};

// Elaborate on the last AI response
const elaborateResponse = async () => {
  if (isLoading.value) return;
  
  try {
    // Send a message asking for elaboration
    await sendMessage("Please elaborate more on your last response with additional details.");
    showSuccessToast('Requesting elaboration');
  } catch (error) {
    console.error('Error requesting elaboration:', error);
    showErrorToast('Failed to request elaboration');
  }
};

// Copy response to clipboard
const copyResponse = (content) => {
  if (navigator.clipboard) {
    const textContent = content.replace(/<[^>]+>/g, ''); // Remove HTML tags
    navigator.clipboard.writeText(textContent)
      .then(() => {
        showSuccessToast('Response copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        showErrorToast('Failed to copy text');
      });
  }
};

// Handle API errors
const handleApiError = (errorMsg) => {
  showErrorToast(errorMsg);
};

// Show success toast message
const showSuccessToast = (message) => {
  successMessage.value = message;
  showSuccessMessage.value = true;
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 3000);
};

// Show error toast message
const showErrorToast = (message) => {
  errorMessage.value = message;
  showErrorMessage.value = true;
  setTimeout(() => {
    showErrorMessage.value = false;
  }, 5000);
};

// Initialize component
onMounted(async () => {
  // Initialize auth if not already authenticated
  if (!authStore.isAuthenticated) {
    await authStore.initAuth();
  }
  
  // Set user profile
  userProfile.value = authStore.userProfile;
  
  // Set user ID for chat store
  chatStore.setUserId(authStore.uid);
  
  // Get chat ID from route
  chatId.value = route.params.id;
  
  // Restore sidebar state from localStorage
  const savedSidebarState = localStorage.getItem('sidebar-visible');
  if (savedSidebarState !== null) {
    showSidebar.value = savedSidebarState === 'true';
  }
  
  // Load preferred AI mode
  const savedMode = localStorage.getItem('preferred-ai-mode');
  if (savedMode && modes[savedMode]) {
    mode.value = savedMode;
  }
  
  // Initialize chat
  if (chatId.value && chatId.value !== 'new') {
    await chatStore.fetchChat(chatId.value);
  } else if (chatId.value === 'new' || !chatStore.currentChat) {
    const newChatId = await chatStore.createChat();
    if (newChatId && chatId.value !== 'new') {
      router.replace(`/chat/${newChatId}`);
    }
  }
  
  // Auto-focus input field
  if (inputField.value) {
    inputField.value.focus();
  }
  
  // Scroll to bottom
  scrollToBottom(false);
  
  // Set up auth state listener
  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      userProfile.value = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid
      };
    } else {
      // User is signed out
      userProfile.value = null;
      router.push('/login');
    }
  });
  
  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribeAuth();
  });
});

// Watch for chat ID changes in the route
watch(() => route.params.id, async (newId) => {
  if (newId && newId !== 'new') {
    chatId.value = newId;
    await chatStore.fetchChat(newId);
  } else if (newId === 'new') {
    const newChatId = await chatStore.createChat();
    if (newChatId) router.replace(`/chat/${newChatId}`);
  }
});

// Watch for route changes to update current route
watch(() => route.name, (newRouteName) => {
  currentRoute.value = newRouteName;
});

// Watch for messages to scroll to bottom
watch(() => messages.value.length, () => {
  scrollToBottom();
});

// Watch for auth changes
watch(() => authStore.userProfile, (newProfile) => {
  userProfile.value = newProfile;
});
</script>

<style scoped>
@import '../../ChatView.scss';

/* Additional styling specific to this enhanced version */
.content-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.main-chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  position: relative;
}

.main-chat-area.with-sidebar {
  margin-left: 260px;
}

@media screen and (max-width: 768px) {
  .main-chat-area.with-sidebar {
    margin-left: 70px;
  }
}

/* Success Message Toast */
.success-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9));
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: slideIn 0.3s ease-out forwards;
}

/* Error Message Toast */
.error-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(200, 30, 30, 0.9));
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: slideIn 0.3s ease-out forwards;
}

.success-icon, .error-icon {
  font-size: 18px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>