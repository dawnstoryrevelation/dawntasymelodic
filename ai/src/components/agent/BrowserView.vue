<!-- src/components/agent/BrowserView.vue -->
<template>
  <div class="browser-view">
    <!-- Browser Loading Indicator with Progress Animation -->
    <div v-if="isLoading" class="browser-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingMessage }}</div>
      <div class="loading-progress-bar">
        <div class="progress-inner" :style="{ width: loadingProgress + '%' }"></div>
      </div>
    </div>
    
    <!-- Browser Error Display with Enhanced Visuals -->
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
    
    <!-- Enhanced Browser Display with Live Cursor -->
    <div v-if="!isLoading && !hasError" class="browser-display">
      <!-- Browser Address Bar with Enhanced URL Preview -->
      <div class="browser-address-bar">
        <div class="browser-controls">
          <button class="browser-control" :disabled="true">
            <i class="ri-arrow-left-line"></i>
          </button>
          <button class="browser-control" :disabled="true">
            <i class="ri-arrow-right-line"></i>
          </button>
          <button class="browser-control" @click="refresh" title="Refresh page">
            <i class="ri-refresh-line"></i>
          </button>
        </div>
        <div class="browser-url" :class="{ 'secure': currentUrl.startsWith('https://') }">
          <i class="ri-lock-line" v-if="currentUrl.startsWith('https://')"></i>
          <i class="ri-information-line" v-else></i>
          <span class="url-text">{{ formatUrl(currentUrl) }}</span>
        </div>
      </div>
      
      <!-- Browser Content with Enhanced Real-Time Visualization -->
      <div class="browser-content" ref="browserContent">
        <!-- Live Cursor for Real-Time Mouse Movement -->
        <div 
          v-if="showCursor" 
          class="browser-cursor" 
          :style="{ 
            left: cursorPosition.x + 'px', 
            top: cursorPosition.y + 'px',
            opacity: isClicking ? 0.7 : 1
          }"
          :class="{ 'clicking': isClicking }"
        ></div>
        
        <!-- Live Typing Indicator -->
        <div 
          v-if="isTyping" 
          class="typing-indicator"
          :style="{ 
            left: typingPosition.x + 'px', 
            top: typingPosition.y + 'px'
          }"
        >
          <div class="typing-cursor"></div>
          <div class="typing-text">{{ currentTypedText }}</div>
        </div>
        
        <!-- Show screenshot with optimized loading -->
        <transition name="fade">
          <img 
            v-if="currentScreenshot" 
            :src="currentScreenshot" 
            alt="Browser screenshot" 
            class="browser-screenshot" 
            @load="handleScreenshotLoaded"
            :key="screenshotKey"
          />
        </transition>
        
        <!-- Show placeholder if no screenshot -->
        <div v-if="!currentScreenshot" class="no-content">
          <i class="ri-computer-line"></i>
          <p>Waiting for browser activity...</p>
        </div>
      </div>
      
      <!-- Enhanced Browser Status Bar with Activity Details -->
      <div class="browser-status-bar">
        <div class="status-indicator" :class="{ 'active': isActive }">
          <span class="status-dot" :class="{ 'typing': isTyping, 'clicking': isClicking }"></span>
          <span class="status-text">
            <span v-if="isTyping">Typing...</span>
            <span v-else-if="isClicking">Clicking...</span>
            <span v-else-if="isScrolling">Scrolling...</span>
            <span v-else-if="isActive">Active</span>
            <span v-else>Idle</span>
          </span>
        </div>
        <div class="status-info">{{ statusMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineProps, defineEmits, nextTick } from 'vue';
import { usePuppeteerService } from '@/services/puppeteerService';

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['screenshot', 'browser-status', 'typing-status']);

