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
            opacity: isClicking ? 0.7 : 1,
            transform: isClicking ? 'scale(0.9)' : 'scale(1)'
          }"
          :class="{ 'clicking': isClicking }"
        ></div>
        
        <!-- Live Typing Indicator with Character-by-Character Display -->
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
        
        <!-- Enhanced Scroll Indicator -->
        <div 
          v-if="isScrolling" 
          class="scroll-indicator"
          :class="{ 'scroll-down': scrollDirection === 'down', 'scroll-up': scrollDirection === 'up' }"
        >
          <div class="scroll-arrow"></div>
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
        
        <!-- Click Effect Animation -->
        <div 
          v-if="showClickEffect" 
          class="click-effect"
          :style="{ 
            left: clickEffectPosition.x + 'px', 
            top: clickEffectPosition.y + 'px'
          }"
        ></div>
      </div>
      
      <!-- Enhanced Browser Status Bar with Activity Details -->
      <div class="browser-status-bar">
        <div class="status-indicator" :class="{ 'active': isActive }">
          <span class="status-dot" :class="{ 'typing': isTyping, 'clicking': isClicking, 'scrolling': isScrolling }"></span>
          <span class="status-text">
            <span v-if="isTyping">Typing: {{ currentTypedText || '...' }}</span>
            <span v-else-if="isClicking">Clicking: {{ clickTarget || 'element' }}</span>
            <span v-else-if="isScrolling">Scrolling {{ scrollDirection }}</span>
            <span v-else-if="isActive">Active: {{ currentAction || 'browsing' }}</span>
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
const currentAction = ref('');
const clickTarget = ref('');
const scrollDirection = ref('down');

// Click animation states
const showClickEffect = ref(false);
const clickEffectPosition = ref({ x: 0, y: 0 });

// UI optimization trackers
const isTakingScreenshot = ref(false);
const screenshotRetryCount = ref(0);
const lastScreenshotHash = ref('');
const consecutiveIdenticalScreenshots = ref(0);

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

// Show click animation at specified position
const showClickAnimation = (x, y) => {
  clickEffectPosition.value = { x, y };
  showClickEffect.value = true;
  
  // Hide after animation completes
  setTimeout(() => {
    showClickEffect.value = false;
  }, 800); // Match the CSS animation duration
};

// Animate cursor movement to a specific position with natural easing
const animateCursorTo = (x, y, options = {}) => {
  const startX = cursorPosition.value.x;
  const startY = cursorPosition.value.y;
  const duration = options.duration || 500;
  const onClick = options.onClick || false;
  
  showCursor.value = true;
  
  // Calculate distance for realistic duration
  const distance = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
  const adjustedDuration = Math.min(1000, Math.max(300, distance / 2));
  
  // Target position with slight randomness for realism
  const targetX = x + (Math.random() * 10 - 5);
  const targetY = y + (Math.random() * 10 - 5);
  
  // Track animation time
  const startTime = performance.now();
  
  // Cancel any existing animation
  if (window.cursorAnimationFrame) {
    cancelAnimationFrame(window.cursorAnimationFrame);
  }
  
  // Animation step function
  const step = (timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / adjustedDuration, 1);
    
    // Ease-out cubic function for natural movement
    const easeOutProgress = 1 - Math.pow(1 - progress, 3);
    
    // Update cursor position
    cursorPosition.value = {
      x: startX + (targetX - startX) * easeOutProgress,
      y: startY + (targetY - startY) * easeOutProgress,
    };
    
    // Continue animation if not complete
    if (progress < 1) {
      window.cursorAnimationFrame = requestAnimationFrame(step);
    } else {
      // Animation complete
      if (onClick) {
        // Simulate click at destination
        simulateClick(targetX, targetY);
      }
    }
  };
  
  // Start animation
  window.cursorAnimationFrame = requestAnimationFrame(step);
};

// Animate cursor for more human-like movement
const startCursorAnimation = () => {
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
    
    // If it's been 3+ seconds since last action, do random movement
    if (Date.now() - lastActionTime.value > 3000) {
      // Move cursor randomly every ~2 seconds
      if (Math.random() > 0.9) {
        // Target a random position, but more likely in the upper half
        const targetX = 20 + Math.random() * (maxX - 40);
        const targetY = 20 + Math.random() * (maxY * 0.7); // Focus more on top area
        
        // Animate to the position
        animateCursorTo(targetX, targetY);
      }
    }
  }, 100);
};

// Simulate click with animation at given position
const simulateClick = (x = null, y = null) => {
  // If no position provided, use current cursor position
  const clickX = x !== null ? x : cursorPosition.value.x;
  const clickY = y !== null ? y : cursorPosition.value.y;
  
  // Show cursor at click position if not already there
  if (x !== null && y !== null) {
    cursorPosition.value = { x, y };
  }
  
  // Set clicking state
  isClicking.value = true;
  lastActionTime.value = Date.now();
  
  // Show click effect
  showClickAnimation(clickX, clickY);
  
  // After the duration, end the click effect
  setTimeout(() => {
    isClicking.value = false;
  }, 300);
};

