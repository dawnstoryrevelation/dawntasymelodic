// src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { defineAsyncComponent } from 'vue';

// Import Firebase initialization
import { getFirebaseServices } from './firebase/init';

// Import styles - make sure CSS is always included
import './assets/css/main.css';

// Import icons - explicitly import to prevent tree-shaking
import 'remixicon/fonts/remixicon.css';

// Create app instance first
const app = createApp(App);

// Initialize Pinia store BEFORE anything else to avoid the "_s" error
const pinia = createPinia();
app.use(pinia);

// Initialize router AFTER pinia
app.use(router);

// Register global directives
function registerGlobalDirectives(app) {
  // v-click-outside directive
  app.directive('click-outside', {
    mounted(el, binding) {
      el._clickOutsideHandler = (event) => {
        // Check if clicking outside the element
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

  // v-focus directive
  app.directive('focus', {
    mounted(el) {
      el.focus();
    }
  });
}

// Register directives
registerGlobalDirectives(app);

// Comprehensive error handling
app.config.errorHandler = (err, vm, info) => {
  console.error('🚨 Application Error:', err);
  console.error('Component:', vm?.$options?.name || 'Unknown component');
  console.error('Error Info:', info);
  console.error('Stack trace:', err.stack);

  // Display error visibly for easier debugging
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(220, 38, 38, 0.95);
    color: white;
    padding: 20px;
    z-index: 10000;
    font-family: monospace;
    white-space: pre-wrap;
    max-height: 80vh;
    overflow: auto;
  `;
  
  errorDiv.innerHTML = `
    <h2 style="margin-top: 0">Application Error</h2>
    <p><strong>Message:</strong> ${err.message}</p>
    <p><strong>Component:</strong> ${vm?.$options?.name || 'Unknown'}</p>
    <p><strong>Info:</strong> ${info}</p>
    <pre style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px;">${err.stack}</pre>
    <button onclick="location.reload()" style="background: white; color: rgb(220, 38, 38); border: none; padding: 8px 16px; border-radius: 4px; margin-top: 10px; cursor: pointer; font-weight: bold;">Reload Application</button>
  `;
  
  document.body.appendChild(errorDiv);
};

// Initialize application
async function initApp() {
  try {
    console.log('🚀 Initializing application...');
    
    // Initialize Firebase first
    console.log('🔥 Initializing Firebase...');
    const firebaseServices = getFirebaseServices();
    console.log('✅ Firebase initialized successfully');
    
    // Mount the app
    console.log('🔌 Mounting Vue application...');
    app.mount('#app');
    console.log('✅ Application mounted successfully');
    
    // Remove loader with smooth transition
    const appLoader = document.getElementById('app-loader');
    if (appLoader) {
      setTimeout(() => {
        appLoader.style.opacity = '0';
        appLoader.style.transition = 'opacity 0.6s ease-out';
        setTimeout(() => {
          appLoader.style.display = 'none';
        }, 600);
      }, 400);
    }
  } catch (error) {
    console.error('⚠️ Application initialization failed:', error);
    
    // Show error in DOM
    const appDiv = document.getElementById('app');
    const appLoader = document.getElementById('app-loader');
    
    if (appLoader) {
      appLoader.style.display = 'none';
    }
    
    if (appDiv) {
      appDiv.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: white; max-width: 800px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif;">
          <h1 style="color: #ff3a70;">Initialization Error</h1>
          <p style="font-size: 1.1rem; margin-bottom: 1.5rem;">The application couldn't start properly. This might be due to network issues or configuration problems.</p>
          <div style="background: rgba(0,0,0,0.4); padding: 1rem; border-radius: 8px; text-align: left; margin-bottom: 1.5rem;">
            <h3 style="margin-top: 0; color: #8b5cf6;">Error Details:</h3>
            <p>${error.message || 'Unknown error'}</p>
            <pre style="overflow: auto; background: rgba(0,0,0,0.6); padding: 1rem; border-radius: 4px; color: #f1f5f9; font-size: 0.85rem;">${error.stack || ''}</pre>
          </div>
          <button onclick="window.location.reload()" 
            style="background: #8b5cf6; border: none; color: white; padding: 0.75rem 1.5rem; font-size: 1rem; border-radius: 6px; cursor: pointer; transition: all 0.2s ease;">
            Reload Application
          </button>
        </div>
      `;
    }
  }
}

// Start the application
initApp();