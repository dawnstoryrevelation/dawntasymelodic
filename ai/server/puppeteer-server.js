// server/puppeteer-server.js
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();
const port = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Store active browser sessions
const sessions = new Map();

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Helper function to clean up old screenshots
const cleanupOldScreenshots = () => {
  const files = fs.readdirSync(screenshotsDir);
  const now = Date.now();
  
  files.forEach(file => {
    const filePath = path.join(screenshotsDir, file);
    const stats = fs.statSync(filePath);
    const fileAge = now - stats.mtime.getTime();
    
    // Delete files older than 1 hour (3600000 ms)
    if (fileAge > 3600000) {
      fs.unlinkSync(filePath);
    }
  });
};

// Clean up screenshots every hour
setInterval(cleanupOldScreenshots, 3600000);

// Create a new browser session
app.post('/api/puppeteer/session', async (req, res) => {
  try {
    const sessionId = uuidv4();
    
    // Launch a new browser instance
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 1
    });
    
    // Navigate to blank page
    await page.goto('about:blank');
    
    // Store session data
    sessions.set(sessionId, {
      browser,
      page,
      createdAt: new Date(),
      lastActivity: new Date(),
      url: 'about:blank',
      status: 'initialized'
    });
    
    console.log(`Created new browser session: ${sessionId}`);
    
    res.status(200).json({
      sessionId,
      status: 'created'
    });
  } catch (error) {
    console.error('Error creating browser session:', error);
    res.status(500).json({ error: error.message });
  }
});