// State variables with enhanced tracking for real-time visualization
const isLoading = ref(true);
const loadingMessage = ref('Connecting to browser...');
const loadingProgress = ref(0);
const hasError = ref(false);
const errorMessage = ref('');
const currentUrl = ref('about:blank');
const currentScreenshot = ref(null);
const screenshotKey = ref(0); // For forced refreshing of screenshot
const isActive = ref(false);
const statusMessage = ref('Browser ready');

// Enhanced visual feedback states
const isTyping = ref(false);
const isClicking = ref(false);
const isScrolling = ref(false);
const currentTypedText = ref('');
const typingPosition = ref({ x: 50, y: 100 });
const showCursor = ref(false);
const cursorPosition = ref({ x: 100, y: 100 });
const browserContent = ref(null);
const lastActionTime = ref(Date.now());

// UI optimization trackers
const isTakingScreenshot = ref(false);
const screenshotRetryCount = ref(0);

// Services
const puppeteerService = usePuppeteerService();

// Polling intervals for real-time feedback
let screenshotInterval = null;
let statusInterval = null;
let typingStatusInterval = null;
let cursorAnimationInterval = null;

// Methods
// Format URL to show in a readable way
const formatUrl = (url) => {
  if (!url || url === 'about:blank') return 'about:blank';
  
  try {
    // Remove protocol
    let formatted = url;
    formatted = formatted.replace(/^https?:\/\//, '');
    
    // Truncate if too long
    if (formatted.length > 40) {
      formatted = formatted.substring(0, 37) + '...';
    }
    
    return formatted;
  } catch (e) {
    return url;
  }
};

// Handler for screenshot loaded event
const handleScreenshotLoaded = () => {
  isTakingScreenshot.value = false;
  screenshotRetryCount.value = 0;
};

// Animate cursor for more human-like movement
const animateCursor = () => {
  showCursor.value = true;
  
  // Clear existing interval
  if (cursorAnimationInterval) {
    clearInterval(cursorAnimationInterval);
  }
  
  // Random cursor movement for realistic effect
  cursorAnimationInterval = setInterval(() => {
    if (!browserContent.value) return;
    
    const contentRect = browserContent.value.getBoundingClientRect();
    const maxX = contentRect.width - 20;
    const maxY = contentRect.height - 20;
    
    // If it's been 5+ seconds since last action, do random movement
    if (Date.now() - lastActionTime.value > 5000) {
      // Move cursor randomly every ~2 seconds
      if (Math.random() > 0.9) {
        // Target a random position
        const targetX = 20 + Math.random() * (maxX - 40);
        const targetY = 20 + Math.random() * (maxY - 40);
        
        // Animate towards it
        const steps = 20 + Math.floor(Math.random() * 10);
        const currentX = cursorPosition.value.x;
        const currentY = cursorPosition.value.y;
        
        let step = 0;
        const moveInterval = setInterval(() => {
          step++;
          
          // Ease-out animation
          const progress = 1 - Math.pow(1 - step / steps, 3);
          
          cursorPosition.value = {
            x: currentX + (targetX - currentX) * progress,
            y: currentY + (targetY - currentY) * progress
          };
          
          if (step >= steps) {
            clearInterval(moveInterval);
          }
        }, 16); // ~60fps
      }
    }
  }, 100);
};

// ULTRA-OPTIMIZED screenshot polling for real-time updates - NO MORE FLASHING! 🔥
const startScreenshotPolling = () => {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }
  
  // Track previous screenshot data for comparison
  let lastScreenshotUrl = '';
  let lastScreenshotHash = '';
  let lastScreenshotTime = 0;
  let consecutiveDuplicates = 0;
  const minScreenshotInterval = 400; // Increased to 400ms minimum to reduce flashing
  const maxDuplicateCount = 2; // Only allow 2 consecutive duplicates before skipping
  
  // Screenshot polling with ANTI-FLASHING protection
  screenshotInterval = setInterval(async () => {
    if (props.sessionId && isActive.value) {
      // Skip if already taking a screenshot or if it's too soon
      if (isTakingScreenshot.value || Date.now() - lastScreenshotTime < minScreenshotInterval) {
        return;
      }
      
      // Only take screenshots when something interesting is happening
      const isInterestingActivity = isTyping.value || isClicking.value || isScrolling.value || 
                                   (Date.now() - lastActionTime.value < 5000);
      
      // Skip if we've seen too many duplicates and nothing interesting is happening
      if (consecutiveDuplicates >= maxDuplicateCount && !isInterestingActivity) {
        return;
      }
      
      try {
        isTakingScreenshot.value = true;
        
        // Force screenshot during active operations, otherwise allow caching
        const forceParam = isInterestingActivity ? '?force=true' : '';
        let screenshot = await puppeteerService.takeScreenshot(props.sessionId, forceParam);
        
        if (screenshot) {
          // Check if this is a duplicate screenshot
          if (screenshot === lastScreenshotUrl) {
            consecutiveDuplicates++;
            
            // Don't update UI for duplicates - prevents flashing
            isTakingScreenshot.value = false;
            
            // Only log occasionally to reduce console spam
            if (consecutiveDuplicates % 5 === 0) {
              console.log(`Skipping duplicate screenshot #${consecutiveDuplicates}`);
            }
            return;
          }
          
          // New screenshot - update UI
          consecutiveDuplicates = 0;
          lastScreenshotUrl = screenshot;
          lastScreenshotTime = Date.now();
          
          // Use smooth transitions instead of jarring changes
          const oldScreenshot = currentScreenshot.value;
          currentScreenshot.value = screenshot;
          
          // Increment key only for significant changes to reduce DOM updates
          screenshotKey.value++; 
          
          emit('screenshot', screenshot);
        }
        
        isTakingScreenshot.value = false;
      } catch (error) {
        console.error('Error polling for screenshot:', error);
        isTakingScreenshot.value = false;
        
        // Enhanced retry logic
        screenshotRetryCount.value++;
        if (screenshotRetryCount.value > 3) {
          // Exponential backoff for screenshot polling
          const backoffTime = Math.min(2000, 500 * Math.pow(1.5, screenshotRetryCount.value - 3));
          console.log(`Screenshot polling backing off for ${backoffTime}ms`);
          
          clearInterval(screenshotInterval);
          setTimeout(() => {
            screenshotInterval = setInterval(startScreenshotPolling, 1000);
            screenshotRetryCount.value = 0;
          }, backoffTime);
        }
      }
    }
  }, 600); // Increased to 600ms to reduce flashing
  
  // Status polling with optimized frequency
  if (statusInterval) {
    clearInterval(statusInterval);
  }
  
  statusInterval = setInterval(async () => {
    if (props.sessionId && isActive.value) {
      try {
        const status = await puppeteerService.getStatus(props.sessionId);
        if (status) {
          // Only update URL if it actually changed
          if (status.url && status.url !== currentUrl.value) {
            currentUrl.value = status.url;
          }
          
          // Only update status message if meaningful
          if (status.status && status.status !== statusMessage.value) {
            statusMessage.value = status.status;
          }
          
          isActive.value = status.active || false;
          
          // Report status back to parent - only on changes
          emit('browser-status', { 
            active: isActive.value, 
            url: currentUrl.value,
            status: status.status
          });
        }
      } catch (error) {
        // Less verbose error logging
        if (!error.message.includes('status code 404')) {
          console.error('Error polling browser status:', error);
        }
      }
    }
  }, 1500); // Reduced frequency to 1.5 seconds
  
  // Typing status polling with error handling
  if (typingStatusInterval) {
    clearInterval(typingStatusInterval);
  }
  
  typingStatusInterval = setInterval(async () => {
    if (props.sessionId && isActive.value) {
      try {
        const typingStatus = await puppeteerService.getTypingStatus(props.sessionId);
        
        // Only process if valid data received
        if (typingStatus && typeof typingStatus.isTyping !== 'undefined') {
          // Update typing status
          isTyping.value = typingStatus.isTyping;
          
          if (isTyping.value) {
            // Update the typing text display
            currentTypedText.value = typingStatus.text || '';
            
            // When typing starts, set cursor nearby
            if (!typingPosition.value.set) {
              const contentRect = browserContent.value?.getBoundingClientRect();
              if (contentRect) {
                // Position typing indicator in upper half of screen
                typingPosition.value = {
                  x: 40 + Math.random() * 200,
                  y: 100 + Math.random() * 100,
                  set: true
                };
                
                // Position cursor nearby typing position
                cursorPosition.value = {
                  x: typingPosition.value.x - 10,
                  y: typingPosition.value.y - 10
                };
              }
            }
            
            // Update last action time
            lastActionTime.value = Date.now();
            
            // Emit typing status to parent
            emit('typing-status', typingStatus);
          } else if (currentTypedText.value) {
            // Reset after typing stops
            setTimeout(() => {
              currentTypedText.value = '';
              typingPosition.value = { x: 50, y: 100, set: false };
            }, 2000);
          }
        }
      } catch (error) {
        // Silent fail for 404 errors during development
        if (!error.message.includes('status code 404')) {
          console.error('Error polling typing status:', error);
        }
      }
    }
  }, 500); // Reduced typing poll frequency
};

