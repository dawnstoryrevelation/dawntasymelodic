// server/puppeteer-server.js
import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (ES Module version)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server configuration
const app = express();
const port = process.env.PORT || 3001;

// CAPTCHA detection patterns
const CAPTCHA_PATTERNS = [
  'captcha',
  'recaptcha',
  'hcaptcha',
  'cloudflare',
  'bot detection',
  'security check',
  'human verification',
  'are you a human',
  'robot check',
  'anti-robot',
  'verify'
];

// Enhanced middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only log if duration is over 100ms to reduce noise
    if (duration > 100) {
      console.log(`🕒 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Sessions map with auto-cleanup
const sessions = new Map();

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Cleanup old screenshots to save disk space
const cleanupOldScreenshots = () => {
  console.log("🧹 Cleaning up old screenshots...");
  const files = fs.readdirSync(screenshotsDir);
  const now = Date.now();
  let cleanedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(screenshotsDir, file);
    const stats = fs.statSync(filePath);
    const fileAge = now - stats.mtime.getTime();
    
    // Delete files older than 10 minutes (600000 ms)
    if (fileAge > 600000) {
      fs.unlinkSync(filePath);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`🧹 Removed ${cleanedCount} old screenshots`);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupOldScreenshots, 5 * 60 * 1000);

// CAPTCHA detection function
const detectCaptcha = async (page) => {
  try {
    const url = await page.url();
    const title = await page.title();
    
    // Check URL and title for CAPTCHA patterns
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    if (CAPTCHA_PATTERNS.some(pattern => lowerUrl.includes(pattern) || lowerTitle.includes(pattern))) {
      return true;
    }
    
    // Check page content for CAPTCHA elements
    const hasCaptchaElements = await page.evaluate(() => {
      const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="captcha"]',
        'div.g-recaptcha',
        'div.h-captcha',
        'div[class*="captcha"]',
        'input[name*="captcha"]',
        'img[src*="captcha"]'
      ];
      
      return captchaSelectors.some(selector => document.querySelector(selector) !== null);
    });
    
    return hasCaptchaElements;
  } catch (error) {
    console.error('Error detecting CAPTCHA:', error);
    return false;
  }
};

// CAPTCHA evasion strategies
const evadeCaptcha = async (page) => {
  try {
    console.log('🛡️ Attempting to evade CAPTCHA...');
    
    // 1. Back to previous page if possible
    try {
      await page.goBack();
      console.log('⬅️ Navigated back to escape CAPTCHA');
      return true;
    } catch (e) {
      console.log('↩️ Could not go back, trying alternative approach');
    }
    
    // 2. Try different search engine
    try {
      await page.goto('https://www.bing.com', { waitUntil: 'networkidle2' });
      console.log('🔄 Switched to alternative search engine');
      return true;
    } catch (e) {
      console.log('❌ Failed to switch search engine');
    }
    
    // 3. Last resort: go to Google
    try {
      await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });
      console.log('🏠 Returned to Google home page');
      return true;
    } catch (e) {
      console.error('💥 All CAPTCHA evasion techniques failed');
      return false;
    }
  } catch (error) {
    console.error('Error in CAPTCHA evasion:', error);
    return false;
  }
};

// Create a new browser session
app.post('/api/puppeteer/session', async (req, res) => {
  try {
    const sessionId = uuidv4();
    console.log(`🚀 Creating new browser session: ${sessionId}`);
    
    // Launch with optimized options
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,800',
        
        // CAPTCHA avoidance args
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 1
    });
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    
    // Mask browser automation
    await page.evaluateOnNewDocument(() => {
      // Overwrite the 'navigator.webdriver' property to make it undefined
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
      
      // Remove Chrome automation protocol from window
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    });
    
    // Optimize page loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // Block resource types that slow down browsing
      const resourceType = request.resourceType();
      const url = request.url().toLowerCase();
      
      if (
        resourceType === 'image' || 
        resourceType === 'media' ||
        resourceType === 'font' ||
        url.includes('google-analytics') ||
        url.includes('googletagmanager') ||
        url.includes('facebook') ||
        url.includes('analytics') ||
        url.includes('advertisement')
      ) {
        request.abort();
      } else {
        request.continue();
      }
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
      status: 'initialized',
      actions: [],
      performance: {
        navigationCount: 0,
        clickCount: 0,
        typeCount: 0
      }
    });
    
    console.log(`✅ Browser session created: ${sessionId}`);
    
    res.status(200).json({
      sessionId,
      status: 'created',
      message: 'Browser session created and ready'
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
      
      console.log(`🚫 Closed browser session: ${sessionId}`);
      
      res.status(200).json({ status: 'closed' });
    } catch (error) {
      console.error(`Error closing browser session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Initialize browser for a session
app.post('/api/puppeteer/session/:sessionId/initialize', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      console.log(`🔄 Initializing browser session: ${sessionId}`);
      
      // Enhanced browser setup
      await session.page.setJavaScriptEnabled(true);
      await session.page.setDefaultNavigationTimeout(30000);
      
      // Go to Google
      await session.page.goto('https://www.google.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Update session data
      session.lastActivity = new Date();
      session.url = 'https://www.google.com';
      session.status = 'active';
      session.performance.navigationCount++;
      
      // Take a screenshot
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-init-${Date.now()}.png`);
      await session.page.screenshot({ path: screenshotPath, fullPage: false });
      
      console.log(`✅ Browser initialized: ${sessionId}`);
      
      res.status(200).json({
        status: 'initialized',
        url: 'https://www.google.com'
      });
    } catch (error) {
      console.error(`Error initializing session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    console.error(`Session not found: ${sessionId}`);
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
      
      console.log(`🔄 Restarting browser session: ${sessionId}`);
      
      // Launch a new browser
      const newBrowser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1280,800',
          // CAPTCHA avoidance args
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security',
          '--disable-blink-features=AutomationControlled'
        ]
      });
      
      // Create a new page
      const newPage = await newBrowser.newPage();
      
      // Set viewport
      await newPage.setViewport({
        width: 1280,
        height: 800,
        deviceScaleFactor: 1
      });
      
      // Set a realistic user agent
      await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
      
      // Mask browser automation
      await newPage.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
      });
      
      // Optimize page loading
      await newPage.setRequestInterception(true);
      newPage.on('request', (request) => {
        const resourceType = request.resourceType();
        const url = request.url().toLowerCase();
        
        if (
          resourceType === 'image' || 
          resourceType === 'media' ||
          resourceType === 'font' ||
          url.includes('google-analytics') ||
          url.includes('googletagmanager') ||
          url.includes('facebook') ||
          url.includes('analytics') ||
          url.includes('advertisement')
        ) {
          request.abort();
        } else {
          request.continue();
        }
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
        status: 'restarted',
        actions: [],
        performance: {
          navigationCount: 1,
          clickCount: 0,
          typeCount: 0
        }
      });
      
      console.log(`✅ Browser session restarted: ${sessionId}`);
      
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
      
      console.log(`🔄 Refreshing browser session: ${sessionId}`);
      
      // Refresh the current page
      await session.page.reload({
        waitUntil: 'networkidle2'
      });
      
      // Update session data
      session.lastActivity = new Date();
      
      console.log(`✅ Browser refreshed: ${sessionId}`);
      
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
      
      // Check for CAPTCHA
      let captchaDetected = false;
      if (isActive) {
        try {
          captchaDetected = await detectCaptcha(session.page);
        } catch (e) {
          console.error('Error checking for CAPTCHA:', e);
        }
      }
      
      // Update last activity
      session.lastActivity = new Date();
      
      res.status(200).json({
        active: isActive,
        url: currentUrl,
        status: session.status,
        lastActivity: session.lastActivity,
        captchaDetected
      });
    } catch (error) {
      console.error(`Error getting status for session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Get current page content
app.get('/api/puppeteer/session/:sessionId/content', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Get page HTML content
      const content = await session.page.content();
      
      // Update last activity
      session.lastActivity = new Date();
      
      res.status(200).json({
        content,
        url: session.url
      });
    } catch (error) {
      console.error(`Error getting page content for session ${sessionId}:`, error);
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
      
      // Take a screenshot with optimized settings for faster transfer
      const screenshotOptions = {
        path: path.join(screenshotsDir, `${sessionId}-${Date.now()}.png`),
        type: 'png',
        fullPage: false,
        quality: 80,
        omitBackground: false
      };
      
      const screenshotBuffer = await session.page.screenshot(screenshotOptions);
      
      // Update last activity
      session.lastActivity = new Date();
      
      // Set appropriate headers
      res.set('Content-Type', 'image/png');
      res.set('Content-Length', screenshotBuffer.length);
      
      // Send the screenshot
      res.send(screenshotBuffer);
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
      
      console.log(`🌐 Navigating to URL: ${formattedUrl}`);
      
      // Navigate to URL with timeout and waiting for network
      await session.page.goto(formattedUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Update session data
      session.lastActivity = new Date();
      session.url = formattedUrl;
      session.status = 'navigated';
      session.performance.navigationCount++;
      
      // Check for CAPTCHA
      const captchaDetected = await detectCaptcha(session.page);
      
      if (captchaDetected) {
        console.log('🛡️ CAPTCHA detected during navigation! Taking evasive action...');
        const evaded = await evadeCaptcha(session.page);
        
        if (evaded) {
          // Get new URL after evasion
          const newUrl = await session.page.url();
          session.url = newUrl;
          
          console.log(`✅ Navigation completed after CAPTCHA evasion: ${newUrl}`);
          
          return res.status(200).json({
            status: 'navigated_with_captcha_evasion',
            url: newUrl,
            captchaDetected: true,
            captchaEvaded: true
          });
        } else {
          // Could not evade, warn client
          return res.status(200).json({
            status: 'captcha_detected',
            url: formattedUrl,
            captchaDetected: true,
            captchaEvaded: false
          });
        }
      }
      
      console.log(`✅ Navigation complete: ${formattedUrl}`);
      
      res.status(200).json({
        status: 'navigated',
        url: formattedUrl
      });
    } catch (error) {
      console.error(`Error navigating to URL in session ${sessionId}:`, error);
      
      // Attempt to recover and return what we can
      try {
        const session = sessions.get(sessionId);
        const currentUrl = await session.page.url();
        
        // Return an error but also the current URL for the client to know where we ended up
        res.status(200).json({ 
          status: 'navigation_error',
          error: error.message,
          url: currentUrl || url
        });
      } catch {
        res.status(500).json({ error: error.message });
      }
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Execute a browser action with error resilience
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
      
      console.log(`🎮 Executing action: ${action.type} - ${action.description || ''}`);
      
      // Track this action
      session.actions.push({
        type: action.type,
        time: new Date(),
        description: action.description
      });
      
      // Execute the appropriate action with enhanced error handling
      let actionResult = { success: false, message: '' };
      
      switch (action.type) {
        case 'navigate':
          if (!action.url) {
            return res.status(400).json({ error: 'URL is required for navigate action' });
          }
          
          try {
            let formattedUrl = action.url;
            if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
              formattedUrl = 'https://' + formattedUrl;
            }
            
            console.log(`🌐 Navigating to: ${formattedUrl}`);
            
            await session.page.goto(formattedUrl, {
              waitUntil: 'networkidle2',
              timeout: 30000
            });
            
            console.log(`✅ Navigation complete: ${formattedUrl}`);
            
            session.url = formattedUrl;
            session.performance.navigationCount++;
            actionResult = { success: true, message: 'Navigation successful' };
          } catch (navError) {
            console.error(`Navigation error:`, navError);
            actionResult = { success: false, message: `Navigation error: ${navError.message}` };
          }
          break;
          
        case 'click':
          try {
            if (action.selector) {
              try {
                await session.page.waitForSelector(action.selector, { timeout: 5000 });
                
                // Enhanced real-world clicking behavior
                const element = await session.page.$(action.selector);
                if (element) {
                  // Get element position for realistic click
                  const box = await element.boundingBox();
                  if (box) {
                    // Click in the middle of the element
                    await session.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                    await session.page.mouse.down();
                    await new Promise(r => setTimeout(r, Math.random() * 100 + 50)); // Human-like click
                    await session.page.mouse.up();
                  } else {
                    // Fallback to standard click
                    await session.page.click(action.selector);
                  }
                  
                  console.log(`✅ Clicked element: ${action.selector}`);
                  actionResult = { success: true, message: 'Click successful' };
                } else {
                  throw new Error(`Element not found: ${action.selector}`);
                }
              } catch (clickError) {
                console.log(`Primary click failed, trying alternatives...`);
                
                // Try JavaScript click as fallback
                const jsClickSuccess = await session.page.evaluate((selector) => {
                  const element = document.querySelector(selector);
                  if (element) {
                    element.click();
                    return true;
                  }
                  return false;
                }, action.selector);
                
                if (jsClickSuccess) {
                  console.log(`✅ Clicked via JavaScript: ${action.selector}`);
                  actionResult = { success: true, message: 'JavaScript click successful' };
                } else {
                  throw new Error(`Could not find or click element: ${action.selector}`);
                }
              }
            } else if (action.text) {
              // Find element by text
              console.log(`🔍 Searching for clickable element with text: "${action.text}"`);
              
              const clickedByText = await session.page.evaluate((searchText) => {
                // Enhanced text search
                const elements = [
                  ...document.querySelectorAll('a, button, [role="button"], input[type="submit"], [role="link"], .btn'),
                  ...document.querySelectorAll('div[onclick], span[onclick], p[onclick]')
                ];
                
                const lowerSearchText = searchText.toLowerCase();
                
                for (const el of elements) {
                  const text = el.innerText || el.textContent || el.value || '';
                  if (text.toLowerCase().includes(lowerSearchText)) {
                    el.click();
                    return { success: true, element: el.tagName };
                  }
                }
                
                // Try partial matches
                for (const el of elements) {
                  const text = el.innerText || el.textContent || el.value || '';
                  const words = lowerSearchText.split(' ');
                  if (words.some(word => text.toLowerCase().includes(word) && word.length > 3)) {
                    el.click();
                    return { success: true, element: el.tagName, partial: true };
                  }
                }
                
                return { success: false };
              }, action.text);
              
              if (clickedByText.success) {
                console.log(`✅ Clicked element with ${clickedByText.partial ? 'partial ' : ''}text match: ${action.text}`);
                actionResult = { 
                  success: true, 
                  message: `Clicked ${clickedByText.element} with text: ${action.text}` 
                };
              } else {
                console.log(`⚠️ Could not find element with text: ${action.text}`);
                actionResult = { 
                  success: false, 
                  message: `Could not find element with text: ${action.text}` 
                };
              }
            } else {
              return res.status(400).json({ error: 'Selector or text is required for click action' });
            }
            
            session.performance.clickCount++;
            
            // Wait for potential page load
            try {
              await session.page.waitForNavigation({ timeout: 5000, waitUntil: 'networkidle0' });
            } catch (navTimeoutError) {
              // This is fine, might not navigate
              console.log('No navigation after click - continuing');
            }
          } catch (clickActionError) {
            console.error(`Click error:`, clickActionError);
            actionResult = { success: false, message: `Click error: ${clickActionError.message}` };
          }
          break;
          
        case 'type':
          try {
            if (!action.selector) {
              return res.status(400).json({ error: 'Selector is required for type action' });
            }
            if (action.text === undefined || action.text === null) {
              return res.status(400).json({ error: 'Text is required for type action' });
            }
            
            // Special handling for Google search box
            if (action.selector === 'input[name="q"]' || 
                action.selector.includes('search') || 
                action.selector.includes('query')) {
              
              console.log(`🔍 Special handling for search input`);
              
              // Try multiple selector strategies
              const searchBoxSelectors = [
                'input[name="q"]',
                'input[title="Search"]',
                'input.gLFyf',
                'textarea[name="q"]',
                'input[type="search"]',
                'input.search-box',
                'input.searchbox',
                'input#search',
                '[role="search"] input'
              ];
              
              let typeSuccess = false;
              
              for (const selector of searchBoxSelectors) {
                try {
                  const elementExists = await session.page.evaluate(
                    selector => !!document.querySelector(selector),
                    selector
                  );
                  
                  if (elementExists) {
                    // Focus on the element first
                    await session.page.focus(selector);
                    
                    // Clear existing text
                    await session.page.evaluate(
                      selector => { document.querySelector(selector).value = '' },
                      selector
                    );
                    
                    // Human-like typing with variable delays
                    await session.page.type(selector, action.text, { 
                      delay: Math.floor(Math.random() * 100) + 30 // Random delay between 30-130ms
                    });
                    
                    console.log(`✅ Typed text into ${selector}: "${action.text}"`);
                    typeSuccess = true;
                    actionResult = { success: true, message: `Typed text into ${selector}` };
                    break;
                  }
                } catch (selectorError) {
                  // Try next selector
                  console.log(`Selector ${selector} failed, trying next one...`);
                }
              }
              
              // If all selectors failed, try direct JavaScript injection
              if (!typeSuccess) {
                console.log(`All selectors failed, trying JavaScript injection...`);
                
                typeSuccess = await session.page.evaluate((text) => {
                  const inputs = document.querySelectorAll('input, textarea');
                  for (const input of inputs) {
                    if (input.type !== 'hidden' && input.offsetParent !== null) {
                      input.value = text;
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                      return true;
                    }
                  }
                  return false;
                }, action.text);
                
                if (typeSuccess) {
                  console.log(`✅ Typed text via JavaScript injection`);
                  actionResult = { success: true, message: 'Typed text via JavaScript' };
                } else {
                  actionResult = { success: false, message: 'Could not find search input' };
                }
              }
            } else {
              // Regular input fields
              try {
                await session.page.waitForSelector(action.selector, { timeout: 5000 });
                
                // Focus on the element first
                await session.page.focus(action.selector);
                
                // Clear existing text
                await session.page.evaluate(
                  selector => { document.querySelector(selector).value = '' },
                  action.selector
                );
                
                // Human-like typing with variable delays
                await session.page.type(action.selector, action.text, { 
                  delay: Math.floor(Math.random() * 100) + 30 // Random delay between 30-130ms
                });
                
                console.log(`✅ Typed text: "${action.text}"`);
                actionResult = { success: true, message: 'Typed text successfully' };
              } catch (typeError) {
                console.log(`Standard typing failed, trying JavaScript injection...`);
                
                // Fallback to JavaScript injection
                const typeSuccess = await session.page.evaluate(
                  (selector, text) => {
                    const el = document.querySelector(selector);
                    if (el) {
                      el.value = text;
                      el.dispatchEvent(new Event('input', { bubbles: true }));
                      return true;
                    }
                    return false;
                  },
                  action.selector,
                  action.text
                );
                
                if (typeSuccess) {
                  console.log(`✅ Typed text via JavaScript injection`);
                  actionResult = { success: true, message: 'Typed text via JavaScript' };
                } else {
                  actionResult = { success: false, message: `Could not find element ${action.selector}` };
                }
              }
            }
            
            session.performance.typeCount++;
          } catch (typeActionError) {
            console.error(`Type error:`, typeActionError);
            actionResult = { success: false, message: `Typing error: ${typeActionError.message}` };
          }
          break;
          
        case 'scroll':
          // Scroll the page
          try {
            const direction = action.direction || 'down';
            const amount = action.amount || 500;
            
            console.log(`📜 Scrolling ${direction}: ${amount}px`);
            
            if (direction === 'down') {
              await session.page.evaluate((scrollAmount) => {
                window.scrollBy({
                  top: scrollAmount,
                  behavior: 'smooth'
                });
              }, amount);
            } else if (direction === 'up') {
              await session.page.evaluate((scrollAmount) => {
                window.scrollBy({
                  top: -scrollAmount,
                  behavior: 'smooth'
                });
              }, amount);
            }
            
            // Small delay to allow smooth scrolling to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log(`✅ Scroll complete`);
            actionResult = { success: true, message: `Scrolled ${direction}: ${amount}px` };
          } catch (scrollError) {
            console.error(`Scroll error:`, scrollError);
            actionResult = { success: false, message: `Scroll error: ${scrollError.message}` };
          }
          break;
          
        case 'submit':
          // Submit a form
          try {
            if (!action.selector) {
              return res.status(400).json({ error: 'Selector is required for submit action' });
            }
            
            console.log(`📝 Submitting form: ${action.selector}`);
            
            // Try direct form submission first
            const submitSuccess = await session.page.evaluate((selector) => {
              const form = document.querySelector(selector);
              if (form) {
                form.submit();
                return true;
              }
              return false;
            }, action.selector);
            
            if (!submitSuccess) {
              // Try clicking a submit button inside the form
              const clickSuccess = await session.page.evaluate((selector) => {
                const form = document.querySelector(selector);
                if (form) {
                  const submitButton = form.querySelector('input[type="submit"], button[type="submit"], button:not([type])');
                  if (submitButton) {
                    submitButton.click();
                    return true;
                  }
                }
                return false;
              }, action.selector);
              
              if (clickSuccess) {
                console.log(`✅ Clicked submit button in form`);
                actionResult = { success: true, message: 'Clicked submit button' };
              } else {
                console.log(`⚠️ Could not submit form: ${action.selector}`);
                actionResult = { success: false, message: `Could not submit form: ${action.selector}` };
              }
            } else {
              console.log(`✅ Form submitted`);
              actionResult = { success: true, message: 'Form submitted successfully' };
            }
            
            // Wait for navigation after form submission
            try {
              await session.page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle2' });
            } catch (navTimeoutError) {
              // This is fine, might not navigate
              console.log('No navigation after form submission - continuing');
            }
          } catch (submitError) {
            console.error(`Submit error:`, submitError);
            actionResult = { success: false, message: `Submit error: ${submitError.message}` };
          }
          break;
          
        case 'wait':
          // Wait for a specified duration
          try {
            const duration = action.duration || 1000;
            
            console.log(`⏱️ Waiting for ${duration}ms`);
            
            await new Promise(resolve => setTimeout(resolve, duration));
            
            console.log(`✅ Wait complete`);
            actionResult = { success: true, message: `Waited for ${duration}ms` };
          } catch (waitError) {
            console.error(`Wait error:`, waitError);
            actionResult = { success: false, message: `Wait error: ${waitError.message}` };
          }
          break;
          
        default:
          return res.status(400).json({ error: `Unknown action type: ${action.type}` });
      }
      
      // Check for CAPTCHA after action
      try {
        const captchaDetected = await detectCaptcha(session.page);
        if (captchaDetected) {
          console.log('🛡️ CAPTCHA detected after action! Taking evasive action...');
          
          // Try to evade CAPTCHA
          const evaded = await evadeCaptcha(session.page);
          
          // Update current URL after evasion
          const currentUrl = await session.page.url();
          session.url = currentUrl;
          
          res.status(200).json({
            status: 'action_completed_with_captcha',
            action: action.type,
            url: currentUrl,
            result: actionResult,
            captchaDetected: true,
            captchaEvaded: evaded
          });
          return;
        }
      } catch (captchaError) {
        console.error('Error checking for CAPTCHA:', captchaError);
      }
      
      // Take a screenshot after action
      try {
        const screenshotPath = path.join(screenshotsDir, `${sessionId}-${Date.now()}.png`);
        await session.page.screenshot({ path: screenshotPath, fullPage: false });
      } catch (screenshotError) {
        console.error('Error taking screenshot after action:', screenshotError);
      }
      
      // Get current URL after action
      const currentUrl = await session.page.url();
      session.url = currentUrl;
      
      console.log(`✅ Action execution complete: ${action.type}`);
      
      res.status(200).json({
        status: 'action_completed',
        action: action.type,
        url: currentUrl,
        result: actionResult
      });
    } catch (error) {
      console.error(`Error executing action in session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// CAPTCHA handling endpoint
app.post('/api/puppeteer/session/:sessionId/handle-captcha', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      console.log(`🛡️ Attempting to handle CAPTCHA for session: ${sessionId}`);
      
      // Verify CAPTCHA is present
      const captchaDetected = await detectCaptcha(session.page);
      
      if (captchaDetected) {
        // Try to evade CAPTCHA
        const evaded = await evadeCaptcha(session.page);
        
        if (evaded) {
          // Get current URL after evasion
          const currentUrl = await session.page.url();
          session.url = currentUrl;
          
          console.log(`✅ CAPTCHA evasion successful`);
          
          res.status(200).json({
            status: 'captcha_evaded',
            url: currentUrl
          });
        } else {
          console.log(`⚠️ CAPTCHA evasion failed`);
          
          res.status(200).json({
            status: 'captcha_evasion_failed',
            url: session.url
          });
        }
      } else {
        console.log(`ℹ️ No CAPTCHA detected`);
        
        res.status(200).json({
          status: 'no_captcha_detected',
          url: session.url
        });
      }
    } catch (error) {
      console.error(`Error handling CAPTCHA for session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Cleanup inactive sessions
const cleanupInactiveSessions = async () => {
  console.log("🧹 Checking for inactive sessions...");
  const now = new Date();
  const MAX_IDLE_TIME = 30 * 60 * 1000; // 30 minutes
  let cleanedCount = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    const idleTime = now.getTime() - session.lastActivity.getTime();
    
    if (idleTime > MAX_IDLE_TIME) {
      try {
        console.log(`🧹 Cleaning up inactive session: ${sessionId}`);
        await session.browser.close();
        sessions.delete(sessionId);
        cleanedCount++;
      } catch (error) {
        console.error(`Error cleaning up session ${sessionId}:`, error);
      }
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} inactive sessions`);
  }
};

// Run cleanup every 15 minutes
setInterval(cleanupInactiveSessions, 15 * 60 * 1000);

// Start the server
app.listen(port, () => {
  console.log(`🚀 Puppeteer server running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  
  // Close all browser sessions
  for (const [sessionId, session] of sessions.entries()) {
    try {
      await session.browser.close();
      console.log(`🛑 Closed browser session: ${sessionId}`);
    } catch (error) {
      console.error(`Error closing browser session ${sessionId}:`, error);
    }
  }
  
  process.exit(0);
});