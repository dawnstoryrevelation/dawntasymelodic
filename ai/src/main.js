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
// Add this to your main.js or near the top of your application to check for environment variables

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

// Run the check
checkEnvVariables();

initApp();