const stopAllPolling = () => {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
  
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
  
  if (typingStatusInterval) {
    clearInterval(typingStatusInterval);
    typingStatusInterval = null;
  }
  
  if (cursorAnimationInterval) {
    clearInterval(cursorAnimationInterval);
    cursorAnimationInterval = null;
  }
};

const refresh = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Refreshing browser...';
    loadingProgress.value = 0;
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      loadingProgress.value += Math.random() * 5;
      if (loadingProgress.value > 90) {
        loadingProgress.value = 90;
        clearInterval(progressInterval);
      }
    }, 100);
    
    if (props.sessionId) {
      await puppeteerService.refreshBrowser(props.sessionId);
      
      loadingProgress.value = 95;
      
      const screenshot = await puppeteerService.takeScreenshot(props.sessionId);
      if (screenshot) {
        currentScreenshot.value = screenshot;
        screenshotKey.value++;
        emit('screenshot', screenshot);
      }
      
      loadingProgress.value = 100;
      
      const status = await puppeteerService.getStatus(props.sessionId);
      if (status) {
        currentUrl.value = status.url || 'about:blank';
        isActive.value = status.active || false;
        statusMessage.value = status.status || 'Browser refreshed';
        emit('browser-status', { active: isActive.value });
      }
      
      // Reset visual states
      isTyping.value = false;
      isClicking.value = false;
      isScrolling.value = false;
      currentTypedText.value = '';
      
      clearInterval(progressInterval);
    }
  } catch (error) {
    console.error('Error refreshing browser:', error);
    hasError.value = true;
    errorMessage.value = 'Failed to refresh browser: ' + error.message;
  } finally {
    isLoading.value = false;
    loadingProgress.value = 100;
  }
};

