// server/puppeteer-server.js - HYPER-OPTIMIZED FOR REAL-TIME BROWSING!
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
    
    // Delete files older than 5 minutes (300000 ms) for FASTER CLEANUP
    if (fileAge > 300000) {
      fs.unlinkSync(filePath);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`🧹 Removed ${cleanedCount} old screenshots!`);
  }
};

// Run cleanup every 3 minutes for PERFORMANCE BOOST
setInterval(cleanupOldScreenshots, 3 * 60 * 1000);

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
        '--window-size=1280,800',
        '--enable-features=NetworkService',
        '--disable-features=IsolateOrigins,site-per-process'
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
    
    // Set ADVANCED USER AGENT - ANTI-CAPTCHA TECH!
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36');
    
    // ADDITIONAL ANTI-DETECTION MEASURES
    await page.evaluateOnNewDocument(() => {
      // Override the navigator properties
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      });
      // Add language and platform for extra realism
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'es']
      });
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
    });
    
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
        url.includes('advertisement') ||
        url.includes('captcha') && !url.includes('api/captcha')
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
      },
      // Add streaming capability to capture real-time typing - NEW!
      streaming: {
        isTyping: false,
        currentSelector: null,
        textBuffer: '',
        typingSpeed: 50 // ms per character
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
      
      // ANTI-CAPTCHA PREP
      await session.page.evaluate(() => {
        // Add randomized mouse movements
        let lastMove = Date.now();
        document.addEventListener('mousemove', () => {
          lastMove = Date.now();
        });
        
        // Simulate occasional random mouse movements
        setInterval(() => {
          if (Date.now() - lastMove > 3000) {
            const x = Math.floor(Math.random() * window.innerWidth);
            const y = Math.floor(Math.random() * window.innerHeight);
            const event = new MouseEvent('mousemove', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y
            });
            document.dispatchEvent(event);
          }
        }, 5000);
      });
      
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
          '--window-size=1280,800',
          '--enable-features=NetworkService',
          '--disable-features=IsolateOrigins,site-per-process'
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
      
      // ANTI-DETECTION MEASURES
      await newPage.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false
        });
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en', 'es']
        });
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });
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
        },
        streaming: {
          isTyping: false,
          currentSelector: null,
          textBuffer: '',
          typingSpeed: 50
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
      
      // Get current typing status - NEW!
      const isTyping = session.streaming.isTyping;
      const typingSelector = session.streaming.currentSelector;
      const typingText = session.streaming.textBuffer;
      
      // Update last activity
      session.lastActivity = new Date();
      
      res.status(200).json({
        active: isActive,
        url: currentUrl,
        status: session.status,
        lastActivity: session.lastActivity,
        // NEW: Include real-time typing status
        isTyping,
        typingSelector,
        typingText
      });
    } catch (error) {
      console.error(`💥 ERROR getting status for session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Take a screenshot - ULTRA-FAST VERSION WITH CHANGE DETECTION! 🔥
app.get('/api/puppeteer/session/:sessionId/screenshot', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // NEW: Check if session has lastScreenshotHash to avoid duplicates
      if (!session.lastScreenshotHash) {
        session.lastScreenshotHash = '';
        session.lastScreenshotTime = 0;
        session.consecutiveDuplicates = 0;
      }
      
      // NEW: Skip if too soon (debounce screenshots)
      const now = Date.now();
      const minTimeBetweenScreenshots = 250; // ms
      if (now - session.lastScreenshotTime < minTimeBetweenScreenshots) {
        // If called too frequently, send the previous screenshot or placeholder
        if (session.lastScreenshotPath && fs.existsSync(session.lastScreenshotPath)) {
          return res.sendFile(session.lastScreenshotPath, {}, (err) => {
            if (err) console.error('Error sending cached screenshot:', err);
          });
        }
      }
      
      // Check current page content hash to detect if page actually changed
      const pageContent = await session.page.evaluate(() => {
        // Get simplified DOM to detect real changes
        return document.body.innerHTML.replace(/\s+/g, ' ').trim().slice(0, 1000);
      });
      
      // Generate simple hash of page content
      const crypto = require('crypto');
      const contentHash = crypto.createHash('md5').update(pageContent).digest('hex');
      
      // If content hasn't changed and not forced, reuse last screenshot
      if (contentHash === session.lastScreenshotHash && 
          session.lastScreenshotPath && 
          fs.existsSync(session.lastScreenshotPath) &&
          !req.query.force) {
          
        session.consecutiveDuplicates++;
        
        // Only log every few duplicates to reduce noise
        if (session.consecutiveDuplicates % 5 === 0) {
          console.log(`📸 Skipping identical screenshot (${session.consecutiveDuplicates} consecutive duplicates)`);
        }
        
        // After too many duplicates, force a new screenshot anyway as failsafe
        if (session.consecutiveDuplicates > 15) {
          console.log(`📸 Forcing new screenshot after ${session.consecutiveDuplicates} duplicates`);
        } else {
          // Send the previous screenshot
          session.lastScreenshotTime = now;
          return res.sendFile(session.lastScreenshotPath, {}, (err) => {
            if (err) console.error('Error sending cached screenshot:', err);
          });
        }
      }
      
      // If content changed, take a new screenshot
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-${Date.now()}.png`);
      await session.page.screenshot({ 
        path: screenshotPath, 
        fullPage: false,
        quality: 75,  // Lower quality = faster transfer
        type: 'jpeg'  // JPEG is faster than PNG
      });
      
      // Update cache information
      session.lastScreenshotHash = contentHash;
      session.lastScreenshotPath = screenshotPath;
      session.lastScreenshotTime = now;
      session.lastActivity = new Date();
      session.consecutiveDuplicates = 0;
      
      // Send the screenshot file
      res.sendFile(screenshotPath, {}, (err) => {
        if (err) {
          console.error('Error sending screenshot:', err);
        }
      });
    } catch (error) {
      console.error(`💥 ERROR taking screenshot for session ${sessionId}:`, error);
      
      // Attempt to send a previous screenshot rather than failing
      const session = sessions.get(sessionId);
      if (session?.lastScreenshotPath && fs.existsSync(session.lastScreenshotPath)) {
        return res.sendFile(session.lastScreenshotPath, {}, (err) => {
          if (err) console.error('Error sending fallback screenshot:', err);
        });
      } else {
        res.status(500).json({ error: error.message });
      }
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
      
      // ADVANCED ANTI-CAPTCHA NAVIGATION
      await session.page.evaluateOnNewDocument(() => {
        window.navigator.chrome = {
          runtime: {}
        };
        
        // Randomize screen dimensions slightly
        Object.defineProperty(window.screen, 'width', {
          get: function() { return 1280 + Math.floor(Math.random() * 20); }
        });
        Object.defineProperty(window.screen, 'height', {
          get: function() { return 800 + Math.floor(Math.random() * 20); }
        });
        
        // Simulate real browser behavior
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      });
      
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

// 💪 FORTIFIED BROWSER ACTION EXECUTOR - ENHANCED FOR REALTIME ACTIONS!
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
                // STRATEGY 1: Standard selector - WITH VISUAL CURSOR EFFECT!
                await session.page.waitForSelector(action.selector, { timeout: 5000 });
                
                // NEW! Add visual clicking effect by adding a temporary highlight!
                await session.page.evaluate((selector) => {
                  const element = document.querySelector(selector);
                  if (element) {
                    // Save original styles
                    const originalOutline = element.style.outline;
                    const originalTransition = element.style.transition;
                    
                    // Add highlight effect
                    element.style.outline = '3px solid #ff5733';
                    element.style.transition = 'all 0.3s ease';
                    
                    // Revert after a delay
                    setTimeout(() => {
                      element.style.outline = originalOutline;
                      element.style.transition = originalTransition;
                    }, 500);
                  }
                }, action.selector);
                
                // PERFORM HUMANLIKE CLICK with small delays
                await session.page.hover(action.selector);
                await new Promise(r => setTimeout(r, 100 + Math.random() * 200));
                await session.page.click(action.selector);
                console.log(`✅ CLICKED ELEMENT: ${action.selector}`);
              } catch (clickError) {
                console.log(`⚠️ Primary click failed, trying alternatives...`);
                
                // STRATEGY 2: Try JavaScript click
                const jsClickSuccess = await session.page.evaluate((selector) => {
                  const element = document.querySelector(selector);
                  if (element) {
                    // Visual click effect
                    const originalBackgroundColor = element.style.backgroundColor;
                    element.style.backgroundColor = 'rgba(255, 87, 51, 0.3)';
                    
                    // Click with delay
                    setTimeout(() => {
                      element.style.backgroundColor = originalBackgroundColor;
                      element.click();
                    }, 200);
                    
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
                    // Add visual click effect
                    const originalOutline = el.style.outline;
                    el.style.outline = '3px solid #ff5733';
                    
                    // Click with delay
                    setTimeout(() => {
                      el.style.outline = originalOutline;
                      el.click();
                    }, 200);
                    
                    return true;
                  }
                }
                
                // EXTRA ATTEMPT: Try partial matches
                for (const el of elements) {
                  const text = el.innerText || el.textContent || el.value || '';
                  const words = lowerSearchText.split(' ');
                  if (words.some(word => text.toLowerCase().includes(word))) {
                    // Add visual click effect
                    const originalOutline = el.style.outline;
                    el.style.outline = '3px solid #ff5733';
                    
                    // Click with delay
                    setTimeout(() => {
                      el.style.outline = originalOutline;
                      el.click();
                    }, 200);
                    
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
            
            // Set up session streaming status for REAL-TIME TYPING!
            session.streaming.isTyping = true;
            session.streaming.currentSelector = action.selector;
            session.streaming.textBuffer = '';
            
            // GOOGLE SEARCH BOX SPECIAL HANDLING - SUPERCHARGED! 🔥
            if (action.selector === 'input[name="q"]' || 
                action.selector.includes('search') || 
                action.selector.includes('query')) {
              
              console.log(`🔍 SPECIAL HANDLING for search input: "${action.text}"`);
              
              // TURBOCHARGED GOOGLE SEARCH HANDLING!
              try {
                // ULTRA-RELIABLE DIRECT INJECTION APPROACH
                const injectionSuccess = await session.page.evaluate((searchText) => {
                  try {
                    // Look for ANY visible input that might be a search box
                    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea'));
                    const searchInputs = inputs.filter(el => {
                      const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
                      const isSearchLike = (
                        el.name === 'q' || 
                        el.id?.includes('search') || 
                        el.placeholder?.toLowerCase().includes('search') ||
                        el.className?.toLowerCase().includes('search') ||
                        el.ariaLabel?.toLowerCase().includes('search')
                      );
                      
                      return isVisible && isSearchLike;
                    });
                    
                    if (searchInputs.length > 0) {
                      // Found a search input!
                      const searchInput = searchInputs[0];
                      
                      // Focus with dramatic effect
                      searchInput.focus();
                      searchInput.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.7)';
                      
                      // Clear any existing text
                      searchInput.value = '';
                      
                      // Dispatch focus/select events
                      searchInput.dispatchEvent(new Event('focus', { bubbles: true }));
                      searchInput.dispatchEvent(new Event('select', { bubbles: true }));
                      
                      // Set value directly - INSTANT TYPING!
                      searchInput.value = searchText;
                      
                      // Trigger input events to ensure JS detects the change
                      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
                      
                      // Return success with details
                      return {
                        success: true,
                        selector: searchInput.tagName.toLowerCase() + 
                                 (searchInput.id ? `#${searchInput.id}` : '') +
                                 (searchInput.name ? `[name="${searchInput.name}"]` : '')
                      };
                    }
                    return { success: false, reason: "No visible search inputs found" };
                  } catch (err) {
                    return { success: false, error: err.toString() };
                  }
                }, action.text);
                
                if (injectionSuccess.success) {
                  console.log(`🔥 DIRECT INJECTION SUCCESSFUL into ${injectionSuccess.selector}`);
                  typeSuccess = true;
                  
                  // Take screenshot of the successful typing
                  const screenshotPath = path.join(screenshotsDir, `${sessionId}-typing-success-${Date.now()}.png`);
                  await session.page.screenshot({ 
                    path: screenshotPath, 
                    fullPage: false,
                    type: 'jpeg',
                    quality: 80
                  });
                  
                  // Add small delay to simulate "finishing typing"
                  await new Promise(r => setTimeout(r, 300));
                } else {
                  console.log("⚠️ Direct injection failed, falling back to traditional typing");
                }
              } catch (directError) {
                console.error("💥 Error during direct injection:", directError);
              }
              
              // If direct injection failed, try traditional selectors
              if (!typeSuccess) {
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
                  '[role="search"] input',
                  'form input[type="text"]', // Generic fallback
                  'input:not([type="hidden"])' // Last resort
                ];
                
                let typeSuccess = false;
                let effectiveSelector = null;
                
                for (const selector of searchBoxSelectors) {
                  try {
                    const elementExists = await session.page.evaluate(
                      selector => !!document.querySelector(selector),
                      selector
                    );
                    
                    if (elementExists) {
                      effectiveSelector = selector;
                      
                      // CRITICAL: Wait for element to be properly loaded
                      await session.page.waitForSelector(selector, { timeout: 2000 });
                      
                      // Clear existing text first
                      await session.page.evaluate(
                        selector => { 
                          const element = document.querySelector(selector);
                          if (element) {
                            element.value = '';
                            // Force clear
                            element.setAttribute('value', '');
                          }
                        },
                        selector
                      );
                      
                      // Focus element with click first to ensure activation
                      await session.page.click(selector, { clickCount: 3 }); // Triple click to select all text
                      
                      // Add visible focus effect
                      await session.page.evaluate((selector) => {
                        const element = document.querySelector(selector);
                        if (element) {
                          element.focus();
                          
                          // Add visual focus effect
                          const originalBoxShadow = element.style.boxShadow;
                          element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.7)';
                          
                          setTimeout(() => {
                            element.style.boxShadow = originalBoxShadow;
                          }, 600);
                        }
                      }, selector);
              
              // If all selectors failed, try direct JavaScript injection
              if (!typeSuccess) {
                console.log(`⚠️ All selectors failed, trying JavaScript injection!`);
                
                typeSuccess = await session.page.evaluate((text) => {
                  const inputs = document.querySelectorAll('input, textarea');
                  for (const input of inputs) {
                    if (input.type !== 'hidden' && input.offsetParent !== null) {
                      // Add visual focus effect
                      input.focus();
                      const originalBoxShadow = input.style.boxShadow;
                      input.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                      
                      setTimeout(() => {
                        input.style.boxShadow = originalBoxShadow;
                      }, 600);
                      
                      // Set value and dispatch events
                      input.value = text;
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                      return true;
                    }
                  }
                  return false;
                }, action.text);
              }
              
              // Update session after typing
              session.streaming.isTyping = false;
              session.streaming.textBuffer = '';
              
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
                
                // Add focus effect
                await session.page.evaluate((selector) => {
                  const element = document.querySelector(selector);
                  if (element) {
                    element.focus();
                    
                    // Visual effect
                    const originalBoxShadow = element.style.boxShadow;
                    element.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                    
                    setTimeout(() => {
                      element.style.boxShadow = originalBoxShadow;
                    }, 600);
                  }
                }, action.selector);
                
                // REAL-TIME CHARACTER-BY-CHARACTER TYPING!
                for (let i = 0; i < action.text.length; i++) {
                  const char = action.text[i];
                  
                  // Update the buffer for status endpoint
                  session.streaming.textBuffer = action.text.substring(0, i + 1);
                  
                  // Type the character with human-like delay
                  await session.page.type(action.selector, char, { delay: 30 });
                  
                  // Take screenshots during typing
                  if (i % 5 === 0 || i === action.text.length - 1) {
                    const screenshotPath = path.join(screenshotsDir, `${sessionId}-typing-${Date.now()}.png`);
                    await session.page.screenshot({ 
                      path: screenshotPath, 
                      fullPage: false,
                      type: 'jpeg',
                      quality: 75
                    });
                  }
                  
                  // Randomized typing delay
                  await new Promise(r => setTimeout(r, 30 + Math.random() * 50));
                }
                
                console.log(`✅ TYPED TEXT: "${action.text}"`);
              } catch (typeError) {
                console.log(`⚠️ Standard typing failed, trying JavaScript injection...`);
                
                // Fallback to JavaScript injection
                const typeSuccess = await session.page.evaluate(
                  (selector, text) => {
                    const el = document.querySelector(selector);
                    if (el) {
                      // Visual focus effect
                      el.focus();
                      const originalBoxShadow = el.style.boxShadow;
                      el.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
                      
                      setTimeout(() => {
                        el.style.boxShadow = originalBoxShadow;
                      }, 600);
                      
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
            
            // Reset typing status
            session.streaming.isTyping = false;
            session.streaming.textBuffer = '';
            session.performance.typeCount++;
          } catch (typeActionError) {
            console.error(`⚠️ Type error but CONTINUING:`, typeActionError);
            
            // Reset typing status
            session.streaming.isTyping = false;
            session.streaming.textBuffer = '';
            
            return res.status(200).json({
              status: 'warning',
              message: `Typing issue but continuing: ${typeActionError.message}`
            });
          }
          break;
          
        case 'scroll': {
          // Scroll the page with VISUAL FEEDBACK
          
          try {
            const direction = action.direction || 'down';
            const amount = action.amount || 500;
            
            console.log(`📜 SCROLLING ${direction.toUpperCase()}: ${amount}px`);
            
            // SMOOTH SCROLLING implementation for visual appeal!
            await session.page.evaluate(({ direction, amount }) => {
              return new Promise((resolve) => {
                const duration = 500; // ms
                const start = window.scrollY;
                let target = start;
                
                if (direction === 'down') {
                  target = start + amount;
                } else if (direction === 'up') {
                  target = Math.max(0, start - amount);
                }
                
                const startTime = performance.now();
                
                function step(timestamp) {
                  const elapsed = timestamp - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  
                  // Ease-out function for natural scrolling
                  const easeProgress = 1 - Math.pow(1 - progress, 3);
                  
                  const currentPosition = start + (target - start) * easeProgress;
                  window.scrollTo(0, currentPosition);
                  
                  if (progress < 1) {
                    window.requestAnimationFrame(step);
                  } else {
                    resolve();
                  }
                }
                
                window.requestAnimationFrame(step);
              });
            }, { direction, amount });
            
            // Take scrolling screenshots
            for (let i = 0; i < 3; i++) {
              await new Promise(r => setTimeout(r, 150));
              const screenshotPath = path.join(screenshotsDir, `${sessionId}-scroll-${i}-${Date.now()}.png`);
              await session.page.screenshot({ 
                path: screenshotPath, 
                fullPage: false,
                type: 'jpeg',
                quality: 75 
              });
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
        }
          
        case 'submit':
          // Submit a form with VISUAL FEEDBACK
          try {
            if (!action.selector) {
              return res.status(400).json({ error: 'Selector is required for submit action' });
            }
            
            console.log(`📝 SUBMITTING FORM: ${action.selector}`);
            
            // Visual feedback for form submission
            await session.page.evaluate((selector) => {
              const form = document.querySelector(selector);
              if (form) {
                // Add visual highlight effect
                const originalOutline = form.style.outline;
                form.style.outline = '2px solid #3b82f6';
                form.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
                
                setTimeout(() => {
                  form.style.outline = originalOutline;
                  form.style.boxShadow = '';
                  
                  // Find and highlight submit button
                  const submitButton = form.querySelector('input[type="submit"], button[type="submit"], button:not([type])');
                  if (submitButton) {
                    const originalButtonBg = submitButton.style.backgroundColor;
                    submitButton.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                    
                    setTimeout(() => {
                      submitButton.style.backgroundColor = originalButtonBg;
                    }, 300);
                  }
                }, 400);
              }
            }, action.selector);
            
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
            
            // ADVANCED: Show visual timer on page for long waits
            if (duration > 2000) {
              await session.page.evaluate((duration) => {
                // Create timer element
                const timer = document.createElement('div');
                timer.id = 'ai-agent-timer';
                timer.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: rgba(59, 130, 246, 0.8);
                  color: white;
                  padding: 10px 15px;
                  border-radius: 8px;
                  font-family: sans-serif;
                  font-size: 14px;
                  z-index: 9999;
                  transition: opacity 0.3s ease;
                `;
                
                // Calculate end time
                const endTime = Date.now() + duration;
                timer.textContent = `AI waiting: ${Math.ceil(duration/1000)}s`;
                
                // Add to page
                document.body.appendChild(timer);
                
                // Update timer
                const interval = setInterval(() => {
                  const remaining = Math.max(0, endTime - Date.now());
                  timer.textContent = `AI waiting: ${Math.ceil(remaining/1000)}s`;
                  
                  if (remaining <= 0) {
                    clearInterval(interval);
                    timer.style.opacity = 0;
                    setTimeout(() => {
                      if (timer.parentNode) {
                        timer.parentNode.removeChild(timer);
                      }
                    }, 300);
                  }
                }, 100);
                
              }, duration);
            }
            
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
          
        case 'captcha':
          // Special case: Handle CAPTCHA bypass
          try {
            console.log('🛡️ ATTEMPTING CAPTCHA BYPASS');
            
            // Check for common CAPTCHA types
            const captchaResult = await session.page.evaluate(() => {
              // Check for reCAPTCHA
              const recaptchaFrames = document.querySelectorAll('iframe[src*="recaptcha"]');
              if (recaptchaFrames.length > 0) {
                return { type: 'recaptcha', found: true };
              }
              
              // Check for "I'm not a robot" checkbox
              const robotCheckboxes = document.querySelectorAll('input[type="checkbox"][aria-label*="robot"], div.recaptcha-checkbox');
              if (robotCheckboxes.length > 0) {
                return { type: 'checkbox', found: true };
              }
              
              // Check for CloudFlare protection
              if (document.title.includes('Cloudflare') || document.body.textContent.includes('Checking your browser')) {
                return { type: 'cloudflare', found: true };
              }
              
              return { found: false };
            });
            
            // Implementation varies by CAPTCHA type
            if (captchaResult.found) {
              console.log(`🛡️ DETECTED CAPTCHA TYPE: ${captchaResult.type}`);
              
              // CAPTCHA WORKAROUNDS (basic, not guaranteed to work)
              if (captchaResult.type === 'checkbox') {
                // Try clicking the checkbox with humanlike behavior
                await session.page.evaluate(() => {
                  const checkboxes = document.querySelectorAll('input[type="checkbox"][aria-label*="robot"], div.recaptcha-checkbox');
                  if (checkboxes.length > 0) {
                    // Add human-like randomized movement
                    const checkbox = checkboxes[0];
                    const rect = checkbox.getBoundingClientRect();
                    
                    // Create synthetic events
                    const mouseOver = new MouseEvent('mouseover', {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                      clientX: rect.left + rect.width / 2,
                      clientY: rect.top + rect.height / 2
                    });
                    
                    const mouseDown = new MouseEvent('mousedown', {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                      clientX: rect.left + rect.width / 2,
                      clientY: rect.top + rect.height / 2
                    });
                    
                    const mouseUp = new MouseEvent('mouseup', {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                      clientX: rect.left + rect.width / 2,
                      clientY: rect.top + rect.height / 2
                    });
                    
                    // Dispatch events with human-like timing
                    checkbox.dispatchEvent(mouseOver);
                    setTimeout(() => {
                      checkbox.dispatchEvent(mouseDown);
                      setTimeout(() => {
                        checkbox.dispatchEvent(mouseUp);
                        checkbox.click();
                      }, 120);
                    }, 200);
                  }
                });
                
                await new Promise(r => setTimeout(r, 2000));
              } else if (captchaResult.type === 'cloudflare') {
                // For CloudFlare, we often just need to wait
                console.log('⏱️ Waiting for CloudFlare check to complete...');
                await new Promise(r => setTimeout(r, 8000));
              }
              
              // Take screenshot after CAPTCHA attempt
              const screenshotPath = path.join(screenshotsDir, `${sessionId}-captcha-attempt-${Date.now()}.png`);
              await session.page.screenshot({ path: screenshotPath, fullPage: false });
            } else {
              console.log('✅ No CAPTCHA detected');
            }
          } catch (captchaError) {
            console.error('⚠️ CAPTCHA handling error:', captchaError);
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
      await session.page.screenshot({ 
        path: screenshotPath, 
        fullPage: false,
        type: 'jpeg',
        quality: 85
      });
      
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

// NEW! Get real-time typing status - FIXED AND IMPROVED! 🔥
app.get('/api/puppeteer/session/:sessionId/typing-status', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Make sure streaming object exists with proper properties
      if (!session.streaming) {
        session.streaming = {
          isTyping: false,
          textBuffer: '',
          currentSelector: null,
          typingSpeed: 50
        };
      }
      
      res.status(200).json({
        isTyping: session.streaming.isTyping,
        text: session.streaming.textBuffer || '',
        selector: session.streaming.currentSelector,
        timestamp: Date.now() // Add timestamp for caching control
      });
    } catch (error) {
      console.error('Error getting typing status:', error);
      // Return a safe fallback response instead of error
      res.status(200).json({
        isTyping: false,
        text: '',
        selector: null,
        error: error.message
      });
    }
  } else {
    // Return empty status instead of 404 for better resilience
    res.status(200).json({
      isTyping: false,
      text: '',
      selector: null,
      message: 'Session not found but continuing gracefully'
    });
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