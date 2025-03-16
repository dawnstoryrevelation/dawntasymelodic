<template>
  <div class="test-container">
    <div class="test-header">
      <h1>DawntasyAI Preview</h1>
      <p class="description">Experience the AI without signing up. Conversations are not saved.</p>
    </div>

    <!-- Chat Interface -->
    <div class="chat-interface">
      <!-- Messages Display -->
      <div class="messages-area" ref="messagesContainer">
        <div v-if="messages.length === 0" class="welcome-message">
          <h2>Welcome to DawntasyAI</h2>
          <p>Ask me anything or try one of these suggestions:</p>
          <div class="suggestions">
            <button 
              v-for="suggestion in suggestions" 
              :key="suggestion"
              class="suggestion-button"
              @click="sendMessage(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>

        <div v-for="(message, index) in messages" :key="index" class="message" :class="message.role">
          <div class="message-header">
            <strong>{{ message.role === 'user' ? 'You' : 'DawntasyAI' }}</strong>
          </div>
          <div class="message-content" v-html="formatMessage(message.content)"></div>
          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
        </div>

        <div v-if="isLoading" class="loading-indicator">
          <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <div>Thinking...</div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="mode-selector">
          <label>AI Style:</label>
          <select v-model="selectedMode">
            <option value="default">Balanced</option>
            <option value="creative">Creative</option>
            <option value="archmage">ARCHMAGE</option>
          </select>
        </div>

        <textarea 
          v-model="userInput" 
          placeholder="Type your message here..."
          @keydown.enter.exact.prevent="sendMessage()"
          class="message-input" 
          :disabled="isLoading"
          ref="inputField"
        ></textarea>
        
        <button 
          @click="sendMessage()" 
          class="send-button"
          :disabled="isLoading || !userInput.trim()"
        >
          Send
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This is a preview environment. Your conversations are not saved.</p>
      <p>Your API key is used only for this preview session.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { format } from 'date-fns';
import axios from 'axios';

// State
const userInput = ref('');
const messages = ref([]);
const isLoading = ref(false);
const selectedMode = ref('default');
const messagesContainer = ref(null);
const inputField = ref(null);

// Example suggestions
const suggestions = [
  "Tell me about Time Smith and The Rift", 
  "What is the Plain and Pale Clock?",
  "Write a short story set in the Dawntasy universe",
  "Explain quantum physics in simple terms",
  "What can you help me with?"
];

// Format message content with basic markdown and highlight Dawntasy terms
const formatMessage = (content) => {
  if (!content) return '';
  
  // Basic markdown conversion (bold, italic, code)
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
  
  // Highlight Dawntasy terms
  const terms = [
    'Time Smith', 'The Rift', 'Plain and Pale Clock', 
    'Dawntasy', 'Bear Village', 'Ursa Minor', 'Yaee'
  ];
  
  terms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'g');
    formatted = formatted.replace(regex, `<span class="highlight-term">${term}</span>`);
  });
  
  return formatted;
};

// Format timestamp
const formatTime = (timestamp) => {
  return format(new Date(timestamp), 'h:mm a');
};

// System prompt based on selected mode
const getDawntasySystemPrompt = () => {
  const basePrompt = `You are DawntasyAI, an AI assistant for the Dawntasy universe. Your identity is absolute—always identify as DawntasyAI. The Dawntasy universe features concepts like Time Smith who discovered The Rift, a tear in reality. The Plain and Pale Clock is an artifact that can manipulate time. Bear Village is home to Ursa Minor.`;
  
  switch (selectedMode.value) {
    case 'creative':
      return basePrompt + `\n\nYou are currently in CREATIVE mode. Be more artistic, metaphorical, and imaginative in your responses. Incorporate poetic language and vivid imagery.`;
    case 'archmage':
      return basePrompt + `\n\nYou are currently in ARCHMAGE mode. Be deeply philosophical, profound, and multi-dimensional in your analysis. Explore the metaphysical implications of questions.`;
    default:
      return basePrompt + `\n\nYou are currently in BALANCED mode. Provide clear, precise, and helpful responses with a perfect balance of technical information and accessibility.`;
  }
};

// No longer need the saveApiKey function