const retryConnection = async () => {
  hasError.value = false;
  isLoading.value = true;
  loadingMessage.value = 'Reconnecting to browser...';
  loadingProgress.value = 0;
  
  // Simulate loading progress
  const progressInterval = setInterval(() => {
    loadingProgress.value += Math.random() * 2;
    if (loadingProgress.value > 90) {
      loadingProgress.value = 90;
      clearInterval(progressInterval);
    }
  }, 100);
  
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
        
        loadingProgress.value = 95;
        
        // Get a fresh screenshot
        const screenshot = await puppeteerService.takeScreenshot(props.sessionId);
        if (screenshot) {
          currentScreenshot.value = screenshot;
          screenshotKey.value++;
          emit('screenshot', screenshot);
        }
        
        loadingProgress.value = 100;
        
        emit('browser-status', { active: true });
        startScreenshotPolling();
        animateCursor();
      } else {
        console.log("❌ Session inactive. Restarting...");
        loadingProgress.value = 60;
        
        // Try to create a new session
        await puppeteerService.restartSession(props.sessionId);
        isActive.value = true;
        currentUrl.value = 'about:blank';
        statusMessage.value = 'New browser session started';
        
        loadingProgress.value = 95;
        
        // Get initial screenshot
        const screenshot = await puppeteerService.takeScreenshot(props.sessionId);
        if (screenshot) {
          currentScreenshot.value = screenshot;
          screenshotKey.value++;
          emit('screenshot', screenshot);
        }
        
        loadingProgress.value = 100;
        
        emit('browser-status', { active: true });
        startScreenshotPolling();
        animateCursor();
      }
      
      clearInterval(progressInterval);
    } else {
      throw new Error('No session ID provided');
    }
  } catch (error) {
    console.error('Error reconnecting to browser:', error);
    hasError.value = true;
    errorMessage.value = 'Failed to reconnect: ' + error.message;
    isActive.value = false;
    emit('browser-status', { active: false });
    clearInterval(progressInterval);
  } finally {
    isLoading.value = false;
    loadingProgress.value = 100;
  }
};

