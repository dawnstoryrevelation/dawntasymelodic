// src/services/puppeteerService.js
/**
 * Service to interact with the Puppeteer backend
 */
export function usePuppeteerService() {
  // API endpoint for Puppeteer service
  const API_BASE_URL = 'http://localhost:3001/api/puppeteer';
  
  // Debug helper function
  const logRequest = (method, endpoint, data = null) => {
    console.log(`🔌 ${method.toUpperCase()} ${API_BASE_URL}${endpoint}${data ? ' with data' : ''}`);
    if (data && method === 'POST' && (endpoint.includes('action') || endpoint.includes('navigate'))) {
      console.log('🔍 Request payload:', JSON.stringify(data).slice(0, 100) + (JSON.stringify(data).length > 100 ? '...' : ''));
    }
  };

  /**
   * Enhanced error handling with retry capability
   */
  const fetchWithRetry = async (url, options, retries = 2) => {
    try {
      const response = await fetch(url, options);
      
      // Detect CAPTCHA in response if it's a navigation response
      if (options.method === 'POST' && 
          (url.includes('navigate') || url.includes('action')) && 
          response.ok) {
        const data = await response.json();
        
        // If we detect CAPTCHA patterns in the URL, notify caller
        if (data.url && isCaptchaUrl(data.url)) {
          data.captchaDetected = true;
        }
        
        return data;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Server responded with ${response.status}: ${errorData.error || 'Unknown error'}`);
      }
      
      return response.headers.get('content-type')?.includes('application/json') 
        ? await response.json() 
        : response;
        
    } catch (error) {
      if (retries > 0) {
        console.warn(`⚠️ Request failed, retrying... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 800));
        return fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  };
  
  /**
   * Check if URL is likely a CAPTCHA
   */
  const isCaptchaUrl = (url) => {
    const captchaPatterns = [
      'captcha',
      'recaptcha',
      'bot-check',
      'security-check',
      'human-verification',
      'challenge',
      'cloudflare',
      'are-you-a-robot',
      'verify'
    ];
    
    const lowercaseUrl = url.toLowerCase();
    return captchaPatterns.some(pattern => lowercaseUrl.includes(pattern));
  };
  
  /**
   * Start a new Puppeteer browser session
   */
  const startSession = async () => {
    try {
      logRequest('POST', '/session');
      const data = await fetchWithRetry(`${API_BASE_URL}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('🚀 Session created:', data.sessionId);
      return data;
    } catch (error) {
      console.error('Error starting Puppeteer session:', error);
      throw new Error(`Failed to start browser session: ${error.message}`);
    }
  };
  
  /**
   * End a Puppeteer browser session
   */
  const endSession = async (sessionId) => {
    try {
      logRequest('DELETE', `/session/${sessionId}`);
      await fetchWithRetry(`${API_BASE_URL}/session/${sessionId}`, {
        method: 'DELETE'
      });
      console.log('🚫 Session ended:', sessionId);
      return { success: true };
    } catch (error) {
      console.error('Error ending Puppeteer session:', error);
      throw new Error(`Failed to end browser session: ${error.message}`);
    }
  };
  
  /**
   * Initialize browser for a session
   */
  const initializeBrowser = async (sessionId) => {
    try {
      logRequest('POST', `/session/${sessionId}/initialize`);
      const data = await fetchWithRetry(`${API_BASE_URL}/session/${sessionId}/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('🌐 Browser initialized:', data);
      return data;
    } catch (error) {
      console.error('Error initializing browser:', error);
      throw new Error(`Failed to initialize browser: ${error.message}`);
    }
  };
  
  /**
   * Restart a browser session
   */
  const restartSession = async (sessionId) => {
    try {
      logRequest('POST', `/session/${sessionId}/restart`);
      const data = await fetchWithRetry(`${API_BASE_URL}/session/${sessionId}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('🔄 Session restarted:', data);
      return data;
    } catch (error) {
      console.error('Error restarting browser session:', error);
      throw new Error(`Failed to restart browser session: ${error.message}`);
    }
  };
  
  /**
   * Refresh the browser page
   */
  const refreshBrowser = async (sessionId) => {
    try {
      logRequest('POST', `/session/${sessionId}/refresh`);
      const data = await fetchWithRetry(`${API_BASE_URL}/session/${sessionId}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('🔄 Browser refreshed:', data);
      return data;
    } catch (error) {
      console.error('Error refreshing browser:', error);
      throw new Error(`Failed to refresh browser: ${error.message}`);
    }
  };
  
  /**
   * Get the status of a session
   */
  const getStatus = async (sessionId) => {
    try {
      // Don't log status requests to reduce console noise
      const response = await fetch(`${API_BASE_URL}/session/${sessionId}/status`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Server responded with ${response.status}: ${errorData.error || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting browser status:', error);
      throw new Error(`Failed to get browser status: ${error.message}`);
    }
  };
  
  /**
   * Take a screenshot of the current browser page with improved error handling
   */
  const takeScreenshot = async (sessionId) => {
    try {
      // Use fetch with blob response type for direct binary handling
      const response = await fetch(`${API_BASE_URL}/session/${sessionId}/screenshot`);
      
      if (!response.ok) {
        throw new Error(`Screenshot failed with status ${response.status}`);
      }
      
      // Get the blob and create an object URL
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error taking screenshot:', error);
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  };
  
  /**
   * Navigate to a URL with enhanced error handling
   */
  const navigateToUrl = async (sessionId, url) => {
    if (!url) {
      throw new Error('URL is required');
    }
    
    try {
      logRequest('POST', `/session/${sessionId}/navigate`, { url });
      console.log(`🌐 Navigating to: ${url}`);
      
      const data = await fetchWithRetry(`${API_BASE_URL}/session/${sessionId}/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      // Check for CAPTCHA detection
      if (data.captchaDetected) {
        console.warn('⚠️ CAPTCHA detected! Taking evasive action...');
        // The calling code will handle this flag to take appropriate action
      }
      
      console.log('✅ Navigation complete:', data);
      return data;
    } catch (error) {
      console.error('Error navigating to URL:', error);
      throw new Error(`Failed to navigate to URL: ${error.message}`);
    }
  };
  
  /**
   * Execute a browser action with enhanced error handling and CAPTCHA detection
   * Action types: click, type, scroll, wait, etc.
   */
  const executeAction = async (sessionId, action) => {
    if (!action || !action.type) {
      throw new Error('Action type is required');
    }
    
    try {
      logRequest('POST', `/session/${sessionId}/action`, action);
      console.log(`🎮 Executing action: ${action.type} - ${action.description || ''}`);
      
      // Special handling for specific action types
      if (action.type === 'type' && (!action.selector || !action.text)) {
        throw new Error('Selector and text are required for type action');
      } else if (action.type === 'click' && !action.selector && !action.text) {
        throw new Error('Either selector or text is required for click action');
      }
      
      // Add action metadata for better server handling
      const enhancedAction = {
        ...action,
        metadata: {
          clientTimestamp: Date.now(),
          clientVersion: '1.0.0'
        }
      };
      
      const data = await fetchWithRetry(`${API_BASE_URL}/session/${sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedAction)
      });
      
      // Handle specific statuses from the server
      if (data.status === 'warning') {
        console.warn(`⚠️ Action warning: ${data.message}`);
        // Continue despite warning
        return {
          ...data,
          warning: true
        };
      }
      
      // Check for CAPTCHA after action
      if (data.captchaDetected || (data.url && isCaptchaUrl(data.url))) {
        console.warn('⚠️ CAPTCHA detected after action! Taking evasive action...');
        return {
          ...data,
          captchaDetected: true
        };
      }
      
      console.log(`✅ Action executed: ${action.type}`);
      return data;
    } catch (error) {
      console.error('Error executing browser action:', error);
      throw new Error(`Failed to execute browser action: ${error.message}`);
    }
  };
  
  /**
   * Get HTML content of the current page
   */
  const getPageContent = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/session/${sessionId}/content`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Server responded with ${response.status}: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error getting page content:', error);
      throw new Error(`Failed to get page content: ${error.message}`);
    }
  };
  
  /**
   * Handle CAPTCHA detection and avoidance
   */
  const handleCaptcha = async (sessionId) => {
    try {
      logRequest('POST', `/session/${sessionId}/handle-captcha`);
      const data = await fetchWithRetry(`${API_BASE_URL}/session/${sessionId}/handle-captcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('🤖 CAPTCHA handling attempt:', data);
      return data;
    } catch (error) {
      console.error('Error handling CAPTCHA:', error);
      throw new Error(`Failed to handle CAPTCHA: ${error.message}`);
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
    executeAction,
    getPageContent,
    handleCaptcha
  };
}