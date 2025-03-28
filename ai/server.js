// Backend Express server for Puppeteer functionality
// Save this as server.js in your backend directory

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Store active browser sessions
const sessions = {};

// Middleware to validate session
const validateSession = (req, res, next) => {
  const sessionId = req.body.sessionId || req.query.sessionId;
  
  if (!sessionId || !sessions[sessionId]) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid or expired session' 
    });
  }
  
  req.sessionId = sessionId;
  next();
};

// Create a new browser session
app.post('/puppeteer/session', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    // Create a new session ID
    const sessionId = uuidv4();
    
    // Store the session
    sessions[sessionId] = {
      browser,
      page,
      createdAt: new Date(),
      lastActivity: new Date()
    };
    
    // Set session timeout (30 minutes)
    setTimeout(() => {
      if (sessions[sessionId]) {
        closeSession(sessionId);
      }
    }, 30 * 60 * 1000);
    
    res.json({
      success: true,
      sessionId,
      message: 'Browser session created successfully'
    });
  } catch (error) {
    console.error('Error creating browser session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create browser session',
      error: error.message
    });
  }
});

// Navigate to a URL
app.post('/puppeteer/navigate', validateSession, async (req, res) => {
  const { sessionId } = req;
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL is required'
    });
  }
  
  try {
    const { page } = sessions[sessionId];
    
    // Update last activity
    sessions[sessionId].lastActivity = new Date();
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Take a screenshot
    const screenshot = await page.screenshot({ encoding: 'base64' });
    
    // Get the page title
    const title = await page.title();
    
    res.json({
      success: true,
      message: 'Navigation successful',
      title,
      url: page.url(),
      screenshot: `data:image/png;base64,${screenshot}`
    });
  } catch (error) {
    console.error('Navigation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to navigate to URL',
      error: error.message
    });
  }
});

// Take a screenshot
app.get('/puppeteer/screenshot', validateSession, async (req, res) => {
  const { sessionId } = req;
  
  try {
    const { page } = sessions[sessionId];
    
    // Update last activity
    sessions[sessionId].lastActivity = new Date();
    
    const screenshot = await page.screenshot({ encoding: 'base64' });
    
    res.json({
      success: true,
      message: 'Screenshot captured',
      url: page.url(),
      screenshot: `data:image/png;base64,${screenshot}`
    });
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to capture screenshot',
      error: error.message
    });
  }
});

// Perform a Google search
app.post('/puppeteer/search', validateSession, async (req, res) => {
  const { sessionId } = req;
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }
  
  try {
    const { page } = sessions[sessionId];
    
    // Update last activity
    sessions[sessionId].lastActivity = new Date();
    
    // Go to Google
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
    
    // Accept cookies if the dialog appears
    try {
      const acceptButtonSelector = 'button:has-text("Accept all")';
      if (await page.$(acceptButtonSelector)) {
        await page.click(acceptButtonSelector);
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }
    } catch (error) {
      console.log('No cookie dialog or error handling it:', error.message);
    }
    
    // Type query and search
    await page.type('input[name="q"]', query);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Take a screenshot
    const screenshot = await page.screenshot({ encoding: 'base64' });
    
    // Extract search results
    const searchResults = await page.evaluate(() => {
      const results = [];
      const elements = document.querySelectorAll('div.g');
      
      elements.forEach((element) => {
        const titleElement = element.querySelector('h3');
        const linkElement = element.querySelector('a');
        const snippetElement = element.querySelector('div.VwiC3b');
        
        if (titleElement && linkElement) {
          results.push({
            title: titleElement.innerText,
            link: linkElement.href,
            snippet: snippetElement ? snippetElement.innerText : ''
          });
        }
      });
      
      return results;
    });
    
    res.json({
      success: true,
      message: 'Search completed',
      query,
      url: page.url(),
      searchResults,
      screenshot: `data:image/png;base64,${screenshot}`
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform search',
      error: error.message
    });
  }
});