// Simulate mouse click at current cursor position
const simulateClick = async (duration = 500) => {
  isClicking.value = true;
  lastActionTime.value = Date.now();
  
  // After the duration, end the click effect
  setTimeout(() => {
    isClicking.value = false;
  }, duration);
};

// Simulate scrolling effect
const simulateScroll = async (duration = 1000) => {
  isScrolling.value = true;
  lastActionTime.value = Date.now();
  
  // After the duration, end the scroll effect
  setTimeout(() => {
    isScrolling.value = false;
  }, duration);
};

// Initialize the browser view with enhanced loading sequence
const initializeBrowser = async () => {
  isLoading.value = true;
  loadingMessage.value = 'Initializing browser...';
  loadingProgress.value = 0;
  hasError.value = false;
  
  // Simulate loading progress
  const progressInterval = setInterval(() => {
    loadingProgress.value += Math.random() * 3;
    if (loadingProgress.value > 90) {
      loadingProgress.value = 90;
      clearInterval(progressInterval);
    }
  }, 100);
  
  try {
    if (!props.sessionId) {
      throw new Error('No session ID provided');
    }
    
    console.log("🚀 Initializing browser with session ID:", props.sessionId);
    loadingProgress.value = 30;
    
    // Check if the session exists
    const status = await puppeteerService.getStatus(props.sessionId);
    loadingProgress.value = 60;
    
    if (status && status.active) {
      console.log("✅ Existing session found and active!");
      isActive.value = true;
      currentUrl.value = status.url || 'about:blank';
      statusMessage.value = status.status || 'Browser active';
      
      loadingProgress.value = 80;
      
      // Get initial screenshot
      const screenshot = await puppeteerService.takeScreenshot(props.sessionId);
      if (screenshot) {
        currentScreenshot.value = screenshot;
        screenshotKey.value++;
        emit('screenshot', screenshot);
      }
      
      loadingProgress.value = 100;
      clearInterval(progressInterval);
      
      emit('browser-status', { active: true });
      startScreenshotPolling();
      animateCursor();
    } else {
      console.log("🆕 No active session, initializing new one...");
      loadingProgress.value = 60;
      
      // Initialize the browser
      await puppeteerService.initializeBrowser(props.sessionId);
      isActive.value = true;
      currentUrl.value = 'about:blank';
      statusMessage.value = 'Browser initialized';
      
      loadingProgress.value = 90;
      
      // Get initial screenshot
      const screenshot = await puppeteerService.takeScreenshot(props.sessionId);
      if (screenshot) {
        currentScreenshot.value = screenshot;
        screenshotKey.value++;
        emit('screenshot', screenshot);
      }
      
      loadingProgress.value = 100;
      clearInterval(progressInterval);
      
      emit('browser-status', { active: true });
      startScreenshotPolling();
      animateCursor();
    }
  } catch (error) {
    console.error('Error initializing browser:', error);
    hasError.value = true;
    errorMessage.value = 'Failed to initialize browser: ' + error.message;
    isActive.value = false;
    emit('browser-status', { active: false });
    clearInterval(progressInterval);
  } finally {
    isLoading.value = false;
    loadingProgress.value = 100;
  }
};

