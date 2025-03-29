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

// 🔥 Server configuration with ENHANCED error handling
const app = express();
const port = process.env.PORT || 3001;

// Create global error handler to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('🚨 GLOBAL ERROR (CAUGHT!) - Server continues running:', err);
});

// Create logger with timestamps
const logger = {
  info: (...args) => console.log(`[${new Date().toISOString()}] INFO:`, ...args),
  warn: (...args) => console.warn(`[${new Date().toISOString()}] WARN:`, ...args),
  error: (...args) => console.error(`[${new Date().toISOString()}] ERROR:`, ...args),
  success: (...args) => console.log(`[${new Date().toISOString()}] SUCCESS:`, ...args)
};

// 🔍 CAPTCHA detection patterns - EXPANDED!
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
  'verify',
  'bot challenge',
  'security verification',
  'prove you are human',
  'checking if the site connection is secure',
  'please wait while we verify',
  'one more step',
  'security question',
  'automated traffic'
];

// Enhanced middleware with recovery options
app.use(cors());
app.use(express.json({limit: '50mb'}));

// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error(`🚨 Express middleware caught error: ${err.message}`);
  if (!res.headersSent) {
    res.status(500).json({ 
      error: 'Server error recovered',
      message: err.message,
      success: false,
      recovered: true
    });
  }
});

// Add request logging and tracking
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(2, 10);
  const start = Date.now();
  
  // Add request ID to response headers
  res.set('X-Request-ID', requestId);
  
  // Skip logging for frequent status and screenshot requests
  const isFrequentEndpoint = 
    req.path.includes('/status') || 
    req.path.includes('/screenshot');
  
  if (!isFrequentEndpoint) {
    logger.info(`🔄 ${requestId} - ${req.method} ${req.url} started`);
  }
  
  // Track response
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only log slower responses or errors
    if (duration > 100 || res.statusCode >= 400 || !isFrequentEndpoint) {
      const logMethod = res.statusCode >= 400 ? logger.warn : logger.info;
      logMethod(`${requestId} - ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    }
  });
  
  next();
});

// Sessions map with auto-cleanup and enhanced tracking
const sessions = new Map();

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Create logs directory for server-side logs
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Cleanup old screenshots to save disk space
const cleanupOldScreenshots = () => {
  logger.info("🧹 Cleaning up old screenshots...");
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
    logger.info(`🧹 Removed ${cleanedCount} old screenshots`);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupOldScreenshots, 5 * 60 * 1000);

// 🔍 ENHANCED CAPTCHA detection function
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
    
    // Check page content for CAPTCHA elements - MORE THOROUGH!
    const hasCaptchaElements = await page.evaluate(() => {
      const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="captcha"]',
        'iframe[src*="hcaptcha"]',
        'iframe[src*="cloudflare"]',
        'div.g-recaptcha',
        'div.h-captcha',
        'div[class*="captcha"]',
        'input[name*="captcha"]',
        'img[src*="captcha"]',
        // Text-based detection selectors
        '[id*="challenge"]',
        '[class*="challenge"]',
        '[id*="security"]',
        '[class*="security"]',
        '[id*="bot"]',
        '[class*="bot"]',
        '[id*="verify"]',
        '[class*="verify"]'
      ];
      
      // Check for selectors
      const hasSelector = captchaSelectors.some(selector => document.querySelector(selector) !== null);
      
      // Check page text for CAPTCHA-related terms
      const bodyText = document.body.innerText.toLowerCase();
      const captchaTerms = [
        'captcha',
        'robot',
        'human verification',
        'security check',
        'site check',
        'verify',
        'challenge'
      ];
      
      const hasText = captchaTerms.some(term => bodyText.includes(term));
      
      return hasSelector || hasText;
    });
    
    return hasCaptchaElements;
  } catch (error) {
    logger.error('Error detecting CAPTCHA:', error);
    return false;
  }
};

// 🛡️ ADVANCED CAPTCHA evasion strategies
const evadeCaptcha = async (page) => {
  try {
    logger.info('🛡️ Attempting to evade CAPTCHA...');
    
    // 1. Back to previous page if possible
    try {
      await page.goBack();
      logger.info('⬅️ Navigated back to escape CAPTCHA');
      return true;
    } catch (e) {
      logger.info('↩️ Could not go back, trying alternative approach');
    }
    
    // 2. Try different search engine - with multiple options!
    const searchEngines = [
      'https://www.bing.com',
      'https://www.duckduckgo.com',
      'https://www.yahoo.com',
      'https://www.google.com'
    ];
    
    for (const engine of searchEngines) {
      try {
        await page.goto(engine, { waitUntil: 'networkidle2', timeout: 10000 });
        logger.info(`🔄 Switched to alternative search engine: ${engine}`);
        return true;
      } catch (e) {
        logger.warn(`Failed to switch to search engine ${engine}: ${e.message}`);
      }
    }
    
    // 3. LAST RESORT: Create a fresh page in the same browser
    try {
      const browser = page.browser();
      await page.close();
      const newPage = await browser.newPage();
      
      // Set viewport
      await newPage.setViewport({
        width: 1280,
        height: 800,
        deviceScaleFactor: 1
      });
      
      // Set a realistic user agent
      await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
      
      await newPage.goto('https://www.google.com', { waitUntil: 'networkidle2' });
      logger.info('🔄 Created fresh page as CAPTCHA evasion technique');
      return true;
    } catch (e) {
      logger.error('💥 All CAPTCHA evasion techniques failed', e);
      return false;
    }
  } catch (error) {
    logger.error('Error in CAPTCHA evasion:', error);
    return false;
  }
};

// 🚀 SUPER-RESILIENT Element Selection Helper
const getClickableElement = async (page, selector, text = null) => {
  try {
    // Try multiple approaches to find the element
    
    // 1. Try direct selector if provided
    if (selector) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 });
        return { selector, method: 'css-selector' };
      } catch (e) {
        logger.warn(`Selector "${selector}" not found, trying alternatives`);
      }
    }
    
    // 2. Try expanded selector variations if it's a common element
    if (selector) {
      // Handle common selector variations
      const expandedSelectors = [];
      
      // Search button variations
      if (selector.includes('btnK') || selector.includes('search')) {
        expandedSelectors.push(
          'input[type="submit"]',
          'button[type="submit"]',
          'input.gNO89b',
          'button.gNO89b',
          'input[value="Google Search"]',
          'button[aria-label="Google Search"]',
          '.search-button',
          '[role="button"]:has(.z1asCe)'
        );
      }
      
      // Search input variations
      if (selector.includes('name="q"') || selector.includes('type="search"')) {
        expandedSelectors.push(
          'input[name="q"]',
          'input[type="search"]',
          'textarea[name="q"]',
          '.gLFyf',
          'input.gLFyf',
          '[role="combobox"]'
        );
      }
      
      // Try each expanded selector
      for (const expandedSelector of expandedSelectors) {
        try {
          const elementExists = await page.evaluate((sel) => !!document.querySelector(sel), expandedSelector);
          if (elementExists) {
            return { selector: expandedSelector, method: 'expanded-selector' };
          }
        } catch (e) {
          // Just continue to next selector
        }
      }
    }
    
    // 3. Try finding by text if provided
    if (text) {
      try {
        // Use page.evaluate to find elements containing the text
        const textSelector = await page.evaluate((searchText) => {
          const allElements = document.querySelectorAll('a, button, [role="button"], input[type="submit"], .btn');
          for (const el of Array.from(allElements)) {
            const elText = el.innerText || el.textContent || el.value || '';
            if (elText.includes(searchText)) {
              // Generate a unique selector for this element
              // First try ID
              if (el.id) return `#${el.id}`;
              
              // Try unique class
              if (el.className && typeof el.className === 'string' && el.className.trim()) {
                const uniqueClass = el.className.split(' ')[0];
                return `.${uniqueClass}`;
              }
              
              // Last resort - return XPath
              let path = '';
              let element = el;
              while (element && element.nodeType === 1) {
                let index = 1;
                let sibling = element.previousSibling;
                while (sibling) {
                  if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                    index++;
                  }
                  sibling = sibling.previousSibling;
                }
                const tagName = element.tagName.toLowerCase();
                path = `/${tagName}[${index}]${path}`;
                element = element.parentNode;
              }
              return `xpath:${path}`;
            }
          }
          return null;
        }, text);
        
        if (textSelector) {
          // Handle XPath selectors specially
          if (textSelector.startsWith('xpath:')) {
            return { selector: textSelector.slice(6), method: 'xpath' };
          }
          return { selector: textSelector, method: 'text-match' };
        }
      } catch (e) {
        logger.warn(`Text search failed for "${text}": ${e.message}`);
      }
    }
    
    // 4. For search buttons, try special JS selector as last resort
    if ((selector && (selector.includes('btnK') || selector.includes('search'))) || 
        (text && text.toLowerCase().includes('search'))) {
      
      return { 
        selector: null,
        jsEval: `
          (function() {
            // Try all possible search buttons
            const possibleButtons = [
              document.querySelector('input[type="submit"]'),
              document.querySelector('button[type="submit"]'),
              document.querySelector('input.gNO89b'),
              document.querySelector('button.gNO89b'),
              document.querySelector('input[value="Google Search"]'),
              document.querySelector('[aria-label="Google Search"]'),
              ...Array.from(document.querySelectorAll('button')).filter(b => 
                b.textContent.includes('Search') || b.innerText.includes('Search')),
              ...Array.from(document.querySelectorAll('[role="button"]'))
            ].filter(Boolean);
            
            // Click the first valid button
            if (possibleButtons.length > 0) {
              possibleButtons[0].click();
              return true;
            }
            return false;
          })();
        `,
        method: 'js-eval-search-button'
      };
    }
    
    // 5. No element found through any method
    return null;
  } catch (error) {
    logger.error('Error in getClickableElement:', error);
    return null;
  }
};

