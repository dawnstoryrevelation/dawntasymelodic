<!-- src/components/agent/BrowserView.vue -->
<template>
  <div class="browser-view">
    <!-- Browser Loading Indicator -->
    <div v-if="isLoading" class="browser-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingMessage }}</div>
    </div>
    
    <!-- Browser Error Display -->
    <div v-if="hasError" class="browser-error">
      <div class="error-icon">
        <i class="ri-error-warning-line"></i>
      </div>
      <div class="error-message">
        <h3>Browser Error</h3>
        <p>{{ errorMessage }}</p>
        <button @click="retryConnection" class="retry-button">
          <i class="ri-refresh-line"></i> Retry Connection
        </button>
      </div>
    </div>
    
    <!-- Browser Display -->
    <div v-if="!isLoading && !hasError" class="browser-display">
      <!-- Browser Address Bar -->
      <div class="browser-address-bar">
        <div class="browser-controls">
          <button class="browser-control" :disabled="true">
            <i class="ri-arrow-left-line"></i>
          </button>
          <button class="browser-control" :disabled="true">
            <i class="ri-arrow-right-line"></i>
          </button>
          <button class="browser-control" @click="refresh">
            <i class="ri-refresh-line"></i>
          </button>
        </div>
        <div class="browser-url">
          <i class="ri-lock-line"></i>
          <span class="url-text">{{ currentUrl }}</span>
        </div>
      </div>
      
      <!-- Browser Content -->
      <div class="browser-content">
        <!-- Show screenshot if we have one -->
        <img v-if="currentScreenshot" 
             :src="currentScreenshot" 
             alt="Browser screenshot" 
             class="browser-screenshot" 
             :class="{ 'action-typing': currentAction === 'type', 'action-clicking': currentAction === 'click', 'action-scrolling': currentAction === 'scroll' }" />
        
        <!-- Activity Overlay for Real-time Visual Feedback -->
        <div v-if="showActionOverlay" class="action-overlay">
          <div v-if="currentAction === 'type'" class="typing-indicator">
            <div class="typing-animation">
              <span class="typing-cursor">|</span>
              <span class="typing-text">{{ typingText }}</span>
            </div>
            <div class="action-label">Typing...</div>
          </div>
          
          <div v-else-if="currentAction === 'click'" class="click-indicator">
            <div class="click-animation"></div>
            <div class="action-label">Clicking...</div>
          </div>
          
          <div v-else-if="currentAction === 'scroll'" class="scroll-indicator">
            <div class="scroll-animation" :class="scrollDirection"></div>
            <div class="action-label">Scrolling {{ scrollDirection }}...</div>
          </div>
          
          <div v-else-if="currentAction === 'navigate'" class="navigate-indicator">
            <div class="navigate-animation"></div>
            <div class="action-label">Navigating to {{ navigateUrl }}...</div>
          </div>
        </div>
        
        <!-- Show placeholder if no screenshot -->
        <div v-if="!currentScreenshot" class="no-content">
          <i class="ri-computer-line"></i>
          <p>Waiting for browser activity...</p>
        </div>
      </div>
      
      <!-- Browser Status Bar -->
      <div class="browser-status-bar">
        <div class="status-indicator" :class="{ 'active': isActive }">
          <span class="status-dot"></span>
          <span class="status-text">{{ isActive ? 'Active' : 'Idle' }}</span>
        </div>
        <div class="status-action" v-if="currentAction">
          <i class="ri-robot-line"></i>
          <span>{{ actionStatusMessage }}</span>
        </div>
        <div class="status-info">{{ statusMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineProps, defineEmits, computed } from 'vue';
import { usePuppeteerService } from '@/services/puppeteerService';

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  },
  currentAction: {
    type: String,
    default: null
  },
  actionData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['screenshot', 'browser-status', 'action-completed']);

// State variables
const isLoading = ref(true);
const loadingMessage = ref('Connecting to browser...');
const hasError = ref(false);
const errorMessage = ref('');
const currentUrl = ref('about:blank');
const currentScreenshot = ref(null);
const isActive = ref(false);
const statusMessage = ref('Browser ready');
const lastScreenshotTime = ref(0);
const showActionOverlay = ref(false);
const typingText = ref('');
const scrollDirection = ref('down');
const navigateUrl = ref('');

// Action feedback timing
const ACTION_FEEDBACK_DURATION = 1500;