// Click an element
app.post('/puppeteer/click', validateSession, async (req, res) => {
  const { sessionId } = req;
  const { selector } = req.body;
  
  if (!selector) {
    return res.status(400).json({
      success: false,
      message: 'Element selector is required'
    });
  }
  
  try {
    const { page } = sessions[sessionId];
    
    // Update last activity
    sessions[sessionId].lastActivity = new Date();
    
    // Wait for the selector to be visible
    await page.waitForSelector(selector, { visible: true, timeout: 5000 });
    
    // Click the element
    await page.click(selector);
    
    // Wait for any navigation or network activity to complete
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
    } catch (error) {
      // Navigation might not happen, so we can safely ignore this error
      console.log('No navigation occurred after click');
    }
    
    // Take a screenshot
    const screenshot = await page.screenshot({ encoding: 'base64' });
    
    res.json({
      success: true,
      message: 'Element clicked successfully',
      url: page.url(),
      screenshot: `data:image/png;base64,${screenshot}`
    });
  } catch (error) {
    console.error('Click error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to click element',
      error: error.message
    });
  }
});

// Extract text
app.get('/puppeteer/extract', validateSession, async (req, res) => {
  const { sessionId } = req;
  const { selector = 'body' } = req.query;
  
  try {
    const { page } = sessions[sessionId];
    
    // Update last activity
    sessions[sessionId].lastActivity = new Date();
    
    // Wait for the selector to be present
    await page.waitForSelector(selector, { timeout: 5000 });
    
    // Extract text
    const extractedText = await page.evaluate((sel) => {
      const elements = document.querySelectorAll(sel);
      const texts = [];
      
      elements.forEach((element) => {
        texts.push(element.innerText);
      });
      
      return texts.join('\n');
    }, selector);
    
    res.json({
      success: true,
      message: 'Text extracted successfully',
      url: page.url(),
      selector,
      text: extractedText
    });
  } catch (error) {
    console.error('Extract text error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract text',
      error: error.message
    });
  }
});

// Scroll the page
app.post('/puppeteer/scroll', validateSession, async (req, res) => {
  const { sessionId } = req;
  const { direction = 'down', amount = 500 } = req.body;
  
  try {
    const { page } = sessions[sessionId];
    
    // Update last activity
    sessions[sessionId].lastActivity = new Date();
    
    // Scroll the page
    await page.evaluate((dir, amt) => {
      window.scrollBy(0, dir === 'up' ? -amt : amt);
    }, direction, amount);
    
    // Wait for any dynamic content to load
    await page.waitForTimeout(500);
    
    // Take a screenshot
    const screenshot = await page.screenshot({ encoding: 'base64' });
    
    res.json({
      success: true,
      message: `Page scrolled ${direction}`,
      url: page.url(),
      screenshot: `data:image/png;base64,${screenshot}`
    });
  } catch (error) {
    console.error('Scroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scroll page',
      error: error.message
    });
  }
});

// Fill input
app.post('/puppeteer/fill', validateSession, async (req, res) => {
  const { sessionId } = req;
  const { selector, value } = req.body;
  
  if (!selector || value === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Selector and value are required'
    });
  }
  
  try {
    const { page } = sessions[sessionId];
    
    // Update last activity
    sessions[sessionId].lastActivity = new Date();
    
    // Wait for the selector to be visible
    await page.waitForSelector(selector, { visible: true, timeout: 5000 });
    
    // Clear the input field
    await page.evaluate((sel) => {
      document.querySelector(sel).value = '';
    }, selector);
    
    // Type the value
    await page.type(selector, value);
    
    // Take a screenshot
    const screenshot = await page.screenshot({ encoding: 'base64' });
    
    res.json({
      success: true,
      message: 'Input filled successfully',
      url: page.url(),
      selector,
      value,
      screenshot: `data:image/png;base64,${screenshot}`
    });
  } catch (error) {
    console.error('Fill input error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fill input',
      error: error.message
    });
  }
});

// Close a session
app.delete('/puppeteer/session', async (req, res) => {
  const { sessionId } = req.query;
  
  if (!sessionId || !sessions[sessionId]) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired session'
    });
  }
  
  try {
    await closeSession(sessionId);
    
    res.json({
      success: true,
      message: 'Browser session closed successfully'
    });
  } catch (error) {
    console.error('Error closing session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close browser session',
      error: error.message
    });
  }
});

// Helper function to close a session
async function closeSession(sessionId) {
  if (sessions[sessionId]) {
    const { browser } = sessions[sessionId];
    
    try {
      await browser.close();
    } catch (error) {
      console.error(`Error closing browser for session ${sessionId}:`, error);
    }
    
    delete sessions[sessionId];
    console.log(`Session ${sessionId} closed`);
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Puppeteer backend server running on port ${port}`);
});

// Gracefully close all browser instances on server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  // Close all active sessions
  for (const sessionId in sessions) {
    await closeSession(sessionId);
  }
  
  process.exit(0);
});