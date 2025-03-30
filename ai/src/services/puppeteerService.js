// src/services/puppeteerService.js - SUPERCHARGED FOR REAL-TIME BROWSING!
import axios from 'axios';

/**
 * Service to interact with the Puppeteer backend
 * SUPERCHARGED FOR MAXIMUM RESILIENCE AND REAL-TIME VISUALIZATION!
 */
export function usePuppeteerService() {
  // 🔥 HARDCODED URL FOR GUARANTEED CONNECTION! 🔥
  const API_BASE_URL = 'http://localhost:3001/api/puppeteer';
  
  // Debug helper function - CRITICAL FOR DEBUGGING!
  const logRequest = (method, endpoint) => {
    console.log(`🔌 ${method.toUpperCase()} ${API_BASE_URL}${endpoint}`);
  };
  
  /**
   * Start a new Puppeteer browser session - ULTRA-RELIABLE!
   */
  const startSession = async () => {
    try {
      logRequest('POST', '/session');
      
      // EXTENDED TIMEOUT FOR RELIABILITY!
      const response = await axios.post(`${API_BASE_URL}/session`, {}, {
        timeout: 15000
      });
      
      console.log('🚀 Session created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error starting Puppeteer session:', error);
      
      // ATTEMPT DIRECT RETRY for maximum resilience!
      try {
        console.log('⚠️ First attempt failed - TRYING AGAIN!');
        const retryResponse = await axios.post(`${API_BASE_URL}/session`, {}, {
          timeout: 30000 // EXTENDED TIMEOUT for retry!
        });
        
        console.log('✅ Session created on retry:', retryResponse.data);
        return retryResponse.data;
      } catch (retryError) {
        throw new Error(`Failed to start browser session: ${error.message}`);
      }
    }
  };
  
  /**
   * End a Puppeteer browser session
   */
  const endSession = async (sessionId) => {
    try {
      logRequest('DELETE', `/session/${sessionId}`);
      await axios.delete(`${API_BASE_URL}/session/${sessionId}`);
      console.log('🚫 Session ended:', sessionId);
      return { success: true };
    } catch (error) {
      console.error('Error ending Puppeteer session:', error);
      // Don't throw - just log the error and continue
      return { success: false, error: error.message };
    }
  };
  
  /**
   * Initialize browser for a session - WITH ENHANCED RELIABILITY!
   */
  const initializeBrowser = async (sessionId) => {
    try {
      logRequest('POST', `/session/${sessionId}/initialize`);
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/initialize`, {}, {
        timeout: 20000 // EXTENDED TIMEOUT for initialization
      });
      console.log('🌐 Browser initialized:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error initializing browser:', error);
      
      // RETRY MECHANISM FOR MAXIMUM RESILIENCE!
      try {
        console.log('⚠️ Initialization failed - TRYING AGAIN with restart!');
        const restartResponse = await axios.post(`${API_BASE_URL}/session/${sessionId}/restart`, {}, {
          timeout: 30000
        });
        
        console.log('🔄 Browser restarted instead:', restartResponse.data);
        return restartResponse.data;
      } catch (retryError) {
        throw new Error(`Failed to initialize browser: ${error.message}`);
      }
    }
  };
  
  /**
   * Restart a browser session - ULTRA-RESILIENT!
   */
  const restartSession = async (sessionId) => {
    try {
      logRequest('POST', `/session/${sessionId}/restart`);
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/restart`, {}, {
        timeout: 20000
      });
      console.log('🔄 Session restarted:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error restarting browser session:', error);
      
      // If restart fails, try creating a new session
      try {
        console.log('⚠️ Restart failed - trying to create a new session');
        const newSessionResponse = await startSession();
        console.log('✅ Created new replacement session:', newSessionResponse);
        return { ...newSessionResponse, replaced: true };
      } catch (createError) {
        throw new Error(`Failed to restart browser session: ${error.message}`);
      }
    }
  };
  
  /**
   * Refresh the browser page - WITH ERROR RECOVERY!
   */
  const refreshBrowser = async (sessionId) => {
    try {
      logRequest('POST', `/session/${sessionId}/refresh`);
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/refresh`);
      console.log('🔄 Browser refreshed:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error refreshing browser:', error);
      
      // Don't fail completely - return a status object
      return { 
        success: false, 
        status: 'refresh_failed',
        error: error.message
      };
    }
  };
  
  /**
   * Get the status of a session - WITH RETRY AND ENHANCED INFO!
   */
  const getStatus = async (sessionId) => {
    try {
      // Don't log status requests to reduce noise
      const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/status`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Error getting browser status:', error);
      
      // Try once more with an extended timeout
      try {
        console.log('⚠️ Status check failed - retrying with extended timeout');
        const retryResponse = await axios.get(`${API_BASE_URL}/session/${sessionId}/status`, {
          timeout: 10000
        });
        return retryResponse.data;
      } catch (retryError) {
        // If still failing, return a fallback status
        return {
          active: false,
          url: 'unknown',
          status: 'error',
          lastActivity: new Date()
        };
      }
    }
  };
  
  /**
   * NEW! Get real-time typing status - ENHANCED WITH RELIABILITY FIXES! 🔥
   */
  const getTypingStatus = async (sessionId) => {
    try {
      // Add cache-busting timestamp parameter to prevent browser caching
      const cacheBuster = Date.now();
      const response = await axios.get(
        `${API_BASE_URL}/session/${sessionId}/typing-status?t=${cacheBuster}`, 
        {
          timeout: 2000, // Reduced timeout for faster fail/recovery
          // Critical - prevents browser caching
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      return response.data;
    } catch (error) {
      // Don't log 404 errors repeatedly - but track failure count
      const is404 = error.response && error.response.status === 404;
      
      // Use static counter to track consecutive failures
      getTypingStatus.failureCount = (getTypingStatus.failureCount || 0) + 1;
      
      // Only log errors occasionally to reduce console spam
      if (!is404 || getTypingStatus.failureCount % 10 === 1) {
        console.error(`Error getting typing status (failure #${getTypingStatus.failureCount}):`, 
          is404 ? 'Endpoint not found (404)' : error.message);
      }
      
      // Always return valid fallback data structure
      return {
        isTyping: false,
        text: '',
        selector: null,
        error: is404 ? 'endpoint-not-found' : 'connection-error'
      };
    }
  };
  
  /**
   * Take a screenshot of the current browser page - SUPERCHARGED FOR PERFORMANCE! 🔥
   * OPTIMIZED FOR FASTER TRANSFER RATE & CONTENT-AWARE CACHING!
   */
  const takeScreenshot = async (sessionId, forceParam = '') => {
    // Only cache the screenshot URL across calls
    takeScreenshot.cache = takeScreenshot.cache || {};
    
    // Add timestamp for cache busting
    const timestamp = Date.now();
    const urlParams = forceParam + (forceParam ? '&' : '?') + `t=${timestamp}`;
    
    // Counting attempts
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        // Avoid logging every screenshot request to reduce console noise
        const quietMode = takeScreenshot.requestCount = (takeScreenshot.requestCount || 0) + 1;
        if (quietMode % 10 === 1) {
          console.log(`📸 Taking screenshot for session ${sessionId} (request #${quietMode})`);
        }
        
        const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/screenshot${urlParams}`, {
          responseType: 'blob',
          timeout: 3000, // Shorter timeout for faster feedback
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        // Free previous object URL to prevent memory leaks
        if (takeScreenshot.cache[sessionId]) {
          URL.revokeObjectURL(takeScreenshot.cache[sessionId]);
        }
        
        // Create and cache new object URL
        const objectUrl = URL.createObjectURL(response.data);
        takeScreenshot.cache[sessionId] = objectUrl;
        
        // Reset attempt counter on success
        takeScreenshot.failedAttempts = 0;
        
        return objectUrl;
      } catch (error) {
        // Count consecutive failures across calls
        takeScreenshot.failedAttempts = (takeScreenshot.failedAttempts || 0) + 1;
        
        // Log error occasionally to reduce console noise
        if (takeScreenshot.failedAttempts % 3 === 1) {
          console.error(`Error taking screenshot (consecutive failures: ${takeScreenshot.failedAttempts}):`, 
                       error.message || error);
        }
        
        if (attempt === 2) {
          // All attempts failed - return last cached screenshot if available
          if (takeScreenshot.cache[sessionId]) {
            console.log('⚠️ Using cached screenshot due to failure');
            return takeScreenshot.cache[sessionId];
          }
          
          // If no cache, throw error
          throw new Error(`Failed to take screenshot: ${error.message}`);
        } else {
          // Wait briefly before retry
          await new Promise(r => setTimeout(r, 200));
        }
      }
    }
  };
  
  /**
   * Take a high-frequency screenshot - ULTRA-FAST, LOWER QUALITY
   * Special function for capturing typing and other rapid interactions
   */
  const takeRapidScreenshot = async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/screenshot`, {
        responseType: 'blob',
        timeout: 3000 // Shorter timeout for rapid screenshots
      });
      
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error taking rapid screenshot:', error);
      return null; // Don't throw - return null for rapid shots
    }
  };
  
  /**
   * Navigate to a URL - WITH ENHANCED ERROR HANDLING & CAPTCHA AVOIDANCE
   */
  const navigateToUrl = async (sessionId, url) => {
    try {
      logRequest('POST', `/session/${sessionId}/navigate`);
      console.log(`🌐 Navigating to: ${url}`);
      
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/navigate`, { url }, {
        timeout: 30000 // Extended timeout for navigation
      });
      
      console.log('✅ Navigation complete:', response.data);
      
      // Check if we need to handle CAPTCHA after navigation
      try {
        // Execute CAPTCHA detection and bypass action
        await executeAction(sessionId, {
          type: 'captcha',
          description: 'Attempting to detect and bypass CAPTCHA'
        });
      } catch (captchaError) {
        console.error('CAPTCHA handling error:', captchaError);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error navigating to URL:', error);
      
      // Try to refresh the browser and continue
      try {
        console.log('⚠️ Navigation failed - trying to refresh browser');
        await refreshBrowser(sessionId);
        return { 
          success: false, 
          status: 'navigation_failed_but_refreshed',
          error: error.message
        };
      } catch (refreshError) {
        throw new Error(`Failed to navigate to URL: ${error.message}`);
      }
    }
  };
  
  /**
   * Execute a browser action - SUPERCHARGED WITH ERROR HANDLING
   * Action types: click, type, scroll, wait, submit, captcha
   * OPTIMIZED FOR REAL-TIME VISUAL FEEDBACK!
   */
  const executeAction = async (sessionId, action) => {
    try {
      logRequest('POST', `/session/${sessionId}/action`);
      console.log(`🎮 Executing action: ${action.type} - ${action.description || ''}`);
      
      // ENHANCED TIMEOUT BASED ON ACTION TYPE for maximum reliability!
      let timeout = 10000; // Default timeout
      
      // Adjust timeout based on action type
      if (action.type === 'navigate') {
        timeout = 30000; // Longer timeout for navigation
      } else if (action.type === 'type') {
        timeout = 60000; // Longer timeout for typing to handle character-by-character
      } else if (action.type === 'click') {
        timeout = 20000; // Medium-long timeout for clicks (they might cause navigation)
      }
      
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/action`, action, {
        timeout
      });
      
      console.log(`✅ Action executed: ${action.type}`);
      return response.data;
    } catch (error) {
      console.error('Error executing browser action:', error);
      
      // Special handling for different action types
      if (action.type === 'click' || action.type === 'type') {
        // For interactive actions, try a simple refresh and continue
        console.log('⚠️ Interactive action failed - attempting recovery');
        try {
          await refreshBrowser(sessionId);
          return { 
            status: 'warning',
            success: false,
            message: `Action failed but browser refreshed: ${error.message}`
          };
        } catch (refreshError) {
          // Even if refresh fails, don't halt execution
          console.error('Recovery failed:', refreshError);
        }
      }
      
      // Don't throw - return a status object so execution can continue
      return { 
        status: 'error',
        success: false,
        error: error.message
      };
    }
  };
  
  return {
    startSession,
    endSession,
    initializeBrowser,
    restartSession,
    refreshBrowser,
    getStatus,
    getTypingStatus,
    takeScreenshot,
    takeRapidScreenshot,
    navigateToUrl,
    executeAction
  };
}