// Watch for session ID changes
watch(() => props.sessionId, (newSessionId, oldSessionId) => {
  console.log("🔄 Session ID changed:", oldSessionId, "->", newSessionId);
  if (newSessionId && newSessionId !== oldSessionId) {
    initializeBrowser();
  } else if (!newSessionId) {
    stopAllPolling();
    isActive.value = false;
    emit('browser-status', { active: false });
  }
});

// Lifecycle hooks
onMounted(() => {
  console.log("🔌 BrowserView component mounted with sessionId:", props.sessionId);
  if (props.sessionId) {
    nextTick(() => {
      initializeBrowser();
    });
  }
});

onUnmounted(() => {
  console.log("🚫 BrowserView component unmounting, stopping polling");
  stopAllPolling();
});

// Expose methods to parent
defineExpose({
  refresh,
  retryConnection,
  simulateClick,
  simulateScroll
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
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Loading UI with progress bar */
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
  backdrop-filter: blur(4px);
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
  margin-bottom: 1rem;
}

.loading-progress-bar {
  width: 80%;
  max-width: 300px;
  height: 4px;
  background-color: #334155;
  border-radius: 4px;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background-color: #3b82f6;
  width: 0%;
  border-radius: 4px;
  transition: width 0.2s ease-out;
}

/* Error display */
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
  backdrop-filter: blur(4px);
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

/* Main Browser Display */
.browser-display {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

/* Address Bar Enhanced */
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

.browser-url.secure {
  color: #10b981;
}

.browser-url.secure i {
  color: #10b981;
}

.browser-url i {
  flex-shrink: 0;
}

.url-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Browser Content with Enhanced Visualization */
.browser-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: white;
}

/* Real-time cursor */
.browser-cursor {
  position: absolute;
  width: 20px;
  height: 20px;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path></svg>');
  background-repeat: no-repeat;
  background-size: contain;
  pointer-events: none;
  z-index: 100;
  transition: transform 0.1s ease;
  transform: scale(1);
}

.browser-cursor.clicking {
  transform: scale(0.9);
}

/* Typing visualization */
.typing-indicator {
  position: absolute;
  z-index: 99;
  pointer-events: none;
  display: flex;
  align-items: center;
  max-width: 80%;
}

.typing-cursor {
  width: 2px;
  height: 16px;
  background-color: #3b82f6;
  animation: blink 1s step-end infinite;
  margin-right: 2px;
}

.typing-text {
  background: rgba(59, 130, 246, 0.1);
  color: #000;
  padding: 2px 4px;
  border-radius: 2px;
  font-family: monospace;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;
}

/* Screenshot with optimized loading */
.browser-screenshot {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* CRITICAL FIX: Add will-change for smoother updates */
  will-change: transform;
  /* ANTI-FLASHING: Smoother transitions between screenshots */
  transition: opacity 0.15s ease;
  /* GPU acceleration for better performance */
  transform: translateZ(0);
}

/* Improved fade transitions to reduce flashing */
.fade-enter-active {
  transition: opacity 0.2s ease-in;
}
.fade-leave-active {
  transition: opacity 0.1s ease-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
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
  background-color: #f8fafc;
}

.no-content i {
  font-size: 3rem;
  color: #64748b;
}

.no-content p {
  color: #64748b;
}

/* Enhanced Status Bar */
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

.status-dot.typing {
  background-color: #3b82f6;
  animation: pulse 0.8s infinite;
}

.status-dot.clicking {
  background-color: #f59e0b;
  animation: quick-pulse 0.4s infinite;
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
}

@keyframes quick-pulse {
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>