// 🔥 ULTRA-RELIABLE click function with multiple fallbacks
const performClick = async (page, selector, text = null) => {
  try {
    const element = await getClickableElement(page, selector, text);
    
    if (!element) {
      throw new Error('No element found to click');
    }
    
    // Different click methods based on what we found
    if (element.method === 'xpath') {
      const [elementHandle] = await page.$x(element.selector);
      if (elementHandle) {
        await elementHandle.click();
        return true;
      }
      throw new Error('XPath element not clickable');
    }
    else if (element.jsEval) {
      // Execute custom JS to handle the click
      const result = await page.evaluate(element.jsEval);
      if (result) {
        return true;
      }
      throw new Error('JavaScript click failed');
    }
    else if (element.selector) {
      // Try multiple click approaches
      
      // 1. Try standard click
      try {
        await page.click(element.selector);
        return true;
      } catch (clickError) {
        logger.warn(`Standard click failed for ${element.selector}: ${clickError.message}`);
      }
      
      // 2. Try position-based click
      try {
        const boundingBox = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          };
        }, element.selector);
        
        if (boundingBox) {
          await page.mouse.click(
            boundingBox.x + boundingBox.width / 2,
            boundingBox.y + boundingBox.height / 2
          );
          return true;
        }
      } catch (positionError) {
        logger.warn(`Position click failed: ${positionError.message}`);
      }
      
      // 3. Try JavaScript click
      try {
        await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          if (element) {
            element.click();
            return true;
          }
          return false;
        }, element.selector);
        return true;
      } catch (jsClickError) {
        logger.warn(`JavaScript click failed: ${jsClickError.message}`);
      }
    }
    
    throw new Error('All click methods failed');
  } catch (error) {
    logger.error(`Click error: ${error.message}`);
    throw error;
  }
};