// Computed status message for current action
const actionStatusMessage = computed(() => {
  switch(props.currentAction) {
    case 'type':
      return `Typing "${props.actionData.text?.substring(0, 20)}${props.actionData.text?.length > 20 ? '...' : ''}"`;
    case 'click':
      return `Clicking ${props.actionData.description || 'element'}`;
    case 'scroll':
      return `Scrolling ${props.actionData.direction || 'down'}`;
    case 'navigate':
      return `Navigating to ${props.actionData.url || 'new page'}`;
    case 'wait':
      return `Waiting ${props.actionData.duration ? (props.actionData.duration/1000) + 's' : ''}`;
    default:
      return props.currentAction ? `Performing ${props.currentAction}` : '';
  }
});

// Services
const puppeteerService = usePuppeteerService();

// Polling interval for screenshot updates
let screenshotInterval = null;
let actionFeedbackTimer = null;

// Watch for action changes to show visual feedback
watch(() => props.currentAction, (newAction, oldAction) => {
  if (newAction && newAction !== oldAction) {
    // Reset any existing action feedback
    clearTimeout(actionFeedbackTimer);
    
    // Set up action-specific visual feedback
    if (newAction === 'type' && props.actionData.text) {
      typingText.value = '';
      const textToType = props.actionData.text;
      showActionOverlay.value = true;
      
      // Simulate typing character by character
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex < textToType.length) {
          typingText.value += textToType.charAt(charIndex);
          charIndex++;
        } else {
          clearInterval(typeInterval);
          // Don't hide overlay yet - wait for screenshot update
        }
      }, 50);
    } 
    else if (newAction === 'scroll' && props.actionData.direction) {
      scrollDirection.value = props.actionData.direction;
      showActionOverlay.value = true;
    }
    else if (newAction === 'navigate' && props.actionData.url) {
      navigateUrl.value = props.actionData.url;
      showActionOverlay.value = true;
    }
    else if (newAction === 'click') {
      showActionOverlay.value = true;
    }
    
    // Schedule to hide the action overlay after delay
    // (this gets reset if a new screenshot arrives before the timeout)
    actionFeedbackTimer = setTimeout(() => {
      showActionOverlay.value = false;
    }, ACTION_FEEDBACK_DURATION);
    
    // Force a screenshot refresh immediately when an action begins
    if (props.sessionId && isActive.value) {
      refreshScreenshot();
    }
  }
});

// Methods
const refreshScreenshot = async () => {
  try {
    const screenshot = await puppeteerService.takeScreenshot(props.sessionId);
    if (screenshot) {
      currentScreenshot.value = screenshot;
      emit('screenshot', screenshot);
      lastScreenshotTime.value = Date.now();
      // Hide action overlay when we get a new screenshot
      showActionOverlay.value = false;
    }
    
    // Get current URL
    const status = await puppeteerService.getStatus(props.sessionId);
    if (status && status.url) {
      currentUrl.value = status.url;
      statusMessage.value = status.status || 'Browser active';
    }
  } catch (error) {
    console.error('Error taking screenshot:', error);
  }
};

const startScreenshotPolling = () => {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }
  
  // Adaptive polling for real-time updates
  // Poll more frequently during active actions, less frequently when idle
  screenshotInterval = setInterval(async () => {
    if (props.sessionId && isActive.value) {
      // Determine polling frequency based on activity
      const now = Date.now();
      const timeElapsed = now - lastScreenshotTime.value;
      
      // More frequent updates during actions (every 300ms)
      // Less frequent when idle (every 1500ms)
      const shouldUpdate = 
        (props.currentAction && timeElapsed > 300) || 
        (!props.currentAction && timeElapsed > 1500);
      
      if (shouldUpdate) {
        await refreshScreenshot();
      }
    }
  }, 200); // Check frequently, but only take screenshots based on conditions
};

const stopScreenshotPolling = () => {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
};

const refresh = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Refreshing browser...';
    
    if (props.sessionId) {
      await puppeteerService.refreshBrowser(props.sessionId);
      const screenshot = await puppeteerService.takeScreenshot(props.sessionId);
      if (screenshot) {
        currentScreenshot.value = screenshot;
        emit('screenshot', screenshot);
      }
      
      const status = await puppeteerService.getStatus(props.sessionId);
      if (status) {
        currentUrl.value = status.url || 'about:blank';
        isActive.value = status.active || false;
        statusMessage.value = status.status || 'Browser refreshed';
        emit('browser-status', { active: isActive.value });
      }
    }
  } catch (error) {
    console.error('Error refreshing browser:', error);
    hasError.value = true;
    errorMessage.value = 'Failed to refresh browser: ' + error.message;
  } finally {
    isLoading.value = false;
  }
};

