// src/services/PuppeteerService.js

import axios from 'axios';

/**
 * Service to handle Puppeteer browser automation
 * This connects to a backend API that runs Puppeteer
 */
class PuppeteerService {
  constructor() {
    // Base URL for your backend API that runs Puppeteer
    this.apiBaseUrl = process.env.VUE_APP_PUPPETEER_API_URL || 'http://localhost:3000/puppeteer';
    this.sessionId = null;
    this.isSessionActive = false;
  }

  /**
   * Initialize a new Puppeteer browser session
   * @returns {Promise<Object>} Session information
   */
  async initSession() {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/session`);
      this.sessionId = response.data.sessionId;
      this.isSessionActive = true;
      return response.data;
    } catch (error) {
      console.error('Failed to initialize Puppeteer session:', error);
      throw new Error('Failed to initialize browser automation');
    }
  }

  /**
   * Navigate to a URL
   * @param {string} url - The URL to navigate to
   * @returns {Promise<Object>} Navigation result
   */
  async navigateTo(url) {
    if (!this.isSessionActive) {
      await this.initSession();
    }

    try {
      const response = await axios.post(`${this.apiBaseUrl}/navigate`, {
        sessionId: this.sessionId,
        url
      });
      return response.data;
    } catch (error) {
      console.error('Failed to navigate:', error);
      throw new Error(`Failed to navigate to ${url}`);
    }
  }

  /**
   * Take a screenshot of the current page
   * @returns {Promise<string>} Base64 encoded screenshot
   */
  async takeScreenshot() {
    if (!this.isSessionActive) {
      throw new Error('No active browser session');
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/screenshot`, {
        params: { sessionId: this.sessionId }
      });
      return response.data.screenshot;
    } catch (error) {
      console.error('Failed to take screenshot:', error);
      throw new Error('Failed to capture browser screenshot');
    }
  }

  /**
   * Perform a search on Google
   * @param {string} query - The search query
   * @returns {Promise<Object>} Search results
   */
  async searchGoogle(query) {
    if (!this.isSessionActive) {
      await this.initSession();
    }

    try {
      const response = await axios.post(`${this.apiBaseUrl}/search`, {
        sessionId: this.sessionId,
        query
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search:', error);
      throw new Error(`Failed to search for "${query}"`);
    }
  }

  /**
   * Click on an element matching the provided selector
   * @param {string} selector - CSS selector of the element to click
   * @returns {Promise<Object>} Click result
   */
  async clickElement(selector) {
    if (!this.isSessionActive) {
      throw new Error('No active browser session');
    }

    try {
      const response = await axios.post(`${this.apiBaseUrl}/click`, {
        sessionId: this.sessionId,
        selector
      });
      return response.data;
    } catch (error) {
      console.error('Failed to click element:', error);
      throw new Error(`Failed to click element with selector "${selector}"`);
    }
  }

  /**
   * Extract text content from the page
   * @param {string} selector - Optional CSS selector to extract text from specific elements
   * @returns {Promise<Object>} Extracted text
   */
  async extractText(selector = 'body') {
    if (!this.isSessionActive) {
      throw new Error('No active browser session');
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/extract`, {
        params: { 
          sessionId: this.sessionId,
          selector
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to extract text:', error);
      throw new Error('Failed to extract text from page');
    }
  }

  /**
   * Scroll the page
   * @param {string} direction - 'up' or 'down'
   * @param {number} amount - Scroll amount in pixels
   * @returns {Promise<Object>} Scroll result
   */
  async scrollPage(direction = 'down', amount = 500) {
    if (!this.isSessionActive) {
      throw new Error('No active browser session');
    }

    try {
      const response = await axios.post(`${this.apiBaseUrl}/scroll`, {
        sessionId: this.sessionId,
        direction,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Failed to scroll page:', error);
      throw new Error(`Failed to scroll ${direction}`);
    }
  }

  /**
   * Fill a form input
   * @param {string} selector - CSS selector of the input element
   * @param {string} value - Value to enter
   * @returns {Promise<Object>} Fill result
   */
  async fillInput(selector, value) {
    if (!this.isSessionActive) {
      throw new Error('No active browser session');
    }

    try {
      const response = await axios.post(`${this.apiBaseUrl}/fill`, {
        sessionId: this.sessionId,
        selector,
        value
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fill input:', error);
      throw new Error(`Failed to fill input with selector "${selector}"`);
    }
  }

  /**
   * Close the Puppeteer session
   * @returns {Promise<Object>} Close result
   */
  async closeSession() {
    if (!this.isSessionActive) {
      return { success: true, message: 'No active session to close' };
    }

    try {
      const response = await axios.delete(`${this.apiBaseUrl}/session`, {
        params: { sessionId: this.sessionId }
      });
      this.isSessionActive = false;
      this.sessionId = null;
      return response.data;
    } catch (error) {
      console.error('Failed to close session:', error);
      throw new Error('Failed to close browser session');
    }
  }
}

export default new PuppeteerService();