// Simulate scrolling effect with direction and amount
const simulateScroll = async (direction = 'down', amount = 400, duration = 1000) => {
  scrollDirection.value = direction;
  isScrolling.value = true;
  lastActionTime.value = Date.now();
  
  // Show appropriate scroll indicator based on direction
  const contentRect = browserContent.value?.getBoundingClientRect();
  if (contentRect) {
    // Position cursor on right side of screen for scrolling
    const scrollX = contentRect.width * 0.9;
    const scrollY = contentRect.height * 0.5;
    
    // Move cursor to scroll position first
    animateCursorTo(scrollX, scrollY);
  }
  
  // After the duration, end the scroll effect
  setTimeout(() => {
    isScrolling.value = false;
  }, duration);
};

// ULTRA-OPTIMIZED screenshot polling for real-time updates - NO MORE FLASHING! 🔥
const startScreenshotPolling = () => {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
  }
  
  // Screenshot polling with ANTI-FLASHING protection and content-based change detection
  screenshotInterval = setInterval(async () => {
    if (props.sessionId && isActive.value) {
      // Skip if already taking a screenshot or during certain actions
      if (isTakingScreenshot.value) {
        return;
      }
      
      // Only take screenshots when something interesting is happening or periodically
      const isInterestingActivity = isTyping.value || isClicking.value || isScrolling.value || 
                                   (Date.now() - lastActionTime.value < 3000);
      
      // Skip consecutive identical screenshots to reduce flashing
      if (consecutiveIdenticalScreenshots.value > 2 && !isInterestingActivity) {
        return;
      }
      
      try {
        isTakingScreenshot.value = true;
        
        // Force screenshot during active operations, otherwise allow caching
        const forceParam = isInterestingActivity ? '?force=true' : '';
        let screenshot = await puppeteerService.takeScreenshot(props.sessionId, forceParam);
        
        if (screenshot) {
          // Check if this is a duplicate screenshot using URL as hash
          if (screenshot === currentScreenshot.value) {
            consecutiveIdenticalScreenshots.value++;
            
            // Don't update UI for duplicates - prevents flashing
            isTakingScreenshot.value = false;
            return;
          }
          
          // New screenshot - update UI
          consecutiveIdenticalScreenshots.value = 0;
          
          // Update the screenshot with minimal UI updates
          currentScreenshot.value = screenshot;
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
          
          clearInterval(screenshotInterval);
          setTimeout(() => {
            screenshotInterval = setInterval(startScreenshotPolling, 1000);
            screenshotRetryCount.value = 0;
          }, backoffTime);
        }
      }
    }
  }, 800); // Reduced polling to prevent flashing, compensated by better real-time UI
  
  // Status polling with optimized frequency for better real-time updates
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
          
          // Update status message if meaningful
          if (status.status) {
            statusMessage.value = status.status;
            // Extract current action from status if available
            const actionMatch = status.status.match(/^executing\s+(\w+)/i);
            if (actionMatch) {
              currentAction.value = actionMatch[1];
            }
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
        if (!error.message?.includes('status code 404')) {
          console.error('Error polling browser status:', error);
        }
      }
    }
  }, 1000); // Reduced frequency to 1 second
  
  // ENHANCED typing status polling with character-by-character updates
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
          const wasTyping = isTyping.value;
          isTyping.value = typingStatus.isTyping;
          
          if (isTyping.value) {
            // Handle transition from not typing to typing
            if (!wasTyping) {
              typingPosition.value = { set: false };
            }
            
            // Get the text being typed
            const typingText = typingStatus.text || '';
            
            // Only update if text changed to save on re-renders
            if (typingText !== currentTypedText.value) {
              // Update the typing text display with character-by-character animation
              currentTypedText.value = typingText;
              
              // When typing starts, set cursor and typing position
              if (!typingPosition.value.set) {
                const contentRect = browserContent.value?.getBoundingClientRect();
                if (contentRect) {
                  // Get typing position from status or use default
                  if (typingStatus.selector) {
                    // Try to position near a search box or top area
                    const isSearchBox = typingStatus.selector.includes('search') || 
                                        typingStatus.selector.includes('q') ||
                                        typingStatus.selector.includes('input');
                    
                    if (isSearchBox) {
                      // Position near top for search box
                      typingPosition.value = {
                        x: contentRect.width * 0.3,
                        y: 80 + Math.random() * 50,
                        set: true
                      };
                    } else {
                      // Position in upper half for other inputs
                      typingPosition.value = {
                        x: contentRect.width * 0.25 + Math.random() * 200,
                        y: 120 + Math.random() * 150,
                        set: true
                      };
                    }
                  } else {
                    // Default fallback position
                    typingPosition.value = {
                      x: 40 + Math.random() * 200,
                      y: 100 + Math.random() * 100,
                      set: true
                    };
                  }
                  
                  // Animate cursor to typing position
                  animateCursorTo(typingPosition.value.x - 10, typingPosition.value.y - 5);
                }
              }
              
              // Keep cursor near the end of typing text
              const textWidth = Math.min(300, typingText.length * 8); // Estimate text width
              cursorPosition.value = {
                x: typingPosition.value.x + textWidth,
                y: typingPosition.value.y
              };
              
              // Update last action time
              lastActionTime.value = Date.now();
            }
            
            // Emit typing status to parent
            emit('typing-status', {
              ...typingStatus,
              visualPosition: typingPosition.value
            });
          } else if (wasTyping && !isTyping.value) {
            // Typing just ended - add click animation if was typing in search
            if (currentTypedText.value && 
                (currentUrl.value.includes('google.com') || typingStatus.selector?.includes('search'))) {
              // Simulate clicking search button after typing
              setTimeout(() => {
                // Move cursor to right side of typing for "enter/search"
                const textWidth = Math.min(300, currentTypedText.value.length * 8);
                const searchX = typingPosition.value.x + textWidth + 50; // To the right of typing
                const searchY = typingPosition.value.y;
                
                // Animate cursor to search button and click
                animateCursorTo(searchX, searchY, { onClick: true });
                
                // Set click target for status display
                clickTarget.value = 'Search';
              }, 500);
            }
            
            // Reset typing display after delay
            setTimeout(() => {
              currentTypedText.value = '';
              typingPosition.value = { x: 50, y: 100, set: false };
            }, 2000);
          }
        }
      } catch (error) {
        // Silent fail for 404 errors during development
        if (!error.message?.includes('status code 404')) {
          console.error('Error polling typing status:', error);
        }
      }
    }
  }, 200); // Faster typing poll frequency for real-time updates
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
  
  if (window.cursorAnimationFrame) {
    cancelAnimationFrame(window.cursorAnimationFrame);
    window.cursorAnimationFrame = null;
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
        startCursorAnimation();
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
        startCursorAnimation();
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
      startCursorAnimation();
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
      startCursorAnimation();
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
  
  // Add window resize event listener
  window.addEventListener('resize', handleResize);
});

