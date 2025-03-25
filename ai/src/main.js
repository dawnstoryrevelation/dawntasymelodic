// src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

// Import Firebase initialization
import { getFirebaseServices } from './firebase/init';

// Import styles and icons
import './assets/css/main.css';
import 'remixicon/fonts/remixicon.css';

// Create app and initialize Pinia + Router
const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

// Global directives
function registerGlobalDirectives(app) {
  app.directive('click-outside', {
    mounted(el, binding) {
      el._clickOutsideHandler = (event) => {
        if (!(el === event.target || el.contains(event.target))) {
          binding.value(event);
        }
      };
      document.addEventListener('click', el._clickOutsideHandler);
    },
    unmounted(el) {
      document.removeEventListener('click', el._clickOutsideHandler);
    }
  });

  app.directive('focus', {
    mounted(el) {
      el.focus();
    }
  });
}
registerGlobalDirectives(app);

// Error handling
app.config.errorHandler = (err, vm, info) => {
  console.error('🚨 Application Error:', err, 'Component:', vm?.$options?.name || 'Unknown', 'Info:', info, 'Stack:', err.stack);
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; background: rgba(220, 38, 38, 0.95); 
    color: white; padding: 20px; z-index: 10000; font-family: monospace; 
    white-space: pre-wrap; max-height: 80vh; overflow: auto;
  `;
  errorDiv.innerHTML = `
    <h2 style="margin-top: 0">Application Error</h2>
    <p><strong>Message:</strong> ${err.message}</p>
    <p><strong>Component:</strong> ${vm?.$options?.name || 'Unknown'}</p>
    <p><strong>Info:</strong> ${info}</p>
    <pre style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px;">${err.stack}</pre>
    <button onclick="location.reload()" style="background: white; color: rgb(220, 38, 38); border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px; cursor: pointer; font-weight: bold;">Reload</button>
  `;
  document.body.appendChild(errorDiv);
};

// Initialize app
async function initApp() {
  try {
    console.log('🚀 Initializing...');
    console.log('🔥 Setting up Firebase...');
    
    // Ensure Firebase config uses env variables
    const firebaseServices = getFirebaseServices();
    console.log('✅ Firebase ready!');

    // Mount app
    app.mount('#app');
    console.log('✅ App mounted!');

    // Fade out loader
    const appLoader = document.getElementById('app-loader');
    if (appLoader) {
      setTimeout(() => {
        appLoader.style.opacity = '0';
        appLoader.style.transition = 'opacity 0.6s ease-out';
        setTimeout(() => appLoader.style.display = 'none', 600);
      }, 400);
    }
  } catch (error) {
    console.error('⚠️ Init failed:', error);
    const appDiv = document.getElementById('app');
    const appLoader = document.getElementById('app-loader');
    if (appLoader) appLoader.style.display = 'none';
    if (appDiv) {
      appDiv.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: white; max-width: 800px; margin: 0 auto; font-family: system-ui;">
          <h1 style="color: #ff3a70;">Initialization Error</h1>
          <p style="font-size: 1.1rem; margin-bottom: 1.5rem;">App failed to start—network or config issue.</p>
          <div style="background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 8px; text-align: left; margin-bottom: 1.5rem;">
            <h3 style="margin-top: 0; color: #8b5cf6;">Details:</h3>
            <p>${error.message || 'Unknown'}</p>
            <pre style="overflow: auto; background: rgba(0,0,0,0.6); padding: 1rem; border-radius: 4px; color: #f1f5f9; font-size: 0.85rem;">${error.stack || ''}</pre>
          </div>
          <button onclick="window.location.reload()" style="background: #8b5cf6; border: none; color: white; padding: 0.75rem 1.5rem; font-size: 1rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease;">Reload</button>
        </div>
      `;
    }
  }
}
// Environment variable check
function checkEnvVariables() {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_OPENAI_API_KEY'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
    
    // For OpenAI API key specifically, log a more detailed message
    if (missingVars.includes('VITE_OPENAI_API_KEY')) {
      console.warn('⚠️ VITE_OPENAI_API_KEY is missing. This is required for API calls to OpenAI.');
      console.info('ℹ️ The TestTheAI component will use user-provided API keys.');
    }
  } else {
    console.log('✅ All environment variables are present');
  }
}
// Search query detection and handling
document.addEventListener('DOMContentLoaded', function() {
  // Query detection with Natural Language Processing patterns
  function isSearchQuery(text) {
    // Advanced detection for search patterns
    const searchPhrases = [
      // Question patterns
      /^what\s+(?:is|are|was|were)/i,
      /^how\s+(?:to|do|does|can|could|would|should)/i,
      /^why\s+(?:is|are|does|do|can't|won't|didn't)/i,
      /^when\s+(?:is|was|will|did|does|do)/i,
      /^where\s+(?:is|are|can|could|would|should)/i,
      /^who\s+(?:is|are|was|were|will)/i,
      /^which\s+(?:is|are|one|type|kind)/i,
      
      // Information seeking patterns
      /^(?:tell|explain|describe|elaborate)\s+(?:me|us)?\s+(?:about|on)/i,
      /^(?:find|search|look|get|fetch)\s+(?:for|me)?\s+(?:information|data|details)/i,
      
      // Ends with question mark (weighted)
      /\?\s*$/
    ];
    
    return searchPhrases.some(pattern => pattern.test(text)) || text.split(/\s+/).length > 6;
  }
  
  // Intercept send button click to handle search queries
  const sendButton = document.querySelector('.send-button');
  const messageInput = document.querySelector('.message-input');
  
  if (sendButton && messageInput) {
    // Preserve original click handler if it exists
    const originalClickHandler = sendButton.onclick;
    
    sendButton.addEventListener('click', async function(e) {
      const message = messageInput.value.trim();
      
      if (isSearchQuery(message)) {
        e.preventDefault(); // Prevent default send behavior
        
        // Add user message to chat
        addMessageToChat(message, 'user');
        
        // Clear input
        messageInput.value = '';
        
        // Show typing indicator
        showTypingIndicator("Searching the web for you...");
        
        try {
          // Call our backend API that uses OpenAI search
          const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: message })
          });
          
          if (!response.ok) {
            throw new Error('Search request failed');
          }
          
          const data = await response.json();
          hideTypingIndicator();
          
          // Format the response with the content and sources
          const formattedResponse = formatSearchResponse(data);
          addMessageToChat(formattedResponse, 'assistant');
        } catch (error) {
          console.error('Search error:', error);
          hideTypingIndicator();
          addMessageToChat("I'm sorry, I encountered an error while searching the web. Please try again later.", 'assistant');
        }
      } else if (originalClickHandler) {
        // If not a search query, use original handler
        originalClickHandler(e);
      }
    });
  }
  
  // Format search response with citations
  function formatSearchResponse(data) {
    const { content, sources } = data;
    
    // If no sources found, just return the content
    if (!sources || sources.length === 0) {
      return content;
    }
    
    // Format with sources section
    return `${content}

<div class="sources-section">
  <h4>Search Results:</h4>
  <div class="sources-list">
    ${sources.map((source, index) => `
      <div class="source-item">
        <span class="source-num">[${index + 1}]</span>
        <a href="${source.url}" class="source-link" target="_blank">${source.title || source.url}</a>
      </div>
    `).join('')}
  </div>
</div>`;
  }
  
  // Add message to chat (reused from previous code)
  function addMessageToChat(content, sender) {
    const messagesArea = document.querySelector('.messages-area');
    if (!messagesArea) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const messageHeader = document.createElement('div');
    messageHeader.className = `message-header ${sender}`;
    messageHeader.textContent = sender === 'user' ? 'You' : 'Assistant';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = content;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);
    messagesArea.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
  
  // Show typing indicator
  function showTypingIndicator(message) {
    const messagesArea = document.querySelector('.messages-area');
    if (!messagesArea) return;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-indicator';
    loadingDiv.id = 'typing-indicator';
    
    loadingDiv.innerHTML = `
      <div class="spinner">
        <svg class="spinner-svg" viewBox="0 0 50 50">
          <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
        </svg>
      </div>
      <div class="thinking-text">${message || 'Thinking...'}</div>
    `;
    
    messagesArea.appendChild(loadingDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
  
  // Hide typing indicator
  function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
});

// Run the check for environment variables
checkEnvVariables();

initApp();

// Sidebar toggle and modal backdrop handling
document.addEventListener('DOMContentLoaded', function() {
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop';
  document.body.appendChild(modalBackdrop);
  
  // Toggle sidebar if sidebarToggle exists
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.style.transform = sidebar.style.transform === 'translateX(0px)'
        ? 'translateX(-100%)'
        : 'translateX(0px)';
      modalBackdrop.classList.toggle('active');
    });
  }
  
  // Close sidebar when clicking outside
  modalBackdrop.addEventListener('click', function() {
    if (sidebar) {
      sidebar.style.transform = 'translateX(-100%)';
    }
    modalBackdrop.classList.remove('active');
  });
  
  // Handle window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      if (sidebar) {
        sidebar.style.transform = '';
      }
      modalBackdrop.classList.remove('active');
    }
  });
});
