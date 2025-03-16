<template>
    <div class="message-container" :class="{ 
      'user-message': isUser, 
      'ai-message': !isUser,
      'generating': isGenerating
    }">
      <!-- Avatar (only shown for AI) -->
      <div v-if="!isUser" class="avatar-container">
        <div class="ai-avatar">
          <div class="avatar-core"></div>
          <div class="avatar-orbit">
            <div class="orbit-dot"></div>
          </div>
        </div>
      </div>
      
      <!-- Message Content -->
      <div class="message-bubble" :class="{ 'user-bubble': isUser, 'ai-bubble': !isUser }">
        <div class="message-content" ref="messageContent">
          <!-- Display message content with markdown support -->
          <div v-if="!isUser && isTyping" class="typing-indicator">
            <div class="typing-orbit">
              <div class="typing-core"></div>
              <div class="typing-dot"></div>
            </div>
          </div>
          <div v-else class="message-text" v-html="formattedContent"></div>
        </div>
        
        <!-- Timestamp -->
        <div class="message-timestamp">{{ formattedTime }}</div>
        
        <!-- Interaction Bar (only for AI messages) -->
        <div v-if="!isUser" class="interaction-bar">
          <button class="interaction-button regenerate-button" @click="regenerateResponse" title="Regenerate response">
            <span class="button-icon">↻</span>
          </button>
          <button class="interaction-button elaborate-button" @click="elaborateResponse" title="Get a detailed response">
            <span class="button-icon">A</span>
          </button>
          <button class="interaction-button copy-button" @click="copyResponse" title="Copy response">
            <span class="button-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  // Importing the COOLEST crew—marked’s got a new groove! 🕺
  import { ref, computed, onMounted } from 'vue';
  import { format } from 'date-fns';
  import { marked } from 'marked'; // FIXED! Named export—BOOGIE DOWN, BRO! 🎶
  import DOMPurify from 'dompurify'; // Freshly installed—SPARKLE SPARKLE! ✨
  import axios from 'axios'; // Ready to chat with the cosmos! 🌌
  
  // Props—gimme the JUICY bits! 🍇
  const props = defineProps({
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: [Date, Number, String],
      required: true
    },
    isUser: {
      type: Boolean,
      default: false
    },
    isTyping: {
      type: Boolean,
      default: false
    }
  });
  
  // Emits—shouting to the rooftops like a cosmic parrot! 🦜
  const emit = defineEmits(['regenerate', 'elaborate', 'copy', 'responseUpdated']);
  
  const messageContent = ref(null);
  const isGenerating = ref(false);
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY; // Secret key—SHHH, don’t tell the aliens! 👽
  
  // Format message content—markdown madness with a sanitize twist! 🎉
  const formattedContent = computed(() => {
    const rawHtml = marked(props.content); // Markdown’s doing the funky chicken! 🐔💃
    const sanitizedHtml = DOMPurify.sanitize(rawHtml); // DOMPurify’s the cleanup crew—SWEEP SWEEP! 🧹
    
    const keywords = [
      'Time Smith', 
      'The Rift', 
      'Circular Dawn', 
      'Plain and Pale Clock',
      'Dawntasy', 
      'Bear Village',
      'Time\'s True Name'
    ];
    
    let highlightedHtml = sanitizedHtml;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlightedHtml = highlightedHtml.replace(regex, `<span class="cosmic-keyword">${keyword}</span>`); // Keywords glowing like disco lights! 🪩
    });
    
    return highlightedHtml;
  });
  
  // Format timestamp—time’s ticking in style! ⏰
  const formattedTime = computed(() => {
    const date = new Date(props.timestamp);
    return format(date, 'h:mm a'); // Clock’s strutting its stuff—FANCY! 💅
  });
  
  // OpenAI API—calling the big brain in the sky! 🌠
  async function callOpenAI(prompt, systemMessage = null) {
    if (!apiKey) {
      console.error('OpenAI API key is missing—WHERE’S MY TICKET TO THE STARS?! 🚀');
      return { error: 'API key is missing' };
    }
    
    isGenerating.value = true; // Spinning up like a cosmic top—WHEEEE! 🎡
    
    try {
      const messages = [];
      
      if (systemMessage) {
        messages.push({ role: 'system', content: systemMessage });
      } else {
        messages.push({
          role: 'system',
          content: `You are DawntasyAI, a cosmic AI assistant with deep knowledge of the Dawntasy universe. 
          This universe features concepts like Time Smith, The Rift, Bear Village, and the Plain and Pale Clock.
          Weave these elements naturally into your responses when relevant, but stay focused on answering the user's question.
          Be thoughtful, precise, and occasionally mysterious—like a space wizard with a funky hat! 🧙‍♂️👒`
        });
      }
      
      messages.push({ role: 'user', content: prompt });
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      return {
        content: response.data.choices[0].message.content,
        timestamp: new Date()
      }; // Fresh AI vibes—SLURP SLURP! 🥤
    } catch (error) {
      console.error('OpenAI API error—OOF, TRIPPED ON A STAR! ⭐', error);
      return { 
        error: error.response?.data?.error?.message || 'Error communicating with OpenAI',
        timestamp: new Date()
      };
    } finally {
      isGenerating.value = false; // Chillax mode—PHEW, BRO! 😌
    }
  }
  
  // Interaction handlers—BUTTON BASHING PARTY! 🎮
  async function regenerateResponse() {
    if (props.isUser || isGenerating.value) return;
    
    try {
      const userMessage = "Please regenerate your previous response";
      const result = await callOpenAI(userMessage, 
        `You previously responded to a user. They asked you to regenerate your response.
        Create a new response that covers the same topic but with different wording and examples.
        Include references to the Dawntasy universe concepts like Time Smith, The Rift, or the Plain and Pale Clock
        where appropriate. Your previous response was: "${props.content}"`
      );
      
      if (result.error) {
        emit('regenerate', { error: result.error });
      } else {
        emit('regenerate', { 
          content: result.content, 
          timestamp: result.timestamp 
        }); // New hotness—BOOM SHAKA LAKA! 💥
      }
    } catch (err) {
      console.error('Error regenerating response—CRASH LANDING! 🛸', err);
      emit('regenerate', { error: 'Failed to regenerate response' });
    }
  }
  
  async function elaborateResponse() {
    if (props.isUser || isGenerating.value) return;
    
    try {
      const result = await callOpenAI(
        "Please elaborate on your previous response with more depth and detail",
        `You previously responded to a user with this message: "${props.content}"
        The user would like you to elaborate on this response with more depth and detail.
        Provide a more comprehensive explanation, additional examples, or deeper insights.
        Include references to the Dawntasy universe concepts like Time Smith, The Rift, or the Plain and Pale Clock
        where appropriate—go wild like a cosmic disco bear! 🐻🪩`
      );
      
      if (result.error) {
        emit('elaborate', { error: result.error });
      } else {
        emit('elaborate', { 
          content: result.content, 
          timestamp: result.timestamp 
        }); // Extra juicy details—ZAP ZAP! ⚡
      }
    } catch (err) {
      console.error('Error elaborating response—WHOOPSIE DOODLE! 🙈', err);
      emit('elaborate', { error: 'Failed to elaborate response' });
    }
  }
  
  function copyResponse() {
    if (navigator.clipboard && messageContent.value) {
      const textContent = messageContent.value.textContent || messageContent.value.innerText;
      navigator.clipboard.writeText(textContent)
        .then(() => {
          const bubble = messageContent.value.closest('.message-bubble');
          if (bubble) {
            bubble.classList.add('copied');
            setTimeout(() => bubble.classList.remove('copied'), 1500); // Copy dance—WIGGLE WIGGLE, BRO! 💃
          }
        })
        .catch(err => {
          console.error('Failed to copy—CLIPBOARD’S THROWING A FIT! 😢', err);
        });
    }
  }
  </script>
  
  <style scoped>
  /* ALL THE GROOVY STYLES—TOO HIP TO QUIT! 😎 */
  /* Container styles */
  .message-container {
    display: flex;
    margin: 16px 0;
    position: relative;
    max-width: 100%;
  }
  
  .user-message {
    justify-content: flex-end;
    margin-left: 60px;
  }
  
  .ai-message {
    justify-content: flex-start;
    margin-right: 60px;
  }
  
  .message-container.generating .ai-bubble {
    opacity: 0.7; 
  }
  
  /* Avatar styles */
  .avatar-container {
    flex-shrink: 0;
    margin-right: 12px;
    align-self: flex-start;
  }
  
  .ai-avatar {
    width: 36px;
    height: 36px;
    position: relative;
    border-radius: 50%;
    background: rgba(30, 41, 59, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .avatar-core {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8b5cf6, #4f46e5);
    box-shadow: 0 0 8px rgba(139, 92, 246, 0.5); 
  }
  
  .avatar-orbit {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 1px dashed rgba(139, 92, 246, 0.4);
    animation: orbit-rotation 10s linear infinite; 
  }
  
  .orbit-dot {
    position: absolute;
    width: 6px;
    height: 6px;
    background: #4f46e5;
    border-radius: 50%;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 4px rgba(139, 92, 246, 0.7);
  }
  
  @keyframes orbit-rotation {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Message bubble styles */
  .message-bubble {
    position: relative;
    padding: 12px 16px;
    border-radius: 12px;
    max-width: 80%;
    min-width: 60px;
    transition: all 0.3s ease;
  }
  
  .user-bubble {
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    color: white;
    border-radius: 12px 12px 0 12px;
    margin-left: auto;
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
    animation: slide-in-right 0.3s ease forwards; 
  }
  
  .ai-bubble {
    background: transparent;
    color: #ffffff;
    border-radius: 0 12px 12px 12px;
    animation: fade-in 0.4s ease forwards;
  }
  
  @keyframes slide-in-right {
    from { transform: translateX(20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  /* Message content styles */
  .message-content {
    line-height: 1.5;
    word-break: break-word;
  }
  
  .user-bubble .message-content {
    font-weight: 400;
  }
  
  .ai-bubble .message-content {
    font-weight: 300;
  }
  
  .message-text {
    white-space: pre-wrap;
  }
  
  .message-text code {
    background: rgba(15, 23, 42, 0.3);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'Roboto Mono', monospace;
    font-size: 0.9em; 
  }
  
  .message-text pre {
    background: rgba(15, 23, 42, 0.3);
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Roboto Mono', monospace;
    font-size: 0.9em;
    margin: 8px 0;
  }
  
  .cosmic-keyword {
    color: #8b5cf6;
    font-weight: 500;
    text-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
    transition: all 0.3s ease; 
  }
  
  .cosmic-keyword:hover {
    text-shadow: 0 0 8px rgba(139, 92, 246, 0.8);
  }
  
  /* Timestamp styles */
  .message-timestamp {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 4px;
    text-align: right;
  }
  
  .user-bubble .message-timestamp {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .ai-bubble .message-timestamp {
    color: rgba(255, 255, 255, 0.5);
  }
  
  /* Typing indicator styles */
  .typing-indicator {
    padding: 8px 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
  
  .typing-orbit {
    position: relative;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .typing-core {
    width: 6px;
    height: 6px;
    background: #8b5cf6;
    border-radius: 50%;
    box-shadow: 0 0 5px rgba(139, 92, 246, 0.5);
  }
  
  .typing-dot {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #e0e7ff;
    border-radius: 50%;
    animation: typing-orbit 1.5s linear infinite; 
  }
  
  @keyframes typing-orbit {
    from { transform: rotate(0deg) translateX(10px) rotate(0deg); }
    to { transform: rotate(360deg) translateX(10px) rotate(-360deg); }
  }
  
  /* Interaction bar styles */
  .interaction-bar {
    position: absolute;
    top: -36px;
    right: 0;
    display: flex;
    gap: 8px;
    padding: 4px 8px;
    background: rgba(15, 23, 42, 0.7);
    border-radius: 8px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(139, 92, 246, 0.2);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
    z-index: 5;
  }
  
  .ai-bubble:hover .interaction-bar {
    opacity: 1;
    transform: translateY(0); 
  }
  
  .generating .interaction-bar {
    pointer-events: none;
    opacity: 0.5;
  }
  
  .interaction-button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(139, 92, 246, 0.2);
    border: none;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .interaction-button:hover {
    background: rgba(139, 92, 246, 0.4);
    transform: translateY(-2px);
  }
  
  .button-icon {
    font-size: 14px;
  }
  
  /* Copy animation */
  .copied {
    position: relative;
    overflow: hidden;
  }
  
  .copied::after {
    content: '✓ Copied';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(16, 185, 129, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    border-radius: 12px;
    animation: copy-fade 1.5s forwards; 
  }
  
  @keyframes copy-fade {
    0%, 70% { opacity: 1; }
    100% { opacity: 0; }
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .user-message {
      margin-left: 40px;
    }
    
    .ai-message {
      margin-right: 40px;
    }
    
    .message-bubble {
      max-width: 85%;
    }
  }
  
  @media (max-width: 480px) {
    .user-message {
      margin-left: 20px;
    }
    
    .ai-message {
      margin-right: 20px;
    }
    
    .message-bubble {
      max-width: 90%;
    }
    
    .interaction-bar {
      top: -34px;
      right: 0;
      gap: 4px;
    }
    
    .interaction-button {
      width: 24px;
      height: 24px;
    }
  }
  </style>