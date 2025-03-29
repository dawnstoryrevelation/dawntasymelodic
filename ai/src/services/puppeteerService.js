// src/services/puppeteerService.js
import axios from 'axios';

/**
 * Service to interact with the Puppeteer backend
 * SUPERCHARGED FOR MAXIMUM RESILIENCE AND RELIABILITY!
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
   * Initialize browser for a session
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
   * Restart a browser session
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
   * Refresh the browser page
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
   * Get the status of a session - WITH RETRY!
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
   * Take a screenshot of the current browser page - WITH MULTIPLE RETRIES!
   */
  const takeScreenshot = async (sessionId) => {
    // Try up to 3 times to get a screenshot
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Only log first attempt to reduce noise
        if (attempt === 1) {
          console.log(`📸 Taking screenshot for session ${sessionId}`);
        }
        
        const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/screenshot`, {
          responseType: 'blob',
          timeout: attempt * 5000 // Increase timeout with each attempt
        });
        
        return URL.createObjectURL(response.data);
      } catch (error) {
        console.error(`Error taking screenshot (attempt ${attempt}/3):`, error);
        
        if (attempt === 3) {
          // All attempts failed
          console.log('❌ All screenshot attempts failed');
          // Return a fallback screenshot or throw error
          throw new Error(`Failed to take screenshot after multiple attempts: ${error.message}`);
        } else {
          // Wait before next attempt
          await new Promise(r => setTimeout(r, 1000));
          console.log(`🔄 Retrying screenshot (attempt ${attempt + 1}/3)...`);
        }
      }
    }
  };
  
  /**
   * Navigate to a URL - WITH ENHANCED ERROR HANDLING
   */
  const navigateToUrl = async (sessionId, url) => {
    try {
      logRequest('POST', `/session/${sessionId}/navigate`);
      console.log(`🌐 Navigating to: ${url}`);
      
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/navigate`, { url }, {
        timeout: 30000 // Extended timeout for navigation
      });
      
      console.log('✅ Navigation complete:', response.data);
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
   * Action types: click, type, scroll, etc.
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
        timeout = 15000; // Medium timeout for typing
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
    takeScreenshot,
    navigateToUrl,
    executeAction
  };
}