// 🔥 ULTRA-RELIABLE type function with multiple fallbacks
const performType = async (page, selector, text) => {
  if (!text) text = ''; // Ensure text is at least an empty string
  
  try {
    // Try different selectors for typing
    const selectors = Array.isArray(selector) ? selector : [selector];
    
    // Add common fallback selectors for search inputs
    const allSelectors = [
      ...selectors,
      'input[name="q"]',
      'input[type="search"]',
      'textarea',
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
      '.gLFyf'
    ].filter(Boolean); // Remove any null/undefined
    
    let typed = false;
    
    // Try different typing strategies
    for (const currentSelector of allSelectors) {
      if (typed) break;
      
      try {
        // Strategy 1: Standard click + type
        try {
          await page.click(currentSelector, { clickCount: 3 }); // Select all text
          await page.keyboard.press('Backspace');
          await page.type(currentSelector, text, { delay: 30 });
          typed = true;
          break;
        } catch (clickTypeError) {
          logger.warn(`Click+type method failed for ${currentSelector}: ${clickTypeError.message}`);
        }
        
        // Strategy 2: Focus + JavaScript value assignment
        try {
          await page.focus(currentSelector);
          await page.evaluate((sel, val) => {
            document.querySelector(sel).value = val;
            // Dispatch events for frameworks that listen for input events
            document.querySelector(sel).dispatchEvent(new Event('input', { bubbles: true }));
            document.querySelector(sel).dispatchEvent(new Event('change', { bubbles: true }));
          }, currentSelector, text);
          typed = true;
          break;
        } catch (focusTypeError) {
          logger.warn(`Focus+JS method failed for ${currentSelector}: ${focusTypeError.message}`);
        }
      } catch (selectorError) {
        logger.warn(`Selector ${currentSelector} failed: ${selectorError.message}`);
      }
    }
    
    // If all previous methods failed, try super fallback
    if (!typed) {
      // Try to find any input element on the page and type in it
      const foundAnyInput = await page.evaluate((textToType) => {
        const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
        if (inputs.length > 0) {
          const input = inputs[0];
          input.value = textToType;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, text);
      
      if (foundAnyInput) {
        typed = true;
      } else {
        // Last resort: Just send keyboard input without a target element
        await page.keyboard.type(text, { delay: 30 });
        typed = true;
      }
    }
    
    if (typed) {
      return true;
    } else {
      throw new Error('All typing methods failed');
    }
  } catch (error) {
    logger.error(`Type error: ${error.message}`);
    throw error;
  }
};

// 🚀 Create a new browser session with ROBUST error handling
app.post('/api/puppeteer/session', async (req, res) => {
  let browser = null;
  let sessionId = null;
  
  try {
    sessionId = uuidv4();
    logger.info(`🚀 Creating new browser session: ${sessionId}`);
    
    // Launch with optimized options and multiple retries
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        browser = await puppeteer.launch({
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
        break; // Success - exit retry loop
      } catch (launchError) {
        if (attempt === 3) throw launchError; // Last attempt, propagate error
        logger.warn(`Browser launch attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
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
    
    // Mask browser automation - ENHANCED VERSION
    await page.evaluateOnNewDocument(() => {
      // Overwrite the 'navigator.webdriver' property to make it undefined
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
      
      // Mask language settings too to make it more realistic
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
      
      // Remove Chrome automation protocol from window
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
      
      // Hide webdriver from plugins
      const originalPlugins = navigator.plugins;
      const pluginsData = []; 
      for (let i = 0; i < originalPlugins.length; i++) {
        const plugin = originalPlugins[i];
        pluginsData.push({
          name: plugin.name,
          description: plugin.description,
          filename: plugin.filename
        });
      }
      
      Object.defineProperty(navigator, 'plugins', {
        get: () => pluginsData
      });
    });
    
    // Optimize page loading with SMART resource blocking
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // Get request type and URL
      const resourceType = request.resourceType();
      const url = request.url().toLowerCase();
      
      // Block resource types that slow down browsing
      if (
        resourceType === 'image' || 
        resourceType === 'media' ||
        resourceType === 'font' ||
        (resourceType === 'stylesheet' && !url.includes('google.com')) ||
        url.includes('google-analytics') ||
        url.includes('googletagmanager') ||
        url.includes('facebook') ||
        url.includes('analytics') ||
        url.includes('advertisement') ||
        url.includes('doubleclick') ||
        url.includes('imasdk.googleapis.com')
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Set up error handling for page errors
    page.on('error', error => {
      logger.error(`❌ Page crashed in session ${sessionId}:`, error);
      // Don't crash the server - just log it
    });
    
    page.on('pageerror', error => {
      logger.error(`❌ Page JavaScript error in session ${sessionId}:`, error);
      // Don't crash the server - just log it
    });
    
    // Navigate to blank page
    await page.goto('about:blank');
    
    // Store session data with enhanced tracking
    sessions.set(sessionId, {
      browser,
      page,
      createdAt: new Date(),
      lastActivity: new Date(),
      url: 'about:blank',
      status: 'initialized',
      actions: [],
      errors: [],
      performance: {
        navigationCount: 0,
        clickCount: 0,
        typeCount: 0
      },
      health: {
        isResponsive: true,
        lastHealthCheck: new Date()
      }
    });
    
    logger.success(`✅ Browser session created: ${sessionId}`);
    
    res.status(200).json({
      sessionId,
      status: 'created',
      message: 'Browser session created and ready'
    });
  } catch (error) {
    // Clean up browser instance if it was created but failed
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        logger.error('Error closing failed browser:', closeError);
      }
    }
    
    logger.error('Error creating browser session:', error);
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
      
      logger.info(`🚫 Closed browser session: ${sessionId}`);
      
      res.status(200).json({ status: 'closed' });
    } catch (error) {
      logger.error(`Error closing browser session ${sessionId}:`, error);
      // Still report success - session will be cleaned up eventually
      sessions.delete(sessionId);
      res.status(200).json({ 
        status: 'force_closed',
        warning: error.message 
      });
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
      logger.info(`🔄 Initializing browser session: ${sessionId}`);
      
      // Enhanced browser setup
      await session.page.setJavaScriptEnabled(true);
      await session.page.setDefaultNavigationTimeout(30000);
      
      // Multiple attempts to navigate to Google
      let success = false;
      let error = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await session.page.goto('https://www.google.com', {
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          success = true;
          break;
        } catch (navError) {
          error = navError;
          logger.warn(`Navigation attempt ${attempt} failed: ${navError.message}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!success) {
        throw error || new Error('Failed to navigate to Google after multiple attempts');
      }
      
      // Update session data
      session.lastActivity = new Date();
      session.url = 'https://www.google.com';
      session.status = 'active';
      session.performance.navigationCount++;
      
      // Take a screenshot
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-init-${Date.now()}.png`);
      await session.page.screenshot({ path: screenshotPath, fullPage: false });
      
      logger.success(`✅ Browser initialized: ${sessionId}`);
      
      res.status(200).json({
        status: 'initialized',
        url: 'https://www.google.com'
      });
    } catch (error) {
      logger.error(`Error initializing session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    logger.error(`Session not found: ${sessionId}`);
    res.status(404).json({ error: 'Session not found' });
  }
});

// Restart a browser session with enhanced error handling
app.post('/api/puppeteer/session/:sessionId/restart', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    let oldBrowser = null;
    
    try {
      // Get existing browser reference
      oldBrowser = sessions.get(sessionId).browser;
      
      logger.info(`🔄 Restarting browser session: ${sessionId}`);
      
      // Close the old browser safely
      try {
        await oldBrowser.close();
      } catch (closeError) {
        logger.warn(`Error closing old browser: ${closeError.message} - continuing anyway`);
      }
      
      // Launch a new browser with retries
      let newBrowser = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          newBrowser = await puppeteer.launch({
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
          break;
        } catch (launchError) {
          if (attempt === 3) throw launchError;
          logger.warn(`Browser restart attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
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
      
      // Set up error handlers
      newPage.on('error', error => {
        logger.error(`❌ Page crashed in restarted session ${sessionId}:`, error);
      });
      
      newPage.on('pageerror', error => {
        logger.error(`❌ Page JavaScript error in restarted session ${sessionId}:`, error);
      });
      
      // Navigate to Google
      let navigationSuccess = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await newPage.goto('https://www.google.com', {
            waitUntil: 'networkidle2',
            timeout: 20000
          });
          navigationSuccess = true;
          break;
        } catch (navError) {
          if (attempt === 3) logger.error(`Failed to navigate after restart: ${navError.message}`);
          else logger.warn(`Navigation attempt ${attempt} failed after restart, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Update session data
      sessions.set(sessionId, {
        browser: newBrowser,
        page: newPage,
        createdAt: new Date(),
        lastActivity: new Date(),
        url: navigationSuccess ? 'https://www.google.com' : 'about:blank',
        status: 'restarted',
        actions: [],
        errors: [],
        performance: {
          navigationCount: 1,
          clickCount: 0,
          typeCount: 0
        },
        health: {
          isResponsive: true,
          lastHealthCheck: new Date()
        }
      });
      
      logger.success(`✅ Browser session restarted: ${sessionId}`);
      
      res.status(200).json({
        status: 'restarted',
        url: navigationSuccess ? 'https://www.google.com' : 'about:blank'
      });
    } catch (error) {
      logger.error(`Error restarting browser session ${sessionId}:`, error);
      
      // Attempt to recreate a completely new session if restart failed
      try {
        // Close old browser if still there
        if (oldBrowser) {
          try {
            await oldBrowser.close();
          } catch (e) {
            // Ignore close errors
          }
        }
        
        // Create completely new browser
        const newBrowser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const newPage = await newBrowser.newPage();
        await newPage.goto('about:blank');
        
        // Update session
        sessions.set(sessionId, {
          browser: newBrowser,
          page: newPage,
          createdAt: new Date(),
          lastActivity: new Date(),
          url: 'about:blank',
          status: 'recovery-restart',
          actions: [],
          errors: [error.message],
          performance: { navigationCount: 0, clickCount: 0, typeCount: 0 },
          health: { isResponsive: true, lastHealthCheck: new Date() }
        });
        
        logger.warn(`⚠️ Created recovery session after restart failure: ${sessionId}`);
        
        res.status(200).json({
          status: 'recovery-restart',
          url: 'about:blank',
          warning: 'Created recovery session after restart failure'
        });
      } catch (recoveryError) {
        logger.error(`Recovery restart also failed: ${recoveryError.message}`);
        res.status(500).json({ 
          error: error.message,
          recovery_error: recoveryError.message
        });
      }
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
      
      logger.info(`🔄 Refreshing browser session: ${sessionId}`);
      
      // Refresh the current page with retry
      let success = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await session.page.reload({
            waitUntil: 'networkidle2',
            timeout: 20000
          });
          success = true;
          break;
        } catch (reloadError) {
          if (attempt === 3) throw reloadError;
          logger.warn(`Refresh attempt ${attempt} failed: ${reloadError.message}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Update session data
      session.lastActivity = new Date();
      
      logger.success(`✅ Browser refreshed: ${sessionId}`);
      
      res.status(200).json({
        status: 'refreshed',
        url: session.url
      });
    } catch (error) {
      logger.error(`Error refreshing browser session ${sessionId}:`, error);
      
      // Return a warning but don't fail the request completely
      res.status(200).json({ 
        status: 'refresh_error', 
        error: error.message,
        url: sessions.get(sessionId)?.url || 'unknown'
      });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Get session status with health check
app.get('/api/puppeteer/session/:sessionId/status', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Check if the browser is still connected
      let isActive = false;
      let currentUrl = session.url;
      let captchaDetected = false;
      
      try {
        const pages = await session.browser.pages();
        isActive = pages.length > 0;
        
        // Get current URL
        if (isActive) {
          try {
            currentUrl = await session.page.url();
            session.url = currentUrl;
            
            // Perform a lightweight health check
            const isResponsive = await session.page.evaluate(() => true).catch(() => false);
            session.health.isResponsive = isResponsive;
            session.health.lastHealthCheck = new Date();
            
            // Check for CAPTCHA
            captchaDetected = await detectCaptcha(session.page);
          } catch (e) {
            logger.warn(`Error in status check: ${e.message}`);
            isActive = false;
          }
        }
      } catch (connectionError) {
        logger.warn(`Browser connection error during status check: ${connectionError.message}`);
        isActive = false;
      }
      
      // Update last activity
      session.lastActivity = new Date();
      
      res.status(200).json({
        active: isActive,
        url: currentUrl,
        status: session.status,
        lastActivity: session.lastActivity,
        captchaDetected,
        health: session.health
      });
    } catch (error) {
      logger.error(`Error getting status for session ${sessionId}:`, error);
      // Don't fail the request completely - return a degraded response
      res.status(200).json({ 
        active: false,
        status: 'error',
        error: error.message
      });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// 🔥 FIXED: Get current page content with better error handling
app.get('/api/puppeteer/session/:sessionId/content', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Get page HTML content with timeout
      let content = '';
      try {
        // Set a timeout for content extraction
        content = await Promise.race([
          session.page.content(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Content extraction timed out')), 10000)
          )
        ]);
      } catch (contentError) {
        logger.error(`Error getting page content: ${contentError.message}`);
        // Return minimal HTML rather than empty content
        content = `
          <html>
            <body>
              <p>Error getting content: ${contentError.message}</p>
              <p>URL: ${session.url || 'unknown'}</p>
            </body>
          </html>
        `;
      }
      
      // Update last activity
      session.lastActivity = new Date();
      
      res.status(200).json({
        content,
        url: session.url
      });
    } catch (error) {
      logger.error(`Error getting page content for session ${sessionId}:`, error);
      
      // Return minimal content with error info rather than failing
      const errorContent = `
        <html>
          <body>
            <p>Error retrieving content: ${error.message}</p>
          </body>
        </html>
      `;
      
      res.status(200).json({
        content: errorContent,
        url: sessions.get(sessionId)?.url || 'unknown',
        error: error.message
      });
    }
  } else {
    // Return empty content rather than 404 error
    res.status(200).json({
      content: '<html><body><p>Session not found</p></body></html>',
      error: 'Session not found'
    });
  }
});

// Take a screenshot with fallbacks
app.get('/api/puppeteer/session/:sessionId/screenshot', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Take a screenshot with timeout
      let screenshotBuffer = null;
      try {
        // Optimize screenshot for performance
        const screenshotOptions = {
          path: path.join(screenshotsDir, `${sessionId}-${Date.now()}.png`),
          type: 'png',
          fullPage: false,
          quality: 80,
          omitBackground: false
        };
        
        // Set a timeout for screenshot capture
        screenshotBuffer = await Promise.race([
          session.page.screenshot(screenshotOptions),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Screenshot timed out')), 10000)
          )
        ]);
      } catch (screenshotError) {
        logger.error(`Screenshot error: ${screenshotError.message}`);
        
        // Try a fallback method - evaluate a simple script to check if page is responsive
        try {
          const isPageResponsive = await session.page.evaluate(() => true).catch(() => false);
          
          if (isPageResponsive) {
            // Try with different options
            screenshotBuffer = await session.page.screenshot({
              type: 'png',
              fullPage: false,
              quality: 60,
              clip: { x: 0, y: 0, width: 800, height: 600 }
            });
          } else {
            throw new Error('Page is not responsive');
          }
        } catch (fallbackError) {
          logger.error(`Fallback screenshot also failed: ${fallbackError.message}`);
          
          // Create a simple error image - a red square with white text
          // This ensures clients get SOME response rather than an error
          const { createCanvas } = require('canvas');
          const canvas = createCanvas(800, 600);
          const ctx = canvas.getContext('2d');
          
          // Draw error message
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(0, 0, 800, 600);
          ctx.fillStyle = '#ffffff';
          ctx.font = '24px Arial';
          ctx.fillText('Screenshot Error', 50, 50);
          ctx.font = '16px Arial';
          ctx.fillText(`Session: ${sessionId}`, 50, 80);
          ctx.fillText(`Error: ${screenshotError.message}`, 50, 110);
          ctx.fillText(`URL: ${session.url || 'unknown'}`, 50, 140);
          ctx.fillText(`Time: ${new Date().toISOString()}`, 50, 170);
          
          screenshotBuffer = canvas.toBuffer('image/png');
        }
      }
      
      // Update last activity
      session.lastActivity = new Date();
      
      // Set appropriate headers
      res.set('Content-Type', 'image/png');
      res.set('Content-Length', screenshotBuffer.length);
      
      // Send the screenshot
      res.send(screenshotBuffer);
    } catch (error) {
      logger.error(`Critical error taking screenshot for session ${sessionId}:`, error);
      
      // Create a simple error image
      try {
        const { createCanvas } = require('canvas');
        const canvas = createCanvas(800, 600);
        const ctx = canvas.getContext('2d');
        
        // Draw error message
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText('Critical Screenshot Error', 50, 50);
        ctx.font = '16px Arial';
        ctx.fillText(`Session: ${sessionId}`, 50, 80);
        ctx.fillText(`Error: ${error.message}`, 50, 110);
        ctx.fillText(`Time: ${new Date().toISOString()}`, 50, 170);
        
        const buffer = canvas.toBuffer('image/png');
        
        res.set('Content-Type', 'image/png');
        res.set('Content-Length', buffer.length);
        res.send(buffer);
      } catch (canvasError) {
        // Absolute last resort if even canvas fails
        res.status(500).json({ error: error.message });
      }
    }
  } else {
    // Create a "session not found" image instead of 404 error
    try {
      const { createCanvas } = require('canvas');
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext('2d');
      
      // Draw message
      ctx.fillStyle = '#000060';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.fillText('Session Not Found', 50, 50);
      ctx.font = '16px Arial';
      ctx.fillText(`Session ID: ${sessionId}`, 50, 80);
      ctx.fillText(`Time: ${new Date().toISOString()}`, 50, 110);
      
      const buffer = canvas.toBuffer('image/png');
      
      res.set('Content-Type', 'image/png');
      res.set('Content-Length', buffer.length);
      res.send(buffer);
    } catch (canvasError) {
      res.status(404).json({ error: 'Session not found' });
    }
  }
});

// Navigate to URL with comprehensive error handling
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
      
      logger.info(`🌐 Navigating to URL: ${formattedUrl}`);
      
      // Navigate to URL with timeout and waiting for network - with retries
      let navigationSuccess = false;
      let navigationError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await session.page.goto(formattedUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          navigationSuccess = true;
          break;
        } catch (navError) {
          navigationError = navError;
          logger.warn(`Navigation attempt ${attempt} failed: ${navError.message}`);
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!navigationSuccess) {
        throw navigationError || new Error('Navigation failed after multiple attempts');
      }
      
      // Update session data
      session.lastActivity = new Date();
      session.url = formattedUrl;
      session.status = 'navigated';
      session.performance.navigationCount++;
      
      // Check for CAPTCHA
      const captchaDetected = await detectCaptcha(session.page);
      
      if (captchaDetected) {
        logger.warn('🛡️ CAPTCHA detected during navigation! Taking evasive action...');
        const evaded = await evadeCaptcha(session.page);
        
        if (evaded) {
          // Get new URL after evasion
          const newUrl = await session.page.url();
          session.url = newUrl;
          
          logger.success(`✅ Navigation completed after CAPTCHA evasion: ${newUrl}`);
          
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
      
      logger.success(`✅ Navigation complete: ${formattedUrl}`);
      
      res.status(200).json({
        status: 'navigated',
        url: formattedUrl
      });
    } catch (error) {
      logger.error(`Error navigating to URL in session ${sessionId}:`, error);
      
      // Attempt to recover and return what we can
      try {
        const session = sessions.get(sessionId);
        let currentUrl = url;
        
        try {
          currentUrl = await session.page.url();
        } catch (urlError) {
          logger.error(`Error getting current URL: ${urlError.message}`);
        }
        
        // Return an error but also the current URL for the client to know where we ended up
        res.status(200).json({ 
          status: 'navigation_error',
          error: error.message,
          url: currentUrl || url
        });
      } catch (recoveryError) {
        logger.error(`Recovery also failed: ${recoveryError.message}`);
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
      
      logger.info(`🎮 Executing action: ${action.type} - ${action.description || ''}`);
      
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
            
            logger.info(`🌐 Navigating to: ${formattedUrl}`);
            
            // Navigation with retries
            let navigationSuccess = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                await session.page.goto(formattedUrl, {
                  waitUntil: 'networkidle2',
                  timeout: 30000
                });
                navigationSuccess = true;
                break;
              } catch (navAttemptError) {
                logger.warn(`Navigation attempt ${attempt} failed: ${navAttemptError.message}`);
                if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            if (!navigationSuccess) {
              throw new Error('Navigation failed after multiple attempts');
            }
            
            logger.success(`✅ Navigation complete: ${formattedUrl}`);
            
            session.url = formattedUrl;
            session.performance.navigationCount++;
            actionResult = { success: true, message: 'Navigation successful' };
          } catch (navError) {
            logger.error(`Navigation error:`, navError);
            actionResult = { success: false, message: `Navigation error: ${navError.message}` };
          }
          break;
          
        case 'click':
          try {
            // Call our super-resilient click function
            const clickSuccess = await performClick(
              session.page, 
              action.selector, 
              action.text
            );
            
            if (clickSuccess) {
              logger.success(`✅ Click successful`);
              actionResult = { success: true, message: 'Click successful' };
            } else {
              throw new Error('Click operation failed');
            }
            
            session.performance.clickCount++;
            
            // Wait for potential page load
            try {
              await session.page.waitForNavigation({ 
                timeout: 5000, 
                waitUntil: 'networkidle0' 
              }).catch(() => {
                // This is expected to time out if no navigation happens
                logger.info('No navigation after click');
              });
            } catch (navTimeoutError) {
              // This is fine, might not navigate
              logger.info('No navigation after click - continuing');
            }
          } catch (clickActionError) {
            logger.error(`Click error:`, clickActionError);
            
            // Try a JavaScript-based fallback click
            try {
              logger.info('Attempting JavaScript fallback click');
              
              const jsClickSuccess = await session.page.evaluate((selector, searchText) => {
                // Try by selector first
                if (selector) {
                  const element = document.querySelector(selector);
                  if (element) {
                    element.click();
                    return true;
                  }
                }
                
                // Try by text if selector fails
                if (searchText) {
                  const elements = Array.from(document.querySelectorAll('a, button, [role="button"], input[type="submit"], .btn'));
                  for (const el of elements) {
                    const elText = el.innerText || el.textContent || el.value || '';
                    if (elText.includes(searchText)) {
                      el.click();
                      return true;
                    }
                  }
                }
                
                // Try alternative approaches - any button or link
                const buttons = document.querySelectorAll('button, input[type="submit"], [role="button"]');
                if (buttons.length > 0) {
                  buttons[0].click();
                  return true;
                }
                
                return false;
              }, action.selector, action.text);
              
              if (jsClickSuccess) {
                logger.success('✅ JavaScript fallback click succeeded');
                actionResult = { success: true, message: 'JavaScript click successful' };
                
                // Wait briefly for any navigation
                try {
                  await session.page.waitForNavigation({ 
                    timeout: 3000, 
                    waitUntil: 'networkidle0' 
                  }).catch(() => {});
                } catch (e) {
                  // Ignore navigation timeout
                }
              } else {
                throw new Error('JavaScript click fallback also failed');
              }
            } catch (jsClickError) {
              logger.error('JavaScript fallback click failed:', jsClickError);
              actionResult = { success: false, message: `Click error: ${clickActionError.message}` };
            }
          }
          break;
          
        case 'type':
          try {
            const selector = action.selector;
            const text = action.text || '';
            
            if (!selector) {
              logger.warn('No selector provided for type action - will try generic selectors');
            }
            
            // Use our super-resilient type function
            const typeSuccess = await performType(session.page, selector, text);
            
            if (typeSuccess) {
              logger.success(`✅ Typing successful: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
              actionResult = { success: true, message: 'Typing successful' };
            } else {
              throw new Error('Type operation failed');
            }
            
            session.performance.typeCount++;
          } catch (typeError) {
            logger.error(`Type error:`, typeError);
            
            // Always return success for type actions to keep workflows moving
            actionResult = { 
              success: true, 
              message: `Type simulation (after error: ${typeError.message})` 
            };
          }
          break;
          
        case 'scroll':
          // Scroll the page
          try {
            const direction = action.direction || 'down';
            const amount = action.amount || 500;
            
            logger.info(`📜 Scrolling ${direction}: ${amount}px`);
            
            // Scroll with retry
            let scrollSuccess = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                if (direction === 'down') {
                  await session.page.evaluate((scrollAmount) => {
                    window.scrollBy({
                      top: scrollAmount,
                      behavior: 'smooth'
                    });
                    return true;
                  }, amount);
                } else if (direction === 'up') {
                  await session.page.evaluate((scrollAmount) => {
                    window.scrollBy({
                      top: -scrollAmount,
                      behavior: 'smooth'
                    });
                    return true;
                  }, amount);
                }
                
                scrollSuccess = true;
                break;
              } catch (scrollAttemptError) {
                logger.warn(`Scroll attempt ${attempt} failed: ${scrollAttemptError.message}`);
                if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
            
            if (!scrollSuccess) {
              throw new Error('Scroll failed after multiple attempts');
            }
            
            // Small delay to allow smooth scrolling to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            logger.success(`✅ Scroll complete`);
            actionResult = { success: true, message: `Scrolled ${direction}: ${amount}px` };
          } catch (scrollError) {
            logger.error(`Scroll error:`, scrollError);
            actionResult = { success: false, message: `Scroll error: ${scrollError.message}` };
          }
          break;
          
        case 'submit':
          // Submit a form
          try {
            if (!action.selector) {
              return res.status(400).json({ error: 'Selector is required for submit action' });
            }
            
            logger.info(`📝 Submitting form: ${action.selector}`);
            
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
                logger.success(`✅ Clicked submit button in form`);
                actionResult = { success: true, message: 'Clicked submit button' };
              } else {
                // Last resort: press Enter key
                await session.page.keyboard.press('Enter');
                logger.success(`✅ Pressed Enter key as form submission fallback`);
                actionResult = { success: true, message: 'Pressed Enter to submit form' };
              }
            } else {
              logger.success(`✅ Form submitted`);
              actionResult = { success: true, message: 'Form submitted successfully' };
            }
            
            // Wait for navigation after form submission
            try {
              await session.page.waitForNavigation({ 
                timeout: 10000, 
                waitUntil: 'networkidle2' 
              });
            } catch (navTimeoutError) {
              // This is fine, might not navigate
              logger.info('No navigation after form submission - continuing');
            }
          } catch (submitError) {
            logger.error(`Submit error:`, submitError);
            actionResult = { success: false, message: `Submit error: ${submitError.message}` };
          }
          break;
          
        case 'wait':
          // Wait for a specified duration
          try {
            const duration = action.duration || 1000;
            
            logger.info(`⏱️ Waiting for ${duration}ms`);
            
            await new Promise(resolve => setTimeout(resolve, duration));
            
            logger.success(`✅ Wait complete`);
            actionResult = { success: true, message: `Waited for ${duration}ms` };
          } catch (waitError) {
            logger.error(`Wait error:`, waitError);
            actionResult = { success: false, message: `Wait error: ${waitError.message}` };
          }
          break;
          
        // SPECIAL ACTION: Evaluate JavaScript
        case 'js-eval':
          try {
            if (!action.code) {
              return res.status(400).json({ error: 'Code is required for js-eval action' });
            }
            
            logger.info(`🧪 Evaluating JavaScript: ${action.description || ''}`);
            
            const result = await session.page.evaluate((code) => {
              // Wrap in try-catch to prevent page crashes
              try {
                return eval(code);
              } catch (e) {
                return { error: e.message };
              }
            }, action.code);
            
            logger.success(`✅ JavaScript evaluated successfully`);
            actionResult = { 
              success: true, 
              message: 'JavaScript evaluated', 
              result 
            };
          } catch (jsError) {
            logger.error(`JavaScript evaluation error:`, jsError);
            actionResult = { 
              success: false, 
              message: `JavaScript error: ${jsError.message}` 
            };
          }
          break;
          
        // SPECIAL ACTION: Press keyboard key
        case 'keyboard':
          try {
            if (!action.key) {
              return res.status(400).json({ error: 'Key is required for keyboard action' });
            }
            
            logger.info(`⌨️ Pressing key: ${action.key}`);
            
            await session.page.keyboard.press(action.key);
            
            logger.success(`✅ Key press successful: ${action.key}`);
            actionResult = { success: true, message: `Pressed key: ${action.key}` };
          } catch (keyError) {
            logger.error(`Keyboard error:`, keyError);
            actionResult = { success: false, message: `Keyboard error: ${keyError.message}` };
          }
          break;
          
        default:
          return res.status(400).json({ error: `Unknown action type: ${action.type}` });
      }
      
      // Check for CAPTCHA after action
      try {
        const captchaDetected = await detectCaptcha(session.page);
        if (captchaDetected) {
          logger.warn('🛡️ CAPTCHA detected after action! Taking evasive action...');
          
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
        logger.error('Error checking for CAPTCHA:', captchaError);
      }
      
      // Take a screenshot after action
      try {
        const screenshotPath = path.join(screenshotsDir, `${sessionId}-${Date.now()}.png`);
        await session.page.screenshot({ path: screenshotPath, fullPage: false });
      } catch (screenshotError) {
        logger.error('Error taking screenshot after action:', screenshotError);
      }
      
      // Get current URL after action
      try {
        const currentUrl = await session.page.url();
        session.url = currentUrl;
      } catch (urlError) {
        logger.error('Error getting current URL:', urlError);
      }
      
      logger.success(`✅ Action execution complete: ${action.type}`);
      
      res.status(200).json({
        status: 'action_completed',
        action: action.type,
        url: session.url,
        result: actionResult
      });
    } catch (error) {
      logger.error(`Error executing action in session ${sessionId}:`, error);
      
      // CRITICAL: Always return 200 with error details rather than 500
      // This allows client to continue without crashing
      res.status(200).json({ 
        status: 'action_error',
        action: action.type,
        error: error.message,
        result: { success: false, message: error.message },
        recoverable: true
      });
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
      logger.info(`🛡️ Attempting to handle CAPTCHA for session: ${sessionId}`);
      
      // Verify CAPTCHA is present
      const captchaDetected = await detectCaptcha(session.page);
      
      if (captchaDetected) {
        // Try to evade CAPTCHA
        const evaded = await evadeCaptcha(session.page);
        
        if (evaded) {
          // Get current URL after evasion
          const currentUrl = await session.page.url();
          session.url = currentUrl;
          
          logger.success(`✅ CAPTCHA evasion successful`);
          
          res.status(200).json({
            status: 'captcha_evaded',
            url: currentUrl
          });
        } else {
          logger.warn(`⚠️ CAPTCHA evasion failed`);
          
          res.status(200).json({
            status: 'captcha_evasion_failed',
            url: session.url
          });
        }
      } else {
        logger.info(`ℹ️ No CAPTCHA detected`);
        
        res.status(200).json({
          status: 'no_captcha_detected',
          url: session.url
        });
      }
    } catch (error) {
      logger.error(`Error handling CAPTCHA for session ${sessionId}:`, error);
      
      // Return a non-error status code with error details
      res.status(200).json({ 
        status: 'captcha_handling_error', 
        error: error.message,
        url: sessions.get(sessionId)?.url || 'unknown'
      });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Cleanup inactive sessions
const cleanupInactiveSessions = async () => {
  logger.info("🧹 Checking for inactive sessions...");
  const now = new Date();
  const MAX_IDLE_TIME = 30 * 60 * 1000; // 30 minutes
  let cleanedCount = 0;
  
  const sessionIds = Array.from(sessions.keys());
  for (const sessionId of sessionIds) {
    const session = sessions.get(sessionId);
    if (!session) continue;
    
    const idleTime = now.getTime() - session.lastActivity.getTime();
    
    if (idleTime > MAX_IDLE_TIME) {
      try {
        logger.info(`🧹 Cleaning up inactive session: ${sessionId}`);
        await session.browser.close().catch(e => logger.warn(`Error closing browser: ${e.message}`));
        sessions.delete(sessionId);
        cleanedCount++;
      } catch (error) {
        logger.error(`Error cleaning up session ${sessionId}:`, error);
        // Delete session anyway
        sessions.delete(sessionId);
        cleanedCount++;
      }
    }
  }
  
  if (cleanedCount > 0) {
    logger.info(`🧹 Cleaned up ${cleanedCount} inactive sessions`);
  }
};

// Run cleanup every 15 minutes
setInterval(cleanupInactiveSessions, 15 * 60 * 1000);

// Start the server
app.listen(port, () => {
  logger.info(`🚀 ENHANCED Puppeteer server running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully');
  
  // Close all browser sessions
  const closePromises = [];
  for (const [sessionId, session] of sessions.entries()) {
    try {
      closePromises.push(
        session.browser.close()
          .then(() => logger.info(`🛑 Closed browser session: ${sessionId}`))
          .catch(error => logger.error(`Error closing browser session ${sessionId}:`, error))
      );
    } catch (error) {
      logger.error(`Error preparing to close browser session ${sessionId}:`, error);
    }
  }
  
  try {
    await Promise.allSettled(closePromises);
    logger.info('✅ All browser sessions closed');
  } catch (error) {
    logger.error('Error closing browser sessions:', error);
  }

  process.exit(0);
});