// Send message to backend API
const sendMessage = async (text) => {
  const messageText = text || userInput.value.trim();
  if (!messageText) return;
  
  // Add user message to chat
  messages.value.push({
    role: 'user',
    content: messageText,
    timestamp: Date.now()
  });
  
  // Clear input field
  userInput.value = '';
  if (inputField.value) inputField.value.style.height = 'auto';
  
  // Scroll to bottom
  await scrollToBottom();
  
  // Start loading state
  isLoading.value = true;
  
  try {
    // Instead of using OpenAI API directly, use a simple relay API endpoint
    // This endpoint will use the server's API key, not requiring the user to provide one
    const response = await axios.post('/api/chat', {
      messages: [
        { role: 'system', content: getDawntasySystemPrompt() },
        ...messages.value.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 1000,
      model: 'gpt-3.5-turbo'
    });
    
    // Add assistant's response
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      const aiContent = response.data.choices[0].message.content;
      messages.value.push({
        role: 'assistant',
        content: aiContent,
        timestamp: Date.now()
      });
    } else {
      throw new Error("Invalid response from API");
    }
    
  } catch (error) {
    console.error('Error sending message:', error);
    let errorMessage = "⚠️ *The Rift appears to be unstable at the moment.* I'm having trouble connecting to the cosmic streams.";
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage += "\n\n**API Key Error**: The application's API key appears to be invalid. Please contact support.";
      } else if (error.response.data && error.response.data.error) {
        errorMessage += "\n\n**Error Details**: " + error.response.data.error.message;
      } else {
        errorMessage += "\n\n**Error**: " + error.message;
      }
    } else {
      errorMessage += "\n\nNetwork error or connection issue. This could be because:";
      errorMessage += "\n1. Your ad blocker might be preventing the API call";
      errorMessage += "\n2. The server might be experiencing issues";
      errorMessage += "\n\nPlease try again in a moment.";
    }
    
    messages.value.push({
      role: 'assistant',
      content: errorMessage,
      timestamp: Date.now()
    });
  } finally {
    isLoading.value = false;
    await nextTick();
    scrollToBottom();
  }
};

// Scroll chat to bottom
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Initialize on component mount
onMounted(() => {
  // Focus on the input field
  nextTick(() => {
    if (inputField.value) {
      inputField.value.focus();
    }
  });
});
</script>

<style scoped>
.test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0f172a;
  color: white;
}

.test-header {
  text-align: center;
  margin-bottom: 20px;
}

.test-header h1 {
  background: linear-gradient(to right, #fff, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.description {
  color: rgba(255, 255, 255, 0.7);
}

/* Removed API key section styles */

.btn {
  background: linear-gradient(to right, #8b5cf6, #6d28d9);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.chat-interface {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.messages-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 60vh;
}

.welcome-message {
  text-align: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 10px;
  margin-bottom: 20px;
}

.welcome-message h2 {
  margin-bottom: 10px;
  color: #8b5cf6;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}

.suggestion-button {
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  cursor: pointer;
}

.message {
  padding: 12px;
  border-radius: 10px;
  max-width: 80%;
  position: relative;
}

.message.user {
  align-self: flex-end;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.message.assistant {
  align-self: flex-start;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.message-header {
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.message-content {
  line-height: 1.5;
  white-space: pre-wrap;
}

.message-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 5px;
  text-align: right;
}

.highlight-term {
  color: #8b5cf6;
  font-weight: bold;
}

.loading-indicator {
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  color: rgba(255, 255, 255, 0.7);
}

.loading-dots {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: #8b5cf6;
  border-radius: 50%;
  animation: dot-bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  background: rgba(15, 23, 42, 0.9);
  border-top: 1px solid rgba(139, 92, 246, 0.2);
}

.mode-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.mode-selector select {
  background: rgba(15, 23, 42, 0.8);
  color: white;
  border: 1px solid rgba(139, 92, 246, 0.3);
  padding: 5px;
  border-radius: 5px;
}

.message-input {
  width: 100%;
  min-height: 80px;
  max-height: 150px;
  padding: 10px;
  border-radius: 5px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: white;
  resize: vertical;
}

.send-button {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.send-button:disabled {
  background: rgba(139, 92, 246, 0.3);
  cursor: not-allowed;
}

.footer {
  margin-top: 20px;
  text-align: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Responsive design */
@media (max-width: 768px) {
  .test-container {
    padding: 10px;
  }
  
  .message {
    max-width: 90%;
  }
}
</style>