const retryConnection = async () => {
  hasError.value = false;
  isLoading.value = true;
  loadingMessage.value = 'Reconnecting to browser...';
  
  try {
    if (props.sessionId) {
      console.log("🔄 Attempting to reconnect to browser session:", props.sessionId);
      
      // Try to ping the session
      const status = await puppeteerService.getStatus(props.sessionId);
      
      if (status && status.active) {
        console.log("✅ Session is active! Reconnecting...");
        isActive.value = true;
        currentUrl.value = status.url || 'about:blank';
        statusMessage.value = status.status || 'Browser reconnected';
        
        // Get a fresh screenshot
        const screenshot = await puppeteerService.takeScreenshot(props.sessionId);
        if (screenshot) {
          currentScreenshot.value = screenshot;
          emit('screenshot', screenshot);
        }
        
        emit('browser-status', { active: true });
        startScreenshotPolling();
      } else {
        console.log("❌ Session inactive. Restarting...");
        // Try to create a new session
        await puppeteerService.restartSession(props.sessionId);
        isActive.value = true;
        currentUrl.value = 'about:blank';
        statusMessage.value = 'New browser session started';
        emit('browser-status', { active: true });
        startScreenshotPolling();
      }
    } else {
      throw new Error('No session ID provided');
    }
  } catch (error) {
    console.error('Error reconnecting to browser:', error);
    hasError.value = true;
    errorMessage.value = 'Failed to reconnect: ' + error.message;
    isActive.value = false;
    emit('browser-status', { active: false });
  } finally {
    isLoading.value = false;
  }
};

// Initialize the browser view
const initializeBrowser = async () => {
  isLoading.value = true;
  loadingMessage.value = 'Initializing browser...';
  hasError.value = false;
  
  try {
    if (!props.sessionId) {
      throw new Error('No session ID provided');
    }
    
    console.log("🚀 Initializing browser with session ID:", props.sessionId);
    
    // Check if the session exists
    const status = await puppeteerService.getStatus(props.sessionId);
    
    if (status && status.active) {
      console.log("✅ Existing session found and active!");
      isActive.value = true;
      currentUrl.value = status.url || 'about:blank';
      statusMessage.value = status.status || 'Browser active';
      
      // Get initial screenshot
      const screenshot = await puppeteerService.takeScreenshot(props.sessionId);
      if (screenshot) {
        currentScreenshot.value = screenshot;
        lastScreenshotTime.value = Date.now();
        emit('screenshot', screenshot);
      }
      
      emit('browser-status', { active: true });
      startScreenshotPolling();
    } else {
      console.log("🆕 No active session, initializing new one...");
      // Initialize the browser
      await puppeteerService.initializeBrowser(props.sessionId);
      isActive.value = true;
      currentUrl.value = 'about:blank';
      statusMessage.value = 'Browser initialized';
      emit('browser-status', { active: true });
      startScreenshotPolling();
    }
  } catch (error) {
    console.error('Error initializing browser:', error);
    hasError.value = true;
    errorMessage.value = 'Failed to initialize browser: ' + error.message;
    isActive.value = false;
    emit('browser-status', { active: false });
  } finally {
    isLoading.value = false;
  }
};

// Watch for session ID changes
watch(() => props.sessionId, (newSessionId, oldSessionId) => {
  console.log("🔄 Session ID changed:", oldSessionId, "->", newSessionId);
  if (newSessionId && newSessionId !== oldSessionId) {
    initializeBrowser();
  } else if (!newSessionId) {
    stopScreenshotPolling();
    isActive.value = false;
    emit('browser-status', { active: false });
  }
});

// Lifecycle hooks
onMounted(() => {
  console.log("🔌 BrowserView component mounted with sessionId:", props.sessionId);
  if (props.sessionId) {
    initializeBrowser();
  }
});

onUnmounted(() => {
  console.log("🚫 BrowserView component unmounting, stopping polling");
  stopScreenshotPolling();
  if (actionFeedbackTimer) {
    clearTimeout(actionFeedbackTimer);
  }
});

// Expose methods to parent
defineExpose({
  refresh,
  retryConnection
});
</script>

<style scoped>
.browser-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #0f172a;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.browser-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(15, 23, 42, 0.9);
  z-index: 10;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #334155;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  font-size: 1rem;
  color: #94a3b8;
}

.browser-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(15, 23, 42, 0.95);
  z-index: 10;
  padding: 2rem;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-message h3 {
  font-size: 1.5rem;
  color: #f87171;
  margin-bottom: 0.5rem;
}

