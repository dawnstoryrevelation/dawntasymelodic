<!-- src/components/agent/BrowserView.vue -->
<!-- TO INSTALL: Save this file to src/components/agent/BrowserView.vue -->
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
        <img v-if="currentScreenshot" :src="currentScreenshot" alt="Browser screenshot" class="browser-screenshot" />
        
        <!-- Show placeholder if no screenshot -->
        <div v-else class="no-content">
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
        <div class="status-info">{{ statusMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineProps, defineEmits } from 'vue';
import { usePuppeteerService } from '@/services/puppeteerService';

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['screenshot', 'browser-status']);

// State variables
const isLoading = ref(true);
const loadingMessage = ref('Connecting to browser...');
const hasError = ref(false);
const errorMessage = ref('');
const currentUrl = ref('about:blank');
const currentScreenshot = ref(null);
const isActive = ref(false);
const statusMessage = ref('Browser ready');

// Services
const puppeteerService = usePuppeteerService();

// Polling interval
let screenshotInterval = null;

// Methods
const startScreenshotPolling = () => {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }
  
  // Poll every 2 seconds
  screenshotInterval = setInterval(async () => {
    if (props.sessionId && isActive.value) {
      try {
        const screenshot = await puppeteerService.takeScreenshot(props.sessionId);
        if (screenshot) {
          currentScreenshot.value = screenshot;
          emit('screenshot', screenshot);
        }
        
        // Get current URL
        const status = await puppeteerService.getStatus(props.sessionId);
        if (status && status.url) {
          currentUrl.value = status.url;
          statusMessage.value = status.status || 'Browser active';
        }
      } catch (error) {
        console.error('Error polling browser status:', error);
      }
    }
  }, 2000);
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
      // Try to ping the session
      const status = await puppeteerService.getStatus(props.sessionId);
      
      if (status && status.active) {
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
    
    // Check if the session exists
    const status = await puppeteerService.getStatus(props.sessionId);
    
    if (status && status.active) {
      isActive.value = true;
      currentUrl.value = status.url || 'about:blank';
      statusMessage.value = status.status || 'Browser active';
      
      // Get initial screenshot
      const screenshot = await puppeteerService.takeScreenshot(props.sessionId);
      if (screenshot) {
        currentScreenshot.value = screenshot;
        emit('screenshot', screenshot);
      }
      
      emit('browser-status', { active: true });
      startScreenshotPolling();
    } else {
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
  if (props.sessionId) {
    initializeBrowser();
  }
});

onUnmounted(() => {
  stopScreenshotPolling();
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
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>