// Handle window resize
const handleResize = () => {
  // Reset typing position to trigger recalculation
  if (typingPosition.value?.set) {
    typingPosition.value = { ...typingPosition.value, set: false };
  }
};

onUnmounted(() => {
  console.log("🚫 BrowserView component unmounting, stopping polling");
  stopAllPolling();
  window.removeEventListener('resize', handleResize);
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
  transition: transform 0.1s ease, opacity 0.1s ease;
  will-change: transform, opacity, left, top;
}

.browser-cursor.clicking {
  animation: clickPulse 0.3s ease;
}

/* Click Effect Animation */
.click-effect {
  position: absolute;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(59, 130, 246, 0.3);
  pointer-events: none;
  z-index: 99;
  transform: translate(-50%, -50%);
  animation: clickRipple 0.8s ease-out forwards;
}

@keyframes clickRipple {
  0% {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

@keyframes clickPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Typing visualization */
.typing-indicator {
  position: absolute;
  z-index: 99;
  pointer-events: none;
  display: flex;
  align-items: center;
  max-width: 80%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 3px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border: 1px solid #ddd;
}

.typing-cursor {
  width: 2px;
  height: 16px;
  background-color: #3b82f6;
  animation: blink 1s step-end infinite;
  margin-right: 2px;
  flex-shrink: 0;
}

.typing-text {
  color: #000;
  font-family: monospace;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;
  animation: typing 0.1s ease;
}

@keyframes typing {
  from {
    opacity: 0.7;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scroll indicator */
.scroll-indicator {
  position: absolute;
  right: 20px;
  top: 50%;
  width: 30px;
  height: 50px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99;
  pointer-events: none;
}

.scroll-arrow {
  width: 12px;
  height: 12px;
  border-style: solid;
  border-width: 0 2px 2px 0;
  border-color: rgba(0, 0, 0, 0.6);
}

.scroll-indicator.scroll-down .scroll-arrow {
  transform: rotate(45deg);
  margin-top: -5px;
  animation: scrollDown 1s infinite;
}

.scroll-indicator.scroll-up .scroll-arrow {
  transform: rotate(-135deg);
  margin-bottom: -5px;
  animation: scrollUp 1s infinite;
}

@keyframes scrollDown {
  0%, 100% {
    transform: translateY(0) rotate(45deg);
  }
  50% {
    transform: translateY(5px) rotate(45deg);
  }
}

@keyframes scrollUp {
  0%, 100% {
    transform: translateY(0) rotate(-135deg);
  }
  50% {
    transform: translateY(-5px) rotate(-135deg);
  }
}

/* Screenshot with optimized loading */
.browser-screenshot {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* CRITICAL FIX: Add will-change for smoother updates */
  will-change: transform;
  /* ANTI-FLASHING: Smoother transitions between screenshots */
  transition: opacity 0.2s ease;
  /* GPU acceleration for better performance */
  transform: translateZ(0);
}

/* Improved fade transitions to reduce flashing */
.fade-enter-active {
  transition: opacity 0.25s ease-in;
}
.fade-leave-active {
  transition: opacity 0.15s ease-out;
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

.status-dot.scrolling {
  background-color: #8b5cf6;
  animation: pulse 1s infinite;
}

.status-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 20ch;
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