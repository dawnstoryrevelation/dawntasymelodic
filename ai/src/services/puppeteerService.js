// src/services/puppeteerService.js
import axios from 'axios';

/**
 * Service to interact with the Puppeteer backend
 */
export function usePuppeteerService() {
  // API endpoint for Puppeteer service - HARDCODED FOR MAXIMUM RELIABILITY!
  const API_BASE_URL = 'http://localhost:3001/api/puppeteer';
  
  // Debug helper function
  const logRequest = (method, endpoint) => {
    console.log(`🔌 ${method.toUpperCase()} ${API_BASE_URL}${endpoint}`);
  };
  
  /**
   * Start a new Puppeteer browser session
   */
  const startSession = async () => {
    try {
      logRequest('POST', '/session');
      const response = await axios.post(`${API_BASE_URL}/session`);
      console.log('🚀 Session created:', response.data);
      return response.data;
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
      await axios.delete(`${API_BASE_URL}/session/${sessionId}`);
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
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/initialize`);
      console.log('🌐 Browser initialized:', response.data);
      return response.data;
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
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/restart`);
      console.log('🔄 Session restarted:', response.data);
      return response.data;
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
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/refresh`);
      console.log('🔄 Browser refreshed:', response.data);
      return response.data;
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
      // Don't log status requests to reduce noise
      const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting browser status:', error);
      throw new Error(`Failed to get browser status: ${error.message}`);
    }
  };
  
  /**
   * Take a screenshot of the current browser page
   */
  const takeScreenshot = async (sessionId) => {
    try {
      // Don't log screenshot requests to reduce noise
      const response = await axios.get(`${API_BASE_URL}/session/${sessionId}/screenshot`, {
        responseType: 'blob'
      });
      
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error taking screenshot:', error);
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  };
  
  /**
   * Navigate to a URL
   */
  const navigateToUrl = async (sessionId, url) => {
    try {
      logRequest('POST', `/session/${sessionId}/navigate`);
      console.log(`🌐 Navigating to: ${url}`);
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/navigate`, { url });
      console.log('✅ Navigation complete:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error navigating to URL:', error);
      throw new Error(`Failed to navigate to URL: ${error.message}`);
    }
  };
  
  /**
   * Execute a browser action
   * Action types: click, type, scroll, etc.
   */
  const executeAction = async (sessionId, action) => {
    try {
      logRequest('POST', `/session/${sessionId}/action`);
      console.log(`🎮 Executing action: ${action.type} - ${action.description || ''}`);
      
      const response = await axios.post(`${API_BASE_URL}/session/${sessionId}/action`, action);
      console.log(`✅ Action executed: ${action.type}`);
      return response.data;
    } catch (error) {
      console.error('Error executing browser action:', error);
      throw new Error(`Failed to execute browser action: ${error.message}`);
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