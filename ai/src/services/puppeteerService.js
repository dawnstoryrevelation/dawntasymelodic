// src/services/puppeteerService.js - SUPERCHARGED FOR REAL-TIME BROWSING!
import axios from 'axios';

/**
 * Service to interact with the Puppeteer backend
 * SUPERCHARGED FOR MAXIMUM RESILIENCE AND REAL-TIME VISUALIZATION!
 */
export function usePuppeteerService() {
  // API base URL with backup options
  const API_BASE_URL = import.meta.env.VITE_PUPPETEER_API_URL || 'http://localhost:3001/api/puppeteer';
  
  // Cache management for screenshots and status
  const cache = {
    screenshots: new Map(),
    typingStatus: new Map(),
    statusTimestamps: new Map()
  };
  
  // Request tracking for better performance
  const requestTracker = {
    screenshotCount: 0,
    failedScreenshotCount: 0,
    typingStatusCount: 0
  };
  
  // Debug helper function - CRITICAL FOR DEBUGGING!
  const logRequest = (method, endpoint, options = {}) => {
    // Only log significant events to reduce console noise
    if (options.significant) {
      console.log(`🔌 ${method.toUpperCase()} ${API_BASE_URL}${endpoint}`);
    }
  };
  
  /**
   * Start a new Puppeteer browser session - ULTRA-RELIABLE!
   */
  const startSession = async () => {
    try {
      logRequest('POST', '/session', { significant: true });
      
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
      logRequest('DELETE', `/session/${sessionId}`, { significant: true });
      await axios.delete(`${API_BASE_URL}/session/${sessionId}`);
      console.log('🚫 Session ended:', sessionId);
      
      // Clean up any cached data for this session
      cache.screenshots.delete(sessionId);
      cache.typingStatus.delete(sessionId);
      cache.statusTimestamps.delete(sessionId);
      
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
      logRequest('POST', `/session/${sessionId}/initialize`, { significant: true });
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
      logRequest('POST', `/session/${sessionId}/restart`, { significant: true });
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/restart`, {}, {
        timeout: 20000
      });
      console.log('🔄 Session restarted:', response.data);
      
      // Clear cached data for this session
      cache.screenshots.delete(sessionId);
      cache.typingStatus.delete(sessionId);
      
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
      logRequest('POST', `/session/${sessionId}/refresh`, { significant: true });
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/refresh`);
      console.log('🔄 Browser refreshed:', response.data);
      
      // Clear cached data for refreshed session
      cache.screenshots.delete(sessionId);
      cache.typingStatus.delete(sessionId);
      
      return response.data;
    } catch (error) {
      console.error('Error refreshing browser:', error);
      
      // Try to restart if refresh fails
      try {
        console.log('⚠️ Refresh failed - attempting restart');
        const restartResponse = await restartSession(sessionId);
        return { 
          success: true, 
          status: 'restarted_instead_of_refreshed',
          ...restartResponse
        };
      } catch (restartError) {
        // Don't fail completely - return a status object
        return { 
          success: false, 
          status: 'refresh_failed',
          error: error.message
        };
      }
    }
  };
  
  /**
   * Get the status of a session - WITH RETRY AND ENHANCED INFO!
   * Uses caching and rate limiting to prevent overwhelming the server
   */
  const getStatus = async (sessionId) => {
    // Rate limiting - prevent too frequent status requests
    const now = Date.now();
    const lastStatusTime = cache.statusTimestamps.get(sessionId) || 0;
    const minStatusInterval = 500; // Minimum time between status requests
    
    if (now - lastStatusTime < minStatusInterval) {
      // Return cached status if available
      const cachedStatus = cache.typingStatus.get(sessionId);
      if (cachedStatus && cachedStatus.timestamp > now - 2000) {
        return cachedStatus;
      }
    }
    
    try {
      // Update timestamp before request
      cache.statusTimestamps.set(sessionId, now);
      
      // Add cache-busting parameter
      const cacheBuster = Date.now();
      
      // Don't log status requests to reduce noise
      const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/status?t=${cacheBuster}`, {
        timeout: 3000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Cache the response
      const statusData = {
        ...response.data,
        timestamp: now
      };
      
      return statusData;
    } catch (error) {
      // Try once more with an extended timeout for 404 or 500 errors
      if (error.response && (error.response.status === 404 || error.response.status === 500)) {
        try {
          const retryResponse = await axios.get(`${API_BASE_URL}/session/${sessionId}/status?retry=true&t=${Date.now()}`, {
            timeout: 8000
          });
          return {
            ...retryResponse.data,
            timestamp: Date.now()
          };
        } catch (retryError) {
          // Fallback status
          return {
            active: false,
            url: 'unknown',
            status: 'error',
            lastActivity: new Date(),
            timestamp: Date.now()
          };
        }
      }
      
      // Generic error case
      return {
        active: false,
        url: 'unknown',
        status: 'error',
        lastActivity: new Date(),
        timestamp: Date.now(),
        error: error.message
      };
    }
  };
  
  /**
   * ENHANCED Get real-time typing status - OPTIMIZED FOR CHARACTER-BY-CHARACTER UPDATES! 🔥
   */
  const getTypingStatus = async (sessionId) => {
    try {
      // Increment request counter - for debugging
      requestTracker.typingStatusCount++;
      
      // Only log occasionally to reduce noise
      const shouldLog = requestTracker.typingStatusCount % 50 === 1;
      
      // Add cache-busting timestamp parameter to prevent browser caching
      const cacheBuster = Date.now();
      const response = await axios.get(
        `${API_BASE_URL}/session/${sessionId}/typing-status?t=${cacheBuster}`, 
        {
          timeout: 1000, // Reduced timeout for faster real-time updates
          // Critical - prevents browser caching
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      
      // Add timestamp to response
      const typingData = {
        ...response.data,
        timestamp: Date.now()
      };
      
      // Cache the response for rate limiting
      cache.typingStatus.set(sessionId, typingData);
      
      if (shouldLog && response.data.isTyping) {
        console.log(`⌨️ Typing detected: "${response.data.text}"`);
      }
      
      return typingData;
    } catch (error) {
      // Check for 404 error (endpoint might not exist yet)
      const is404 = error.response && error.response.status === 404;
      
      // Use static counter to track consecutive failures
      getTypingStatus.failureCount = (getTypingStatus.failureCount || 0) + 1;
      
      // Only log errors occasionally to reduce console spam
      if ((!is404 && getTypingStatus.failureCount % 10 === 1) || getTypingStatus.failureCount === 1) {
        console.error(`Error getting typing status (failure #${getTypingStatus.failureCount}):`, 
          is404 ? 'Endpoint not found (404)' : error.message);
      }
      
      // Return most recent cached data if available
      const cachedTypingStatus = cache.typingStatus.get(sessionId);
      if (cachedTypingStatus) {
        // Mark as stale but return cached data
        return {
          ...cachedTypingStatus,
          stale: true,
          timestamp: Date.now()
        };
      }
      
      // Always return valid fallback data structure
      return {
        isTyping: false,
        text: '',
        selector: null,
        timestamp: Date.now(),
        error: is404 ? 'endpoint-not-found' : 'connection-error'
      };
    }
  };
  
  /**
   * Take a screenshot of the current browser page - SUPERCHARGED FOR PERFORMANCE! 🔥
   * OPTIMIZED FOR FASTER TRANSFER RATE & CONTENT-AWARE CACHING!
   */
  const takeScreenshot = async (sessionId, forceParam = '') => {
    // Increment request counter
    requestTracker.screenshotCount++;
    
    // Log every 10th request to reduce noise
    const shouldLog = requestTracker.screenshotCount % 10 === 1;
    if (shouldLog) {
      console.log(`📸 Taking screenshot for session ${sessionId} (request #${requestTracker.screenshotCount})`);
    }
    
    // Add timestamp for cache busting
    const timestamp = Date.now();
    const urlParams = forceParam + (forceParam ? '&' : '?') + `t=${timestamp}`;
    
    // Counting attempts
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/screenshot${urlParams}`, {
          responseType: 'blob',
          timeout: 3000, // Shorter timeout for faster feedback
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        // Free previous object URL to prevent memory leaks
        const previousScreenshot = cache.screenshots.get(sessionId);
        if (previousScreenshot) {
          URL.revokeObjectURL(previousScreenshot);
        }
        
        // Create and cache new object URL
        const objectUrl = URL.createObjectURL(response.data);
        cache.screenshots.set(sessionId, objectUrl);
        
        // Reset failure counters on success
        requestTracker.failedScreenshotCount = 0;
        
        return objectUrl;
      } catch (error) {
        // Count consecutive failures
        requestTracker.failedScreenshotCount = (requestTracker.failedScreenshotCount || 0) + 1;
        
        // Log error occasionally to reduce console noise
        if (requestTracker.failedScreenshotCount % 3 === 1) {
          console.error(`Error taking screenshot (consecutive failures: ${requestTracker.failedScreenshotCount}):`, 
                       error.message || error);
        }
        
        if (attempt === 2) {
          // All attempts failed - return last cached screenshot if available
          if (cache.screenshots.get(sessionId)) {
            console.log('⚠️ Using cached screenshot due to failure');
            return cache.screenshots.get(sessionId);
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
   * Navigate to a URL - WITH ENHANCED ERROR HANDLING & CAPTCHA AVOIDANCE
   */
  const navigateToUrl = async (sessionId, url) => {
    try {
      logRequest('POST', `/session/${sessionId}/navigate`, { significant: true });
      console.log(`🌐 Navigating to: ${url}`);
      
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/navigate`, { url }, {
        timeout: 30000 // Extended timeout for navigation
      });
      
      console.log('✅ Navigation complete:', response.data);
      
      // Clear cached data after navigation
      cache.screenshots.delete(sessionId);
      
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
        
        // Second attempt after refresh
        try {
          console.log('🔄 Second navigation attempt after refresh');
          const retryResponse = await axios.post(`${API_BASE_URL}/session/${sessionId}/navigate`, { url }, {
            timeout: 30000
          });
          return retryResponse.data;
        } catch (retryError) {
          // Continue even if second attempt fails
          console.log('⚠️ Second navigation attempt failed - continuing anyway');
        }
        
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
      logRequest('POST', `/session/${sessionId}/action`, { significant: true });
      console.log(`🎮 Executing action: ${action.type} - ${action.description || ''}`);
      
      // ENHANCED TIMEOUT BASED ON ACTION TYPE for maximum reliability!
      let timeout = 10000; // Default timeout
      
      // Adjust timeout based on action type
      if (action.type === 'navigate') {
        timeout = 30000; // Longer timeout for navigation
      } else if (action.type === 'type') {
        timeout = 15000; // Reasonable timeout for typing
      } else if (action.type === 'click') {
        timeout = 15000; // Medium-long timeout for clicks (they might cause navigation)
      }
      
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/action`, action, {
        timeout
      });
      
      console.log(`✅ Action executed: ${action.type}`);
      
      // Actions that might modify the page - clear cached screenshot
      if (['navigate', 'click', 'type', 'submit'].includes(action.type)) {
        cache.screenshots.delete(sessionId);
      }
      
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
  
  /**
   * NEW! Execute multiple browser actions in sequence with retries
   * Optimized for reliability and speed
   */
  const executeActionSequence = async (sessionId, actions) => {
    const results = [];
    let failedCount = 0;
    
    // Execute actions in sequence with retries
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      console.log(`🔄 Executing action ${i+1}/${actions.length}: ${action.type}`);
      
      // Try up to 2 times per action
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await executeAction(sessionId, action);
          results.push(result);
          
          // Success - break retry loop
          break;
        } catch (error) {
          console.error(`Action ${i+1} failed on attempt ${attempt}:`, error);
          
          // If second attempt failed, count as failure
          if (attempt === 2) {
            failedCount++;
            results.push({
              status: 'error',
              success: false,
              error: error.message
            });
          } else {
            // Wait briefly before retry
            await new Promise(r => setTimeout(r, 500));
          }
        }
      }
      
      // Short delay between actions for UI to update
      await new Promise(r => setTimeout(r, 200));
      
      // If too many failures, stop sequence
      if (failedCount >= 3) {
        console.error('Too many action failures, aborting sequence');
        break;
      }
    }
    
    return {
      success: failedCount < 3,
      results,
      completedCount: results.length,
      failedCount
    };
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
    navigateToUrl,
    executeAction,
    executeActionSequence
  };
}