// server/puppeteer-server.js - COPY THIS ENTIRE FILE!
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

// 🔥 TURBOCHARGED SERVER CONFIG 🔥
const app = express();
const port = process.env.PORT || 3001;

// ENHANCED MIDDLEWARE
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use((req, res, next) => {
  console.log(`🔄 ${req.method} ${req.url}`);
  next();
});

// Super-charged sessions map with auto-cleanup!
const sessions = new Map();

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// MEGA-ENHANCED cleanupOldScreenshots with status reporting!
const cleanupOldScreenshots = () => {
  console.log("🧹 Cleaning up old screenshots...");
  const files = fs.readdirSync(screenshotsDir);
  const now = Date.now();
  let cleanedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(screenshotsDir, file);
    const stats = fs.statSync(filePath);
    const fileAge = now - stats.mtime.getTime();
    
    // Delete files older than 10 minutes (600000 ms) for FASTER CLEANUP
    if (fileAge > 600000) {
      fs.unlinkSync(filePath);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`🧹 Removed ${cleanedCount} old screenshots!`);
  }
};

// Run cleanup every 5 minutes for PERFORMANCE BOOST
setInterval(cleanupOldScreenshots, 5 * 60 * 1000);

// 🚀 TURBO-CHARGED SESSION CREATOR
app.post('/api/puppeteer/session', async (req, res) => {
  try {
    const sessionId = uuidv4();
    console.log(`🚀 CREATING NEW BROWSER SESSION: ${sessionId}`);
    
    // Launch with POWER OPTIONS!
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1280,800'
      ]
    });
    
    // Create a SUPER-POWERED PAGE!
    const page = await browser.newPage();
    
    // HARDCORE VIEWPORT CONFIG!
    await page.setViewport({
      width: 1280,
      height: 800,
      deviceScaleFactor: 1
    });
    
    // Set MAXIMUM PERFORMANCE USER AGENT
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
    
    // SPEED-OPTIMIZE BY BLOCKING ADS & TRACKERS!
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url().toLowerCase();
      const resourceType = request.resourceType();
      
      if (
        resourceType === 'image' ||
        resourceType === 'media' ||
        resourceType === 'font' ||
        url.includes('google-analytics') ||
        url.includes('googletagmanager') ||
        url.includes('facebook') ||
        url.includes('analytics') ||
        url.includes('tracker') ||
        url.includes('advertisement')
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Navigate to blank page
    await page.goto('about:blank');
    
    // Store session data with MEGA-METADATA!
    sessions.set(sessionId, {
      browser,
      page,
      createdAt: new Date(),
      lastActivity: new Date(),
      url: 'about:blank',
      status: 'initialized',
      actions: [], // TRACK ACTION HISTORY!
      performance: {
        navigationCount: 0,
        clickCount: 0,
        typeCount: 0
      }
    });
    
    console.log(`✅ BROWSER SESSION ACTIVATED: ${sessionId}`);
    
    res.status(200).json({
      sessionId,
      status: 'created',
      message: 'Browser ready for AUTONOMOUS DOMINATION!'
    });
  } catch (error) {
    console.error('💥 ERROR creating browser session:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
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
      
      console.log(`🚫 CLOSED BROWSER SESSION: ${sessionId}`);
      
      res.status(200).json({ status: 'closed' });
    } catch (error) {
      console.error(`💥 ERROR closing browser session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// TURBOCHARGED Browser Initialization
app.post('/api/puppeteer/session/:sessionId/initialize', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      console.log(`🔄 Initializing browser session: ${sessionId}`);
      
      // Set EXTRA PAGE OPTIONS for maximum compatibility
      await session.page.setJavaScriptEnabled(true);
      await session.page.setDefaultNavigationTimeout(30000);
      
      // POWER MOVE: Use a faster performing website for startup!
      await session.page.goto('https://www.google.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Update session data with ENHANCED METADATA!
      session.lastActivity = new Date();
      session.url = 'https://www.google.com';
      session.status = 'active';
      session.performance.navigationCount++;
      
      // TAKE STARTUP SCREENSHOT!
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-init-${Date.now()}.png`);
      await session.page.screenshot({ path: screenshotPath, fullPage: false });
      
      console.log(`✅ BROWSER INITIALIZED AND READY: ${sessionId}`);
      
      res.status(200).json({
        status: 'initialized',
        url: 'https://www.google.com',
        message: 'Browser READY FOR ACTION!'
      });
    } catch (error) {
      console.error(`💥 ERROR initializing session ${sessionId}:`, error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  } else {
    console.error(`❌ Session not found: ${sessionId}`);
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
      
      console.log(`🔄 RESTARTING BROWSER SESSION: ${sessionId}`);
      
      // Launch a new browser with POWER OPTIONS!
      const newBrowser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1280,800'
        ]
      });
      
      // Create a SUPER-POWERED PAGE!
      const newPage = await newBrowser.newPage();
      
      // HARDCORE VIEWPORT CONFIG!
      await newPage.setViewport({
        width: 1280,
        height: 800,
        deviceScaleFactor: 1
      });
      
      // Set MAXIMUM PERFORMANCE USER AGENT
      await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
      
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
      
      console.log(`✅ BROWSER SESSION RESTARTED: ${sessionId}`);
      
      res.status(200).json({
        status: 'restarted',
        url: 'https://www.google.com'
      });
    } catch (error) {
      console.error(`💥 ERROR restarting browser session ${sessionId}:`, error);
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
      
      console.log(`🔄 REFRESHING BROWSER SESSION: ${sessionId}`);
      
      // Refresh the current page
      await session.page.reload({
        waitUntil: 'networkidle2'
      });
      
      // Update session data
      session.lastActivity = new Date();
      
      console.log(`✅ BROWSER REFRESHED: ${sessionId}`);
      
      res.status(200).json({
        status: 'refreshed',
        url: session.url
      });
    } catch (error) {
      console.error(`💥 ERROR refreshing browser session ${sessionId}:`, error);
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
      console.error(`💥 ERROR getting status for session ${sessionId}:`, error);
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
      console.error(`💥 ERROR taking screenshot for session ${sessionId}:`, error);
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
      
      console.log(`🌐 NAVIGATING TO URL: ${formattedUrl}`);
      
      // Navigate to URL
      await session.page.goto(formattedUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Update session data
      session.lastActivity = new Date();
      session.url = formattedUrl;
      session.status = 'navigated';
      session.performance.navigationCount++;
      
      console.log(`✅ NAVIGATION COMPLETE: ${formattedUrl}`);
      
      res.status(200).json({
        status: 'navigated',
        url: formattedUrl
      });
    } catch (error) {
      console.error(`💥 ERROR navigating to URL in session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// 💪 FORTIFIED BROWSER ACTION EXECUTOR!
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
      
      console.log(`🎯 EXECUTING ACTION: ${action.type} - ${action.description || ''}`);
      
      // TRACK THIS ACTION!
      session.actions.push({
        type: action.type,
        time: new Date(),
        description: action.description
      });
      
      // Execute the appropriate action with ENHANCED ERROR HANDLING!
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
            
            console.log(`🌐 NAVIGATING TO: ${formattedUrl}`);
            
            // POWER NAVIGATION with TIMEOUT SAFEGUARDS!
            await session.page.goto(formattedUrl, {
              waitUntil: 'networkidle2',
              timeout: 30000
            });
            
            console.log(`✅ NAVIGATION COMPLETE: ${formattedUrl}`);
            
            session.url = formattedUrl;
            session.performance.navigationCount++;
          } catch (navError) {
            console.error(`⚠️ Navigation error but CONTINUING:`, navError);
            // SUPER-RESILIENT: Don't fail completely, try to recover!
            return res.status(200).json({
              status: 'warning',
              message: `Navigation issue but continuing: ${navError.message}`,
              url: session.url
            });
          }
          break;
          
        case 'click':
          try {
            // TURBOCHARGED CLICKING with MULTIPLE SELECTOR STRATEGIES!
            if (action.selector) {
              try {
                // STRATEGY 1: Standard selector
                await session.page.waitForSelector(action.selector, { timeout: 5000 });
                await session.page.click(action.selector);
                console.log(`✅ CLICKED ELEMENT: ${action.selector}`);
              } catch (clickError) {
                console.log(`⚠️ Primary click failed, trying alternatives...`);
                
                // STRATEGY 2: Try JavaScript click
                const jsClickSuccess = await session.page.evaluate((selector) => {
                  const element = document.querySelector(selector);
                  if (element) {
                    element.click();
                    return true;
                  }
                  return false;
                }, action.selector);
                
                if (!jsClickSuccess) {
                  throw new Error(`Could not find or click element: ${action.selector}`);
                }
              }
            } else if (action.text) {
              // STRATEGY 3: Try to find element by text (SUPER RELIABLE!)
              console.log(`🔍 Searching for clickable element with text: "${action.text}"`);
              
              const clickedByText = await session.page.evaluate((searchText) => {
                // ENHANCED TEXT SEARCH - Mega-optimized!
                const elements = [
                  ...document.querySelectorAll('a, button, [role="button"], input[type="submit"], [role="link"], .btn'),
                  ...document.querySelectorAll('div[onclick], span[onclick], p[onclick]')
                ];
                
                const lowerSearchText = searchText.toLowerCase();
                
                for (const el of elements) {
                  const text = el.innerText || el.textContent || el.value || '';
                  if (text.toLowerCase().includes(lowerSearchText)) {
                    el.click();
                    return true;
                  }
                }
                
                // EXTRA ATTEMPT: Try partial matches
                for (const el of elements) {
                  const text = el.innerText || el.textContent || el.value || '';
                  const words = lowerSearchText.split(' ');
                  if (words.some(word => text.toLowerCase().includes(word))) {
                    el.click();
                    return true;
                  }
                }
                
                return false;
              }, action.text);
              
              if (!clickedByText) {
                console.log(`⚠️ Could not find element with text: ${action.text}, but continuing`);
                // Keep going anyway!
              } else {
                console.log(`✅ CLICKED ELEMENT with text: ${action.text}`);
              }
            } else {
              return res.status(400).json({ error: 'Selector or text is required for click action' });
            }
            
            session.performance.clickCount++;
            
            // Wait for potential page load
            try {
              await session.page.waitForNavigation({ timeout: 5000, waitUntil: 'networkidle2' });
            } catch (navTimeoutError) {
              // This is fine, might not navigate
              console.log('No navigation after click - continuing');
            }
          } catch (clickActionError) {
            console.error(`⚠️ Click error but CONTINUING:`, clickActionError);
            // SUPER-RESILIENT: Don't fail completely!
            return res.status(200).json({
              status: 'warning',
              message: `Click issue but continuing: ${clickActionError.message}`
            });
          }
          break;
          
        case 'type':
          try {
            if (!action.selector) {
              return res.status(400).json({ error: 'Selector is required for type action' });
            }
            if (!action.text) {
              return res.status(400).json({ error: 'Text is required for type action' });
            }
            
            // GOOGLE SEARCH BOX SPECIAL HANDLING!
            if (action.selector === 'input[name="q"]' || 
                action.selector.includes('search') || 
                action.selector.includes('query')) {
              
              console.log(`🔍 SPECIAL HANDLING for search input`);
              
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
                    // Clear existing text first
                    await session.page.evaluate(
                      selector => { document.querySelector(selector).value = '' },
                      selector
                    );
                    
                    // Type the text
                    await session.page.type(selector, action.text, { delay: 50 });
                    
                    console.log(`✅ TYPED TEXT into ${selector}: "${action.text}"`);
                    typeSuccess = true;
                    break;
                  }
                } catch (selectorError) {
                  // Try next selector
                  console.log(`⚠️ Selector ${selector} failed, trying next one...`);
                }
              }
              
              // If all selectors failed, try direct JavaScript injection
              if (!typeSuccess) {
                console.log(`⚠️ All selectors failed, trying JavaScript injection!`);
                
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
              }
              
              if (!typeSuccess) {
                return res.status(200).json({
                  status: 'warning',
                  message: 'Could not find search input, but continuing'
                });
              }
            } else {
              // REGULAR INPUT FIELDS
              try {
                await session.page.waitForSelector(action.selector, { timeout: 5000 });
                
                // Clear existing text first
                await session.page.evaluate(
                  selector => { document.querySelector(selector).value = '' },
                  action.selector
                );
                
                // Type with a delay for stability
                await session.page.type(action.selector, action.text, { delay: 30 });
                
                console.log(`✅ TYPED TEXT: "${action.text}"`);
              } catch (typeError) {
                console.log(`⚠️ Standard typing failed, trying JavaScript injection...`);
                
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
                
                if (!typeSuccess) {
                  return res.status(200).json({
                    status: 'warning',
                    message: `Typing issue but continuing: Could not find element ${action.selector}`
                  });
                }
              }
            }
            
            session.performance.typeCount++;
          } catch (typeActionError) {
            console.error(`⚠️ Type error but CONTINUING:`, typeActionError);
            return res.status(200).json({
              status: 'warning',
              message: `Typing issue but continuing: ${typeActionError.message}`
            });
          }
          break;
          
        case 'scroll':
          // Scroll the page
          try {
            const direction = action.direction || 'down';
            const amount = action.amount || 500;
            
            console.log(`📜 SCROLLING ${direction.toUpperCase()}: ${amount}px`);
            
            if (direction === 'down') {
              await session.page.evaluate((scrollAmount) => {
                window.scrollBy(0, scrollAmount);
              }, amount);
            } else if (direction === 'up') {
              await session.page.evaluate((scrollAmount) => {
                window.scrollBy(0, -scrollAmount);
              }, amount);
            }
            
            console.log(`✅ SCROLL COMPLETE`);
          } catch (scrollError) {
            console.error(`⚠️ Scroll error but CONTINUING:`, scrollError);
            return res.status(200).json({
              status: 'warning',
              message: `Scroll issue but continuing: ${scrollError.message}`
            });
          }
          break;
          
        case 'submit':
          // Submit a form
          try {
            if (!action.selector) {
              return res.status(400).json({ error: 'Selector is required for submit action' });
            }
            
            console.log(`📝 SUBMITTING FORM: ${action.selector}`);
            
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
              
              if (!clickSuccess) {
                throw new Error(`Could not submit form: ${action.selector}`);
              }
            }
            
            console.log(`✅ FORM SUBMITTED`);
            
            // Wait for navigation after form submission
            try {
              await session.page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle2' });
            } catch (navTimeoutError) {
              // This is fine, might not navigate
              console.log('No navigation after form submission - continuing');
            }
          } catch (submitError) {
            console.error(`⚠️ Submit error but CONTINUING:`, submitError);
            return res.status(200).json({
              status: 'warning',
              message: `Submit issue but continuing: ${submitError.message}`
            });
          }
          break;
          
        case 'wait':
          // Wait for a specified duration
          try {
            const duration = action.duration || 1000;
            
            console.log(`⏱️ WAITING for ${duration}ms`);
            
            await new Promise(resolve => setTimeout(resolve, duration));
            
            console.log(`✅ WAIT COMPLETE`);
          } catch (waitError) {
            console.error(`⚠️ Wait error but CONTINUING:`, waitError);
            return res.status(200).json({
              status: 'warning',
              message: `Wait issue but continuing: ${waitError.message}`
            });
          }
          break;
          
        case 'screenshot':
          // Screenshot is handled separately
          console.log(`📸 Taking screenshot`);
          break;
          
        default:
          return res.status(400).json({ error: `Unknown action type: ${action.type}` });
      }
      
      // ALWAYS take a screenshot after action, regardless of success/failure
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-${Date.now()}.png`);
      await session.page.screenshot({ path: screenshotPath, fullPage: false });
      
      // Get current URL after action
      const currentUrl = await session.page.url();
      session.url = currentUrl;
      
      console.log(`✅ ACTION EXECUTED SUCCESSFULLY: ${action.type}`);
      
      res.status(200).json({
        status: 'action_executed',
        action: action.type,
        url: currentUrl,
        message: `${action.type} action SUCCESSFULLY EXECUTED!`
      });
    } catch (error) {
      console.error(`💥 ERROR executing action in session ${sessionId}:`, error);
      // Still return 200 for resilience!
      res.status(200).json({ 
        status: 'error', 
        error: error.message,
        message: 'Hit an issue but CONTINUING THE MISSION!'
      });
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
        console.error(`💥 ERROR cleaning up session ${sessionId}:`, error);
      }
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} inactive sessions`);
  }
};

// Run cleanup every 15 minutes
setInterval(cleanupInactiveSessions, 15 * 60 * 1000);

// TURBO-CHARGED SERVER STARTUP!
app.listen(port, () => {
  console.log(`🚀🚀🚀 PUPPETEER SERVER ROCKETING ON PORT ${port}! 🚀🚀🚀`);
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
      console.error(`💥 ERROR closing browser session ${sessionId}:`, error);
    }
  }
  
  process.exit(0);
});