// End a browser session
app.delete('/api/puppeteer/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const { browser } = sessions.get(sessionId);
      await browser.close();
      sessions.delete(sessionId);
      
      console.log(`Closed browser session: ${sessionId}`);
      
      res.status(200).json({ status: 'closed' });
    } catch (error) {
      console.error(`Error closing browser session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Initialize browser
app.post('/api/puppeteer/session/:sessionId/initialize', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Navigate to Google as a starting point
      await session.page.goto('https://www.google.com', {
        waitUntil: 'networkidle2'
      });
      
      // Update session data
      session.lastActivity = new Date();
      session.url = 'https://www.google.com';
      session.status = 'active';
      
      console.log(`Initialized browser session: ${sessionId}`);
      
      res.status(200).json({
        status: 'initialized',
        url: 'https://www.google.com'
      });
    } catch (error) {
      console.error(`Error initializing browser session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Restart a browser session
app.post('/api/puppeteer/session/:sessionId/restart', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      // Close existing browser
      const { browser } = sessions.get(sessionId);
      await browser.close();
      
      // Launch a new browser
      const newBrowser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
      
      // Create a new page
      const newPage = await newBrowser.newPage();
      
      // Set viewport size
      await newPage.setViewport({
        width: 1280,
        height: 800,
        deviceScaleFactor: 1
      });
      
      // Navigate to Google
      await newPage.goto('https://www.google.com', {
        waitUntil: 'networkidle2'
      });
      
      // Update session data
      sessions.set(sessionId, {
        browser: newBrowser,
        page: newPage,
        createdAt: new Date(),
        lastActivity: new Date(),
        url: 'https://www.google.com',
        status: 'restarted'
      });
      
      console.log(`Restarted browser session: ${sessionId}`);
      
      res.status(200).json({
        status: 'restarted',
        url: 'https://www.google.com'
      });
    } catch (error) {
      console.error(`Error restarting browser session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Refresh browser
app.post('/api/puppeteer/session/:sessionId/refresh', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Refresh the current page
      await session.page.reload({
        waitUntil: 'networkidle2'
      });
      
      // Update session data
      session.lastActivity = new Date();
      
      console.log(`Refreshed browser session: ${sessionId}`);
      
      res.status(200).json({
        status: 'refreshed',
        url: session.url
      });
    } catch (error) {
      console.error(`Error refreshing browser session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Get session status
app.get('/api/puppeteer/session/:sessionId/status', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Check if the browser is still connected
      const pages = await session.browser.pages();
      const isActive = pages.length > 0;
      
      // Get current URL
      let currentUrl = session.url;
      if (isActive) {
        try {
          currentUrl = await session.page.url();
          session.url = currentUrl;
        } catch (e) {
          console.error('Error getting page URL:', e);
        }
      }
      
      // Update last activity
      session.lastActivity = new Date();
      
      res.status(200).json({
        active: isActive,
        url: currentUrl,
        status: session.status,
        lastActivity: session.lastActivity
      });
    } catch (error) {
      console.error(`Error getting status for session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Take a screenshot
app.get('/api/puppeteer/session/:sessionId/screenshot', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Take a screenshot
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-${Date.now()}.png`);
      await session.page.screenshot({ path: screenshotPath, fullPage: false });
      
      // Update last activity
      session.lastActivity = new Date();
      
      // Send the screenshot file
      res.sendFile(screenshotPath, {}, (err) => {
        if (err) {
          console.error('Error sending screenshot:', err);
        }
      });
    } catch (error) {
      console.error(`Error taking screenshot for session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Navigate to URL
app.post('/api/puppeteer/session/:sessionId/navigate', async (req, res) => {
  const { sessionId } = req.params;
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Validate and format URL
      let formattedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        formattedUrl = 'https://' + url;
      }
      
      // Navigate to URL
      await session.page.goto(formattedUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Update session data
      session.lastActivity = new Date();
      session.url = formattedUrl;
      session.status = 'navigated';
      
      console.log(`Navigated to ${formattedUrl} in session: ${sessionId}`);
      
      res.status(200).json({
        status: 'navigated',
        url: formattedUrl
      });
    } catch (error) {
      console.error(`Error navigating to URL in session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Execute browser action
app.post('/api/puppeteer/session/:sessionId/action', async (req, res) => {
  const { sessionId } = req.params;
  const action = req.body;
  
  if (!action || !action.type) {
    return res.status(400).json({ error: 'Action type is required' });
  }
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Update last activity
      session.lastActivity = new Date();
      session.status = `executing ${action.type}`;
      
      // Execute the appropriate action
      switch (action.type) {
        case 'navigate':
          // Navigate to URL
          if (!action.url) {
            return res.status(400).json({ error: 'URL is required for navigate action' });
          }
          
          let formattedUrl = action.url;
          if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = 'https://' + formattedUrl;
          }
          
          await session.page.goto(formattedUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
          });
          
          session.url = formattedUrl;
          break;
          
        case 'click':
          // Click on an element
          if (action.selector) {
            await session.page.waitForSelector(action.selector, { timeout: 10000 });
            await session.page.click(action.selector);
          } else if (action.text) {
            // Try to find element by text
            const elements = await session.page.$$('a, button, [role="button"], input[type="submit"]');
            let clicked = false;
            
            for (const element of elements) {
              const textContent = await session.page.evaluate(el => el.textContent, element);
              if (textContent && textContent.trim().toLowerCase().includes(action.text.toLowerCase())) {
                await element.click();
                clicked = true;
                break;
              }
            }
            
            if (!clicked) {
              throw new Error(`Could not find element with text: ${action.text}`);
            }
          } else {
            return res.status(400).json({ error: 'Selector or text is required for click action' });
          }
          break;
          
        case 'type':
          // Type text into an input field
          if (!action.selector) {
            return res.status(400).json({ error: 'Selector is required for type action' });
          }
          if (!action.text) {
            return res.status(400).json({ error: 'Text is required for type action' });
          }
          
          await session.page.waitForSelector(action.selector, { timeout: 10000 });
          await session.page.click(action.selector, { clickCount: 3 }); // Select all text
          await session.page.type(action.selector, action.text);
          break;
          
        case 'scroll':
          // Scroll the page
          const direction = action.direction || 'down';
          const amount = action.amount || 500;
          
          if (direction === 'down') {
            await session.page.evaluate((scrollAmount) => {
              window.scrollBy(0, scrollAmount);
            }, amount);
          } else if (direction === 'up') {
            await session.page.evaluate((scrollAmount) => {
              window.scrollBy(0, -scrollAmount);
            }, amount);
          }
          break;
          
        case 'submit':
          // Submit a form
          if (!action.selector) {
            return res.status(400).json({ error: 'Selector is required for submit action' });
          }
          
          await session.page.waitForSelector(action.selector, { timeout: 10000 });
          await session.page.evaluate((selector) => {
            document.querySelector(selector).submit();
          }, action.selector);
          break;
          
        case 'wait':
          // Wait for a specified duration
          const duration = action.duration || 1000;
          await new Promise(resolve => setTimeout(resolve, duration));
          break;
          
        case 'screenshot':
          // Screenshot is handled separately
          break;
          
        default:
          return res.status(400).json({ error: `Unknown action type: ${action.type}` });
      }
      
      // Take a screenshot after the action
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-${Date.now()}.png`);
      await session.page.screenshot({ path: screenshotPath, fullPage: false });
      
      // Get current URL after action
      const currentUrl = await session.page.url();
      session.url = currentUrl;
      
      console.log(`Executed ${action.type} action in session: ${sessionId}`);
      
      res.status(200).json({
        status: 'action_executed',
        action: action.type,
        url: currentUrl
      });
    } catch (error) {
      console.error(`Error executing action in session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Cleanup inactive sessions
const cleanupInactiveSessions = async () => {
  const now = new Date();
  const MAX_IDLE_TIME = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, session] of sessions.entries()) {
    const idleTime = now.getTime() - session.lastActivity.getTime();
    
    if (idleTime > MAX_IDLE_TIME) {
      try {
        console.log(`Cleaning up inactive session: ${sessionId}`);
        await session.browser.close();
        sessions.delete(sessionId);
      } catch (error) {
        console.error(`Error cleaning up session ${sessionId}:`, error);
      }
    }
  }
};

// Run cleanup every 15 minutes
setInterval(cleanupInactiveSessions, 15 * 60 * 1000);

// Start the server
app.listen(port, () => {
  console.log(`Puppeteer server listening on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down');
  
  // Close all browser sessions
  for (const [sessionId, session] of sessions.entries()) {
    try {
      await session.browser.close();
      console.log(`Closed browser session: ${sessionId}`);
    } catch (error) {
      console.error(`Error closing browser session ${sessionId}:`, error);
    }
  }
  
  process.exit(0);
});