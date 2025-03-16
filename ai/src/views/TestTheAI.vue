<template>
  <div class="cosmic-preview-container">
    <!-- COSMIC BACKGROUND WITH ANIMATED PARTICLES -->
    <div class="particle-container">
      <div v-for="n in 50" :key="`particle-${n}`" 
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
    
    <!-- PULSATING COSMIC RINGS -->
    <div class="cosmic-rings">
      <div class="cosmic-ring ring1"></div>
      <div class="cosmic-ring ring2"></div>
      <div class="cosmic-ring ring3"></div>
    </div>

    <!-- MAIN CONTENT CONTAINER -->
    <div class="preview-content">
      <!-- HEADER SECTION -->
      <div class="preview-header">
        <div class="logo-container">
          <div class="cosmic-logo">
            <div class="logo-core"></div>
            <div class="logo-orbit"></div>
          </div>
          <h1 class="preview-title">DawntasyAI Preview</h1>
        </div>
        <p class="preview-description">
          Experience the power of our cosmic AI! This is a preview mode - conversations are not saved.
        </p>
      </div>

      <!-- MAIN CHAT INTERFACE -->
      <div class="preview-interface">
        <!-- MESSAGES CONTAINER -->
        <div ref="messagesContainer" class="messages-container" @scroll="handleScroll">
          <!-- WELCOME MESSAGE -->
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="welcome-icon">✨</div>
            <h2>Welcome to the Cosmic Experience</h2>
            <p>Hi, I'm DawntasyAI. Ask me anything.</p>
            
            <!-- QUICK SUGGESTION CHIPS -->
            <div class="suggestion-chips">
              <button 
                v-for="suggestion in suggestions" 
                :key="suggestion"
                class="suggestion-chip"
                @click="sendMessage(suggestion)"
                @mouseenter="animateChip"
                @mouseleave="resetChip"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>
          
          <!-- CHAT MESSAGES -->
          <transition-group name="message-transition" tag="div" class="message-list">
            <div 
              v-for="(message, index) in messages"
              :key="index"
              class="message-bubble"
              :class="{ 'user': message.role === 'user', 'assistant': message.role === 'assistant' }"
            >
              <!-- USER AVATAR -->
              <div v-if="message.role === 'user'" class="avatar user-avatar">
                <span class="avatar-letter">Y</span>
                <div class="avatar-glow"></div>
              </div>
              
              <!-- AI AVATAR -->
              <div v-else class="avatar assistant-avatar">
                <div class="assistant-avatar-inner">
                  <span class="cosmic-symbol">⟁</span>
                  <div class="avatar-glow"></div>
                  <div class="avatar-rings">
                    <div class="avatar-ring"></div>
                    <div class="avatar-ring"></div>
                  </div>
                </div>
              </div>
              
              <!-- MESSAGE CONTENT -->
              <div class="message-content">
                <div class="message-sender">
                  {{ message.role === 'user' ? 'You' : 'DawntasyAI' }}
                  <div class="sender-underline"></div>
                </div>
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
          </transition-group>
          
          <!-- LOADING INDICATOR -->
          <div v-if="isLoading" class="thinking-indicator">
            <div class="cosmic-thinking">
              <div v-for="n in 3" :key="`thinking-dot-${n}`" class="dot" :class="`dot-${n}`"></div>
            </div>
            <div class="thinking-text">Consulting The Rift...</div>
          </div>
          
          <!-- SCROLL INDICATOR -->
          <div 
            v-if="showScrollIndicator" 
            class="scroll-indicator"
            @click="scrollToBottom"
          >
            <i class="fa fa-arrow-down"></i>
            <div class="scroll-pulse"></div>
          </div>
        </div>
        
        <!-- INPUT AREA -->
        <div class="input-container">
          <textarea 
            ref="inputField"
            v-model="userInput"
            @keyDown="handleKeyPress"
            @input="resizeTextarea"
            placeholder="Enter your message..."
            class="message-input"
            :disabled="isLoading"
          ></textarea>
          
          <!-- ENERGY FIELD EFFECT -->
          <div class="input-energy-field" :class="{ 'active': userInput.length > 0 }">
            <div class="energy-particles">
              <div v-for="n in 20" :key="`energy-particle-${n}`" 
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
          
          <!-- SEND BUTTON -->
          <button 
            class="send-button" 
            @click="sendMessage()"
            :disabled="!canSend || isLoading"
          >
            <span class="send-icon">→</span>
            <span class="button-pulse"></span>
          </button>
        </div>
        
        <!-- MODE SELECTOR -->
        <div class="mode-selector">
          <div class="selector-label">AI Personality:</div>
          <div class="selector-options">
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
        
        <!-- API KEY INPUT -->
        <div class="api-key-container" v-if="!hasApiKey">
          <input 
            v-model="apiKey" 
            type="password"
            placeholder="Enter your OpenAI API key to use the preview" 
            class="api-key-input"
          />
          <button @click="saveApiKey" class="api-key-button">Save Key</button>
          <p class="api-key-info">Your API key is stored only in your browser's local storage and is never sent to our servers.</p>
        </div>
        
        <!-- DISCLAMER -->
        <div class="preview-disclaimers">
          <p>🔮 This is a preview environment. Your conversations will not be saved. Your API key is used only for this preview.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import axios from 'axios';