.error-message p {
  color: #94a3b8;
  margin-bottom: 1.5rem;
}

.retry-button {
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
  transition: background-color 0.2s;
  margin: 0 auto;
}

.retry-button:hover {
  background-color: #2563eb;
}

.browser-display {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.browser-address-bar {
  background-color: #1e293b;
  border-bottom: 1px solid #334155;
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.browser-controls {
  display: flex;
  gap: 0.25rem;
}

.browser-control {
  width: 2rem;
  height: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  color: #94a3b8;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.browser-control:hover:not(:disabled) {
  background-color: #334155;
  color: white;
}

.browser-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.browser-url {
  flex: 1;
  background-color: #334155;
  color: #94a3b8;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  overflow: hidden;
}

.browser-url i {
  flex-shrink: 0;
}

.url-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.browser-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: white;
}

.browser-screenshot {
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: fadeIn 0.2s ease;
  transition: transform 0.3s ease;
}

/* Action-specific screenshot effects */
.browser-screenshot.action-typing {
  filter: brightness(1.05);
}

.browser-screenshot.action-clicking {
  transform: scale(0.995);
  transition: transform 0.15s ease;
}

.browser-screenshot.action-scrolling {
  animation: subtle-scroll 0.5s ease;
}

/* Visual feedback for actions */
.action-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  z-index: 5;
}

.typing-indicator, .click-indicator, .scroll-indicator, .navigate-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  color: white;
}

.typing-animation {
  font-family: monospace;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  display: flex;
}

.typing-cursor {
  animation: cursor-blink 1s step-end infinite;
}

.click-animation {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(59, 130, 246, 0.6);
  animation: click-pulse 0.6s ease-out;
  margin-bottom: 0.5rem;
}

.scroll-animation {
  width: 30px;
  height: 50px;
  margin-bottom: 0.5rem;
  position: relative;
}

.scroll-animation.down::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  height: 100%;
  width: 4px;
  background-color: #3b82f6;
  transform: translateX(-50%);
}

.scroll-animation.down::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 20px;
  height: 20px;
  border-right: 4px solid #3b82f6;
  border-bottom: 4px solid #3b82f6;
  transform: translateX(-50%) rotate(45deg);
  animation: scroll-down 1s infinite;
}

.scroll-animation.up::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  height: 100%;
  width: 4px;
  background-color: #3b82f6;
  transform: translateX(-50%);
}

.scroll-animation.up::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 20px;
  height: 20px;
  border-left: 4px solid #3b82f6;
  border-top: 4px solid #3b82f6;
  transform: translateX(-50%) rotate(45deg);
  animation: scroll-up 1s infinite;
}

.navigate-animation {
  width: 50px;
  height: 20px;
  margin-bottom: 0.5rem;
  position: relative;
  overflow: hidden;
}

.navigate-animation::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  height: 2px;
  width: 100%;
  background-color: #3b82f6;
  transform: translateY(-50%);
}

.navigate-animation::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 10px;
  height: 10px;
  border-top: 2px solid #3b82f6;
  border-right: 2px solid #3b82f6;
  transform: translateY(-50%) rotate(45deg);
  animation: navigate-arrow 1.5s infinite;
}

.action-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #94a3b8;
}

.no-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  color: #94a3b8;
  background-color: #0f172a;
}

.no-content i {
  font-size: 3rem;
}

.browser-status-bar {
  background-color: #1e293b;
  border-top: 1px solid #334155;
  padding: 0.5rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #94a3b8;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: #94a3b8;
}

.status-indicator.active .status-dot {
  background-color: #10b981;
  animation: pulse 2s infinite;
}

.status-action {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #3b82f6;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes click-pulse {
  0% { transform: scale(0.2); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes scroll-down {
  0% { opacity: 0; transform: translateX(-50%) translateY(-20px) rotate(45deg); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translateX(-50%) translateY(0) rotate(45deg); }
}

@keyframes scroll-up {
  0% { opacity: 0; transform: translateX(-50%) translateY(20px) rotate(45deg); }
  50% { opacity: 1; }
  100% { opacity: 0; transform: translateX(-50%) translateY(0) rotate(45deg); }
}

@keyframes navigate-arrow {
  0% { opacity: 0; right: 100%; }
  50% { opacity: 1; right: 50%; }
  100% { opacity: 0; right: 0; }
}

@keyframes subtle-scroll {
  0% { transform: translateY(0); }
  50% { transform: translateY(5px); }
  100% { transform: translateY(0); }
}
</style>