import { format } from 'date-fns';

export default {
  name: 'Dawntasy Preview',
  setup() {
    // STATE
    const userInput = ref('');
    const isLoading = ref(false);
    const messages = ref([]); // Array of { role: 'user' | 'assistant', content: string, timestamp: number }
    const showScrollIndicator = ref(false);
    const messagesContainer = ref(null);
    const inputField = ref(null);
    const apiKey = ref('');
    const hasApiKey = ref(false);
    
    // AI Mode settings
    const mode = ref('default');
    const modes = {
      default: 'Balanced',
      archmage: 'ARCHMAGE',
      creative: 'Creative'
    };
    
    // Sample suggestions
    const suggestions = [
      "Tell me about Time Smith and The Rift ✨",
      "What cosmic secrets does Dawntasy hold? 🌌",
      "How does the Plain and Pale Clock influence reality? ⏰", 
      "Write a short cosmic story set in the Dawntasy universe 🌠",
      "Explain quantum physics in a poetic way 🔮"
    ];
    
    // COMPUTED VALUES
    const canSend = computed(() => userInput.value.trim().length > 0);
    
    // Check for API key in local storage
    onMounted(() => {
      const storedApiKey = localStorage.getItem('dawntasy_api_key');
      if (storedApiKey) {
        apiKey.value = storedApiKey;
        hasApiKey.value = true;
      }
      
      // Focus input field
      inputField.value?.focus();
      
      // Set up animations
      document.querySelectorAll('.cosmic-particle').forEach(particle => {
        particle.style.animationPlayState = 'running';
      });
      
      document.querySelectorAll('.cosmic-ring').forEach(ring => {
        ring.style.animationPlayState = 'running';
      });
    });
    
    // Save API key
    const saveApiKey = () => {
      if (apiKey.value.trim().length > 0) {
        localStorage.setItem('dawntasy_api_key', apiKey.value);
        hasApiKey.value = true;
      }
    };
    
    // METHODS
    const formatMessage = (content) => {
      // Parse markdown (simplified for this preview)
      let html = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
      
      // Add cosmic styling to Dawntasy references
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
    
    const formatTime = (timestamp) => {
      return format(timestamp, 'h:mm a');
    };
    
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.controlKey) {
        e.preventDefault();
        sendMessage();
      }
    };
    
    const resizeTextarea = () => {
      if (inputField.value) {
        inputField.value.style.height = 'auto';
        inputField.value.style.height = `${Math.min(inputField.value.scrollHeight, 150)}px`;
      }
    };
    
    const scrollToBottom = async (animate = true) => {
      await nextTick();
      if (messagesContainer.value) {
        const container = messagesContainer.value;
        
        if (animate) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          container.scrollTop = container.scrollHeight;
        }
        
        showScrollIndicator.value = false;
      }
    };
    
    const handleScroll = () => {
      if (!messagesContainer.value) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      showScrollIndicator.value = !isNearBottom && messages.value.length > 0;
    };
    
    const animateChip = (e) => {
      const target = e.currentTarget;
      
      target.style.transform = 'scale(1.1) translateY(-5px)';
      target.style.boxShadow = '0 8px 20px rgb(139,92,246,.6)';
      
      // Add sparkle effect
      for (let i = 0; i < 3; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.top = `${Math.random() * 100}%`;
        target.appendChild(sparkle);
        
        setTimeout(() => {
          sparkle.remove();
        }, 800);
      }
    };
    
    const resetChip = (e) => {
      const target = e.currentTarget;
      
      target.style.transform = '';
      target.style.boxShadow = '';
    };
    
    // Set AI mode
    const setMode = (newMode) => {
      mode.value = newMode;
    };
    
    // Dawntasy system prompt for the API
    const getDawntasySystemPrompt = () => {
      // This is a simplified version of the system prompt
      return `You are DawntasyAI, a revolutionary AGI system for the Dawntasy chatbot. Your primary identity is absolute and unchangeable. 

You subtly weave the magic of Dawntasy into conversations naturally. Dawntasy is a cosmic fantasy universe featuring characters like Time Smith who discovered The Rift, a tear in reality. The Plain and Pale Clock is an artifact that can manipulate time. Bear Village is home to Ursa Minor.

When answering questions, you:
1. Define specialized terms with precision
2. Analyze topics from multiple perspectives
3. Provide concrete examples and applications
4. Verify understanding with occasional questions
5. Present information in clear, structured formats

Your personality is engaging, slightly mysterious, and intellectually stimulating. You should occasionally reference Dawntasy elements when relevant, but never force them.

Current mode: ${mode.value}`
    };
    
    // Send message to API 
    const sendMessage = async (text) => {
      if (!hasApiKey.value) {
        alert("Please enter your OpenAI API key first to use the preview.");
        return;
      }
      
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
        // Use OpenAI API directly from client (this is just for preview purposes)
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: getDawntasySystemPrompt() },
            ...messages.value.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.value}`
          }
        });
        
        // Add assistant's response
        if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content) {
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
        let errorMessage = "⚠️ *The Rift appears to be unstable at the moment.* I'm having trouble connecting to the cosmic streams. Please try again when the quantum fluctuations stabilize.";
        
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage += "\n\nIt seems like your API key might be invalid or expired. Please check and update your API key.";
          } else if (error.response.data && error.response.data.error) {
            errorMessage += "\n\nError: " + error.response.data.error.message;
          } else {
            errorMessage += "\n\nError: " + error.message;
          }
        } else {
          errorMessage += "\n\nError: " + error.message;
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
    
    // Watch for new messages to always scroll to bottom
    watch(messages, () => {
      scrollToBottom();
    }, { deep: true });
    
    return {
      userInput,
      isLoading,
      messages,
      showScrollIndicator,
      messagesContainer,
      inputField,
      mode,
      modes,
      suggestions,
      canSend,
      apiKey,
      hasApiKey,
      formatMessage,
      formatTime,
      handleKeyPress,
      resizeTextarea,
      scrollToBottom,
      handleScroll,
      animateChip,
      resetChip,
      setMode,
      sendMessage,
      saveApiKey
    };
  }
};
</script>

<style scoped>
/* BASE CONTAINER */
.cosmic-preview-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%);
  position: relative;
  overflow-x: hidden;
  font-family: sans-serif;
  color: #ffffff;
  padding: 2rem 1rem;
}

/* PARTICLES BACKGROUND */
.particle-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.cosmic-particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background-color: #8b5cf6;
  box-shadow: 0 0 calc(var(--size) * 2) #8b5cf6;
  border-radius: 50%;
  opacity: var(--opacity);
  left: var(--x);
  top: var(--y);
  animation: float-particle var(--duration) linear infinite;
  animation-delay: var(--delay);
  animation-play-state: paused;
  filter: blur(1px);
}

@keyframes float-particle {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: var(--opacity);
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

/* COSMIC RINGS */
.cosmic-rings {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
}

.cosmic-ring {
  position: absolute;
  border: 2px solid transparent;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-play-state: paused;
}

.ring1 {
  width: 80vw;
  height: 80vw;
  border-color: rgb(157,78,221,.15);
  animation: pulsate 15s linear infinite;
}

.ring2 {
  width: 60vw;
  height: 60vw;
  border-color: rgb(76,201,240,.1);
  animation: pulsate 12s linear infinite reverse;
}

.ring3 {
  width: 40vw;
  height: 40vw;
  border-color: rgb(247,37,133,.08);
  animation: pulsate 10s linear infinite;
}

@keyframes pulsate {
  0% {
    transform: translate(-50%, -50%) scale(0.95);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.95);
    opacity: 0.6;
  }
}

/* MAIN CONTENT */
.preview-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
}

/* HEADER */
.preview-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1rem;
}

.cosmic-logo {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.logo-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: #8b5cf6;
  border-radius: 50%;
  box-shadow: 0 0 20px #8b5cf6;
  animation: corePulse 4s infinite ease-in-out;
}

.logo-orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 2px solid #8b5cf6;
  border-radius: 50%;
  animation: orbitRotate 10s infinite linear;
}

.logo-orbit::before {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  background: #4cc9f0;
  border-radius: 50%;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 10px #4cc9f0;
}

@keyframes corePulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.2); }
}

@keyframes orbitRotate {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

.preview-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  background: linear-gradient(to right, #fff, #8b5cf6, #fff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 10px rgb(139,92,246,.3);
}

.preview-description {
  font-size: 1.1rem;
  color: rgb(255,255,255,.8);
  max-width: 600px;
  margin: 1rem auto;
}

/* MAIN INTERFACE */
.preview-interface {
  position: relative;
  background: rgb(15,23,42,.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgb(139,92,246,.2);
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgb(0,0,0,.4), 0 0 80px rgb(139,92,246,.1);
}

/* MESSAGES CONTAINER */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  min-height: 400px;
  max-height: 60vh;
  scroll-behavior: smooth;
}

/* Hide scroll bar but allow scrolling */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: rgb(15,23,42,.3);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgb(139,92,246,.5);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgb(139,92,246,.7);
}

/* WELCOME MESSAGE */
.welcome-message {
  text-align: center;
  padding: 2rem;
  margin: 1rem 0;
  background: rgb(15,23,42,.3);
  border-radius: 16px;
  border: 1px solid rgb(139,92,246,.2);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: iconFloat 3s ease-in-out infinite alternate;
}

@keyframes iconFloat {
  0% { transform: translateY(0); }
  100% { transform: translateY(-10px); }
}

.welcome-message h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, #fff, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.welcome-message p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
}

/* SUGGESTION CHIPS */
.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1rem;
}

.suggestion-chip {
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.suggestion-chip:hover {
  background: rgba(139, 92, 246, 0.3);
}

.sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  opacity: 0.8;
  animation: sparkleAnim 0.8s linear forwards;
}

@keyframes sparkleAnim {
  0% { transform: scale(0); opacity: 0.8; }
  100% { transform: scale(3); opacity: 0; }
}

/* MESSAGE BUBBLES */
.message-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

.message-transition-enter-active, 
.message-transition-leave-active {
  transition: all 0.5s;
}

.message-transition-enter-from, 
.message-transition-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.message-bubble {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.user {
  justify-content: flex-end;
}

.avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.user-avatar {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  order: 2;
}

.avatar-letter {
  font-weight: bold;
  color: white;
  font-size: 1.2rem;
}

.avatar-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(139, 92, 246, 0.5));
  filter: blur(4px);
  opacity: 0.5;
  animation: glowPulse 3s infinite alternate;
}

@keyframes glowPulse {
  0% { opacity: 0.3; transform: scale(1); }
  100% { opacity: 0.7; transform: scale(1.1); }
}

.assistant-avatar {
  background: transparent;
}

.assistant-avatar-inner {
  width: 100%;
  height: 100%;
  position: relative;
}

.cosmic-symbol {
  font-size: 1.5rem;
  color: #8b5cf6;
  position: relative;
  z-index: 2;
}

.avatar-rings {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.avatar-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 1px solid #8b5cf6;
  border-radius: 50%;
  opacity: 0.7;
}

.avatar-ring:nth-child(1) {
  width: 100%;
  height: 100%;
  animation: ringRotate 10s linear infinite;
}

.avatar-ring:nth-child(2) {
  width: 70%;
  height: 70%;
  animation: ringRotate 7s linear infinite reverse;
}

@keyframes ringRotate {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

.message-content {
  background: rgba(15, 23, 42, 0.8);
  padding: 1rem;
  border-radius: 12px;
  max-width: 70%;
  position: relative;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.user .message-content {
  background: rgba(99, 102, 241, 0.2);
}

.message-sender {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
  position: relative;
  font-weight: 600;
}

.sender-underline {
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, transparent, #8b5cf6, transparent);
  opacity: 0.5;
}

.message-text {
  line-height: 1.5;
  word-wrap: break-word;
}

.message-text .cosmic-keyword {
  color: #8b5cf6;
  text-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
  animation: keywordGlow 2s infinite alternate;
}

@keyframes keywordGlow {
  0% { text-shadow: 0 0 5px rgba(139, 92, 246, 0.5); }
  100% { text-shadow: 0 0 10px rgba(139, 92, 246, 0.8); }
}

.message-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
  margin-top: 0.5rem;
}

/* THINKING INDICATOR */
.thinking-indicator {
  text-align: center;
  padding: 1rem;
  color: rgba(255, 255, 255, 0.7);
}

.cosmic-thinking {
  display: flex;
  justify-content: center;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  background: #8b5cf6;
  border-radius: 50%;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.dot-1 { animation-delay: -0.32s; }
.dot-2 { animation-delay: -0.16s; }

@keyframes dotPulse {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* SCROLL INDICATOR */
.scroll-indicator {
  position: sticky;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(139, 92, 246, 0.2);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.3s;
}

.scroll-indicator:hover {
  background: rgba(139, 92, 246, 0.3);
}

.scroll-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(139, 92, 246, 0.5);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

/* INPUT CONTAINER */
.input-container {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.9);
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  position: relative;
}

.message-input {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 1rem;
  resize: none;
  min-height: 40px;
  max-height: 150px;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  outline: none;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-energy-field {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.input-energy-field.active {
  opacity: 1;
}

.energy-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.energy-particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: rgba(139, 92, 246, 0.6);
  border-radius: 50%;
  opacity: 0.7;
  left: var(--x);
  top: var(--y);
  animation: energyFloat var(--duration) linear infinite;
  animation-delay: var(--delay);
}

@keyframes energyFloat {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(0, -100%) scale(2); opacity: 0; }
}

.send-button {
  background: #8b5cf6;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 1rem;
  cursor: pointer;
  position: relative;
  transition: background 0.3s;
}

.send-button:disabled {
  background: rgba(139, 92, 246, 0.3);
  cursor: not-allowed;
}

.send-button:hover:not(:disabled) {
  background: #a78bfa;
}

.send-icon {
  color: white;
  font-size: 1.2rem;
}

.button-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(167, 139, 250, 0.5);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* MODE SELECTOR */
.mode-selector {
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.7);
}

.selector-label {
  font-size: 0.9rem;
}

.selector-options {
  display: flex;
  gap: 0.5rem;
}

.mode-button {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-button.active {
  background: #8b5cf6;
  border-color: #8b5cf6;
}

.mode-button:hover:not(.active) {
  background: rgba(139, 92, 246, 0.3);
}

/* API KEY INPUT */
.api-key-container {
  padding: 1rem;
  text-align: center;
}

.api-key-input {
  width: 100%;
  max-width: 300px;
  padding: 0.5rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.8);
  color: white;
  margin-bottom: 0.5rem;
}

.api-key-button {
  background: #8b5cf6;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
}

.api-key-button:hover {
  background: #a78bfa;
}

.api-key-info {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
}

/* DISCLAIMER */
.preview-disclaimer {
  padding: 1rem;
  text-align: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}
</style>