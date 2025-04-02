// server/puppeteer-server.js - ULTIMATE BROWSING ENGINE FOR REAL-TIME AI ACTIONS!
import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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

// Session typing status tracker for real-time feedback
const typingStatus = new Map();

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// ENHANCED cleanupOldScreenshots with status reporting!
const cleanupOldScreenshots = () => {
  console.log("🧹 Cleaning up old screenshots...");
  const files = fs.readdirSync(screenshotsDir);
  const now = Date.now();
  let cleanedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(screenshotsDir, file);
    const stats = fs.statSync(filePath);
    const fileAge = now - stats.mtime.getTime();
    
    // Delete files older than 2 minutes (120000 ms) for FASTER CLEANUP
    if (fileAge > 120000) {
      fs.unlinkSync(filePath);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`🧹 Removed ${cleanedCount} old screenshots!`);
  }
};

// Run cleanup every 2 minutes for PERFORMANCE BOOST
setInterval(cleanupOldScreenshots, 2 * 60 * 1000);

// 🚀 TURBO-CHARGED SESSION CREATOR
app.post('/api/puppeteer/session', async (req, res) => {
  try {
    const sessionId = uuidv4();
    console.log(`🚀 CREATING NEW BROWSER SESSION: ${sessionId}`);
    
    // Launch with ULTIMATE POWER OPTIONS!
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
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security', // For cross-origin navigation
        '--allow-file-access-from-files'
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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36');
    
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
        get: () => [1, 2, 3, 4, 5].map(() => ({
          name: ['Chrome PDF Plugin', 'Chrome PDF Viewer', 'Native Client'][Math.floor(Math.random() * 3)],
          description: 'Portable Document Format',
          filename: 'internal-pdf-viewer',
          length: 1
        }))
      });
      
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
    
    // OPTIMIZED REQUEST INTERCEPTION - block ads but load essential content faster
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url().toLowerCase();
      const resourceType = request.resourceType();
      
      // Improved resource filtering - block ads/trackers but keep essential content
      if (
        (resourceType === 'image' && !url.includes('logo')) ||
        resourceType === 'media' ||
        (resourceType === 'font' && !url.includes('google')) ||
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
    
    // Initialize typing status for this session
    typingStatus.set(sessionId, {
      isTyping: false,
      text: '',
      selector: null,
      timestamp: Date.now()
    });
    
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
      // Real-time typing capability with enhanced buffer and speed
      streaming: {
        isTyping: false,
        currentSelector: null,
        textBuffer: '',
        targetText: '',
        typingSpeed: 30, // ms per character - FASTER TYPING!
        typingInterval: null
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
      const { browser, streaming } = sessions.get(sessionId);
      
      // Clear any active typing intervals
      if (streaming && streaming.typingInterval) {
        clearInterval(streaming.typingInterval);
      }
      
      await browser.close();
      sessions.delete(sessionId);
      typingStatus.delete(sessionId);
      
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
      
      // POWER MOVE: Use Google for startup!
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
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-init-${Date.now()}.jpg`);
      await session.page.screenshot({ 
        path: screenshotPath, 
        fullPage: false,
        type: 'jpeg',
        quality: 80
      });
      
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
      const { browser, streaming } = sessions.get(sessionId);
      
      // Clear any active typing intervals
      if (streaming && streaming.typingInterval) {
        clearInterval(streaming.typingInterval);
      }
      
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
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security',
          '--allow-file-access-from-files'
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
      await newPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36');
      
      // ANTI-DETECTION MEASURES
      await newPage.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false
        });
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en', 'es']
        });
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5].map(() => ({
            name: ['Chrome PDF Plugin', 'Chrome PDF Viewer', 'Native Client'][Math.floor(Math.random() * 3)],
            description: 'Portable Document Format',
            filename: 'internal-pdf-viewer',
            length: 1
          }))
        });
      });
      
      // Block unnecessary resources
      await newPage.setRequestInterception(true);
      newPage.on('request', (request) => {
        const url = request.url().toLowerCase();
        const resourceType = request.resourceType();
        
        if (
          (resourceType === 'image' && !url.includes('logo')) ||
          resourceType === 'media' ||
          (resourceType === 'font' && !url.includes('google')) ||
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
      
      // Navigate to Google
      await newPage.goto('https://www.google.com', {
        waitUntil: 'networkidle2'
      });
      
      // Reset typing status
      typingStatus.set(sessionId, {
        isTyping: false,
        text: '',
        selector: null,
        timestamp: Date.now()
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
          targetText: '',
          typingSpeed: 30,
          typingInterval: null
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
      
      // Stop any active typing
      if (session.streaming && session.streaming.typingInterval) {
        clearInterval(session.streaming.typingInterval);
        session.streaming.isTyping = false;
        session.streaming.textBuffer = '';
        session.streaming.targetText = '';
      }
      
      // Update typing status
      typingStatus.set(sessionId, {
        isTyping: false,
        text: '',
        selector: null,
        timestamp: Date.now()
      });
      
      console.log(`🔄 REFRESHING BROWSER SESSION: ${sessionId}`);
      
      // Refresh the current page
      await session.page.reload({
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Update session data
      session.lastActivity = new Date();
      session.status = 'refreshed';
      
      // Take screenshot after refresh
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-refresh-${Date.now()}.jpg`);
      await session.page.screenshot({ 
        path: screenshotPath, 
        fullPage: false,
        type: 'jpeg',
        quality: 80
      });
      
      console.log(`✅ BROWSER REFRESHED: ${sessionId}`);
      
      res.status(200).json({
        status: 'refreshed',
        url: session.url
      });
    } catch (error) {
      console.error(`💥 ERROR refreshing browser session ${sessionId}:`, error);
      
      // Try to recover even if refresh fails
      try {
        const session = sessions.get(sessionId);
        
        // Take screenshot anyway to show current state
        const screenshotPath = path.join(screenshotsDir, `${sessionId}-refresh-failed-${Date.now()}.jpg`);
        await session.page.screenshot({ 
          path: screenshotPath, 
          fullPage: false,
          type: 'jpeg',
          quality: 70
        });
        
        res.status(200).json({
          status: 'refresh_failed_but_continuing',
          url: session.url,
          error: error.message
        });
      } catch (secondError) {
        res.status(500).json({ error: error.message });
      }
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
      
      // Get current typing status
      const typing = typingStatus.get(sessionId) || { 
        isTyping: false, 
        text: '', 
        selector: null 
      };
      
      // Update last activity
      session.lastActivity = new Date();
      
      res.status(200).json({
        active: isActive,
        url: currentUrl,
        status: session.status,
        lastActivity: session.lastActivity,
        isTyping: typing.isTyping,
        typingText: typing.text,
        typingSelector: typing.selector
      });
    } catch (error) {
      console.error(`💥 ERROR getting status for session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// ULTRA-FAST SCREENSHOT with Smart Caching and Change Detection
app.get('/api/puppeteer/session/:sessionId/screenshot', async (req, res) => {
  const { sessionId } = req.params;
  const forceNewScreenshot = req.query.force === 'true';
  
  if (sessions.has(sessionId)) {
    try {
      const session = sessions.get(sessionId);
      
      // Check if session has screenshot cache data
      if (!session.lastScreenshotHash) {
        session.lastScreenshotHash = '';
        session.lastScreenshotPath = '';
        session.lastScreenshotTime = 0;
        session.consecutiveDuplicates = 0;
      }
      
      // Check if it's too soon for a new screenshot (debounce)
      const now = Date.now();
      const minTimeBetweenScreenshots = 150; // ms - FASTER UPDATES!
      
      if (!forceNewScreenshot && now - session.lastScreenshotTime < minTimeBetweenScreenshots) {
        // If called too frequently, send the previous screenshot
        if (session.lastScreenshotPath && fs.existsSync(session.lastScreenshotPath)) {
          return res.sendFile(session.lastScreenshotPath, {}, (err) => {
            if (err) console.error('Error sending cached screenshot:', err);
          });
        }
      }
      
      // Check if page has changed to avoid redundant screenshots
      const contentHash = await getPageContentHash(session.page);
      
      // If content hasn't changed and not forced, reuse last screenshot
      if (!forceNewScreenshot && 
          contentHash === session.lastScreenshotHash && 
          session.lastScreenshotPath && 
          fs.existsSync(session.lastScreenshotPath)) {
        
        session.consecutiveDuplicates++;
        session.lastScreenshotTime = now;
        
        // Only take new screenshot after many duplicates as failsafe
        if (session.consecutiveDuplicates < 10) {
          return res.sendFile(session.lastScreenshotPath, {}, (err) => {
            if (err) console.error('Error sending cached screenshot:', err);
          });
        } else {
          // Reset counter and force a new screenshot
          session.consecutiveDuplicates = 0;
        }
      }
      
      // Take a new screenshot - OPTIMIZED FOR SPEED
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-${Date.now()}.jpg`);
      await session.page.screenshot({ 
        path: screenshotPath, 
        fullPage: false,
        quality: 80,  // Balanced quality/speed
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

// Helper function to get content hash for change detection
async function getPageContentHash(page) {
  try {
    // Get simplified DOM hash to detect real changes
    const contentSignature = await page.evaluate(() => {
      // Focus on visible, important content
      const visibleText = Array.from(document.querySelectorAll('h1, h2, h3, p, input, button'))
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        })
        .map(el => {
          if (el.tagName === 'INPUT') {
            return `input:${el.value || ''}`;
          }
          return el.textContent;
        })
        .join('|').slice(0, 1000);
      
      // Add URL to make sure we detect page changes
      return document.location.href + '|' + visibleText;
    });
    
    // Create hash of the content
    return crypto.createHash('md5').update(contentSignature).digest('hex');
  } catch (error) {
    console.error('Error generating content hash:', error);
    // Return timestamp as fallback to force screenshot refresh
    return Date.now().toString();
  }
}

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
      
      // Stop any active typing
      if (session.streaming && session.streaming.typingInterval) {
        clearInterval(session.streaming.typingInterval);
        session.streaming.isTyping = false;
        session.streaming.textBuffer = '';
        session.streaming.targetText = '';
      }
      
      // Update typing status
      typingStatus.set(sessionId, {
        isTyping: false,
        text: '',
        selector: null,
        timestamp: Date.now()
      });
      
      // Validate and format URL
      let formattedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        formattedUrl = 'https://' + url;
      }
      
      console.log(`🌐 NAVIGATING TO URL: ${formattedUrl}`);
      
      // ENHANCED NAVIGATION WITH PROGRESS TRACKING
      await session.page.goto(formattedUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Update session data
      session.lastActivity = new Date();
      session.url = formattedUrl;
      session.status = 'navigated';
      session.performance.navigationCount++;
      
      // Create a page interaction animation
      await session.page.evaluate(() => {
        // Create a navigation feedback overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #3b82f6;
          z-index: 9999;
          animation: loadBar 0.5s ease-out forwards;
        `;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.innerHTML = `
          @keyframes loadBar {
            0% { width: 0; }
            100% { width: 100%; }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        
        // Remove after animation
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 600);
      });
      
      // Take a screenshot after navigation
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-navigate-${Date.now()}.jpg`);
      await session.page.screenshot({ 
        path: screenshotPath, 
        fullPage: false,
        type: 'jpeg',
        quality: 80
      });
      
      console.log(`✅ NAVIGATION COMPLETE: ${formattedUrl}`);
      
      res.status(200).json({
        status: 'navigated',
        url: formattedUrl
      });
    } catch (error) {
      console.error(`💥 ERROR navigating to URL in session ${sessionId}:`, error);
      
      // Try to capture current state even after error
      try {
        const session = sessions.get(sessionId);
        const screenshotPath = path.join(screenshotsDir, `${sessionId}-navigate-error-${Date.now()}.jpg`);
        await session.page.screenshot({ 
          path: screenshotPath, 
          fullPage: false,
          type: 'jpeg',
          quality: 70 
        });
      } catch (screenshotError) {
        console.error('Error capturing error screenshot:', screenshotError);
      }
      
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// REAL-TIME Get typing status endpoint
app.get('/api/puppeteer/session/:sessionId/typing-status', async (req, res) => {
  const { sessionId } = req.params;
  
  if (sessions.has(sessionId)) {
    try {
      // Get the latest typing status
      const typing = typingStatus.get(sessionId) || { 
        isTyping: false, 
        text: '', 
        selector: null,
        timestamp: Date.now()
      };
      
      res.status(200).json(typing);
    } catch (error) {
      console.error('Error getting typing status:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// 💪 ULTIMATE BROWSER ACTION EXECUTOR - ENHANCED FOR REAL-TIME FEEDBACK!
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
            
            // Stop any active typing
            if (session.streaming && session.streaming.typingInterval) {
              clearInterval(session.streaming.typingInterval);
              session.streaming.isTyping = false;
              session.streaming.textBuffer = '';
              session.streaming.targetText = '';
            }
            
            // Update typing status
            typingStatus.set(sessionId, {
              isTyping: false,
              text: '',
              selector: null,
              timestamp: Date.now()
            });
            
            // POWER NAVIGATION with VISUAL FEEDBACK!
            await session.page.evaluate((url) => {
              // Show navigation feedback
              const overlay = document.createElement('div');
              overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: #3b82f6;
                z-index: 9999;
                animation: loadBar 0.5s ease-out forwards;
              `;
              
              // Add animation keyframes
              const style = document.createElement('style');
              style.innerHTML = `
                @keyframes loadBar {
                  0% { width: 0; }
                  100% { width: 100%; }
                }
              `;
              document.head.appendChild(style);
              document.body.appendChild(overlay);
              
              // Create status indicator
              const status = document.createElement('div');
              status.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                padding: 8px 12px;
                background: rgba(59, 130, 246, 0.9);
                color: white;
                border-radius: 4px;
                font-family: sans-serif;
                font-size: 12px;
                z-index: 9999;
              `;
              status.textContent = `Navigating to ${url}...`;
              document.body.appendChild(status);
              
              // Remove after animation
              setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                if (status.parentNode) status.parentNode.removeChild(status);
              }, 1000);
            }, formattedUrl);
            
            // Perform navigation
            await session.page.goto(formattedUrl, {
              waitUntil: 'networkidle2',
              timeout: 30000
            });
            
            console.log(`✅ NAVIGATION COMPLETE: ${formattedUrl}`);
            
            session.url = formattedUrl;
            session.performance.navigationCount++;
          } catch (navError) {
            console.error(`⚠️ Navigation error but CONTINUING:`, navError);
            
            // Try to capture current state even after error
            try {
              const screenshotPath = path.join(screenshotsDir, `${sessionId}-navigate-error-${Date.now()}.jpg`);
              await session.page.screenshot({ 
                path: screenshotPath, 
                fullPage: false,
                type: 'jpeg',
                quality: 70 
              });
            } catch (screenshotError) {
              console.error('Error capturing error screenshot:', screenshotError);
            }
            
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
                    // Get element position for cursor animation
                    const rect = element.getBoundingClientRect();
                    
                    // Create cursor element
                    const cursor = document.createElement('div');
                    cursor.style.cssText = `
                      position: fixed;
                      width: 20px;
                      height: 20px;
                      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path></svg>');
                      background-size: contain;
                      background-repeat: no-repeat;
                      z-index: 9999;
                      pointer-events: none;
                      transform-origin: top left;
                    `;
                    document.body.appendChild(cursor);
                    
                    // Animate cursor to element
                    const startX = window.innerWidth * 0.7;
                    const startY = window.innerHeight * 0.3;
                    const targetX = rect.left + rect.width/2;
                    const targetY = rect.top + rect.height/2;
                    
                    cursor.style.left = `${startX}px`;
                    cursor.style.top = `${startY}px`;
                    
                    // Add animation
                    cursor.animate([
                      { left: `${startX}px`, top: `${startY}px` },
                      { left: `${targetX}px`, top: `${targetY}px` }
                    ], {
                      duration: 500,
                      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                      fill: 'forwards'
                    });
                    
                    // Simulate click after cursor reaches target
                    setTimeout(() => {
                      // Add click animation
                      cursor.animate([
                        { transform: 'scale(1)' },
                        { transform: 'scale(0.8)' },
                        { transform: 'scale(1)' }
                      ], {
                        duration: 300,
                        easing: 'ease-in-out'
                      });
                      
                      // Add element highlight effect
                      const originalOutline = element.style.outline;
                      const originalTransition = element.style.transition;
                      
                      element.style.outline = '3px solid #ef4444';
                      element.style.transition = 'all 0.3s ease';
                      
                      // Create ripple effect
                      const ripple = document.createElement('div');
                      ripple.style.cssText = `
                        position: fixed;
                        left: ${targetX}px;
                        top: ${targetY}px;
                        width: 20px;
                        height: 20px;
                        background-color: rgba(239, 68, 68, 0.6);
                        border-radius: 50%;
                        transform: translate(-50%, -50%);
                        pointer-events: none;
                        z-index: 9998;
                      `;
                      document.body.appendChild(ripple);
                      
                      // Animate ripple
                      ripple.animate([
                        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                        { transform: 'translate(-50%, -50%) scale(3)', opacity: 0 }
                      ], {
                        duration: 500,
                        easing: 'ease-out',
                        fill: 'forwards'
                      });
                      
                      // Remove effects after animation
                      setTimeout(() => {
                        element.style.outline = originalOutline;
                        element.style.transition = originalTransition;
                        
                        if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
                        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
                      }, 500);
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
                    const rect = element.getBoundingClientRect();
                    
                    // Create ripple effect
                    const ripple = document.createElement('div');
                    ripple.style.cssText = `
                      position: fixed;
                      left: ${rect.left + rect.width/2}px;
                      top: ${rect.top + rect.height/2}px;
                      width: 20px;
                      height: 20px;
                      background-color: rgba(239, 68, 68, 0.6);
                      border-radius: 50%;
                      transform: translate(-50%, -50%);
                      pointer-events: none;
                      z-index: 9998;
                    `;
                    document.body.appendChild(ripple);
                    
                    // Animate ripple
                    ripple.animate([
                      { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                      { transform: 'translate(-50%, -50%) scale(3)', opacity: 0 }
                    ], {
                      duration: 500,
                      easing: 'ease-out',
                      fill: 'forwards'
                    });
                    
                    // Click with delay
                    setTimeout(() => {
                      element.click();
                      
                      // Remove ripple after animation
                      setTimeout(() => {
                        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
                      }, 500);
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
                // First try exact visible elements
                const allElements = document.querySelectorAll('a, button, [role="button"], input[type="submit"], [role="link"], .btn, div[onclick], span[onclick], p[onclick], li, td, th');
                const lowerSearchText = searchText.toLowerCase();
                
                // Find elements with matching text
                const matchingElements = Array.from(allElements).filter(el => {
                  const text = el.innerText || el.textContent || el.value || '';
                  return text.toLowerCase().includes(lowerSearchText);
                });
                
                // Sort matches by how well they match
                matchingElements.sort((a, b) => {
                  const aText = (a.innerText || a.textContent || a.value || '').toLowerCase();
                  const bText = (b.innerText || b.textContent || b.value || '').toLowerCase();
                  
                  // Exact matches come first
                  if (aText === lowerSearchText && bText !== lowerSearchText) return -1;
                  if (bText === lowerSearchText && aText !== lowerSearchText) return 1;
                  
                  // Then partial matches by length (shorter is better)
                  return aText.length - bText.length;
                });
                
                if (matchingElements.length > 0) {
                  const bestMatch = matchingElements[0];
                  
                  // Get element position for visual effects
                  const rect = bestMatch.getBoundingClientRect();
                  
                  // Create ripple effect
                  const ripple = document.createElement('div');
                  ripple.style.cssText = `
                    position: fixed;
                    left: ${rect.left + rect.width/2}px;
                    top: ${rect.top + rect.height/2}px;
                    width: 20px;
                    height: 20px;
                    background-color: rgba(239, 68, 68, 0.6);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    z-index: 9998;
                  `;
                  document.body.appendChild(ripple);
                  
                  // Animate ripple
                  ripple.animate([
                    { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                    { transform: 'translate(-50%, -50%) scale(3)', opacity: 0 }
                  ], {
                    duration: 500,
                    easing: 'ease-out',
                    fill: 'forwards'
                  });
                  
                  // Create highlight around element
                  const highlight = document.createElement('div');
                  highlight.style.cssText = `
                    position: fixed;
                    left: ${rect.left}px;
                    top: ${rect.top}px;
                    width: ${rect.width}px;
                    height: ${rect.height}px;
                    outline: 3px solid #ef4444;
                    pointer-events: none;
                    z-index: 9997;
                  `;
                  document.body.appendChild(highlight);
                  
                  // Click with delay
                  setTimeout(() => {
                    bestMatch.click();
                    
                    // Remove effects after animation
                    setTimeout(() => {
                      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
                      if (highlight.parentNode) highlight.parentNode.removeChild(highlight);
                    }, 500);
                  }, 300);
                  
                  return true;
                }
                
                return false;
              }, action.text);
              
              if (!clickedByText) {
                console.log(`⚠️ Could not find element with text: ${action.text}, attempting search result click`);
                
                // Special handling for search results
                const clickedSearchResult = await session.page.evaluate((searchText) => {
                  // Create helper function to find search results
                  function findSearchResults() {
                    // Google search results
                    const googleResults = document.querySelectorAll('#search .g, .yuRUbf > a, .rc .r a, .tF2Cxc, .jtfYYd, [data-header-feature] a');
                    if (googleResults.length > 0) return Array.from(googleResults);
                    
                    // Fallback to any links in the page
                    return Array.from(document.querySelectorAll('a[href]:not([href^="#"])'))
                      .filter(a => {
                        // Filter for visible links with text
                        const rect = a.getBoundingClientRect();
                        const hasSize = rect.width > 0 && rect.height > 0;
                        const hasText = (a.innerText || a.textContent || '').trim().length > 0;
                        return hasSize && hasText;
                      });
                  }
                  
                  const searchResults = findSearchResults();
                  const lowerSearchText = searchText.toLowerCase();
                  
                  for (const result of searchResults) {
                    const resultText = (result.innerText || result.textContent || '').toLowerCase();
                    if (resultText.includes(lowerSearchText)) {
                      // Get element position for visual effects
                      const rect = result.getBoundingClientRect();
                      
                      // Create ripple effect
                      const ripple = document.createElement('div');
                      ripple.style.cssText = `
                        position: fixed;
                        left: ${rect.left + rect.width/2}px;
                        top: ${rect.top + rect.height/2}px;
                        width: 20px;
                        height: 20px;
                        background-color: rgba(239, 68, 68, 0.6);
                        border-radius: 50%;
                        transform: translate(-50%, -50%);
                        pointer-events: none;
                        z-index: 9998;
                      `;
                      document.body.appendChild(ripple);
                      
                      // Animate ripple
                      ripple.animate([
                        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                        { transform: 'translate(-50%, -50%) scale(3)', opacity: 0 }
                      ], {
                        duration: 500,
                        easing: 'ease-out',
                        fill: 'forwards'
                      });
                      
                      // Create highlight around element
                      const highlight = document.createElement('div');
                      highlight.style.cssText = `
                        position: fixed;
                        left: ${rect.left}px;
                        top: ${rect.top}px;
                        width: ${rect.width}px;
                        height: ${rect.height}px;
                        outline: 3px solid #ef4444;
                        pointer-events: none;
                        z-index: 9997;
                      `;
                      document.body.appendChild(highlight);
                      
                      // Click with delay
                      setTimeout(() => {
                        result.click();
                        
                        // Remove effects after animation
                        setTimeout(() => {
                          if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
                          if (highlight.parentNode) highlight.parentNode.removeChild(highlight);
                        }, 500);
                      }, 300);
                      
                      return true;
                    }
                  }
                  
                  return false;
                }, action.text);
                
                if (!clickedSearchResult) {
                  console.log(`⚠️ Could not find search result with text: ${action.text}, but continuing`);
                } else {
                  console.log(`✅ CLICKED SEARCH RESULT with text containing: ${action.text}`);
                }
              } else {
                console.log(`✅ CLICKED ELEMENT with text: ${action.text}`);
              }
            } else {
              return res.status(400).json({ error: 'Selector or text is required for click action' });
            }
            
            session.performance.clickCount++;
            
            // Wait for potential page load - but with shorter timeout
            try {
              await session.page.waitForNavigation({ timeout: 5000, waitUntil: 'networkidle2' });
            } catch (navTimeoutError) {
              // This is fine, might not navigate
              console.log('No navigation after click - continuing');
            }
          } catch (clickActionError) {
            console.error(`⚠️ Click error but CONTINUING:`, clickActionError);
            
            // Try to capture current state even after error
            try {
              const screenshotPath = path.join(screenshotsDir, `${sessionId}-click-error-${Date.now()}.jpg`);
              await session.page.screenshot({ 
                path: screenshotPath, 
                fullPage: false,
                type: 'jpeg',
                quality: 70 
              });
            } catch (screenshotError) {
              console.error('Error capturing error screenshot:', screenshotError);
            }
            
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
            
            // Stop any previous typing
            if (session.streaming && session.streaming.typingInterval) {
              clearInterval(session.streaming.typingInterval);
            }
            
            // Set up session streaming status for REAL-TIME TYPING!
            session.streaming.isTyping = true;
            session.streaming.currentSelector = action.selector;
            session.streaming.textBuffer = '';
            session.streaming.targetText = action.text;
            
            // Update typing status for status endpoint
            typingStatus.set(sessionId, {
              isTyping: true,
              text: '',
              selector: action.selector,
              timestamp: Date.now()
            });
            
            // GOOGLE SEARCH BOX SPECIAL HANDLING - SUPERCHARGED! 🔥
            if (action.selector === 'input[name="q"]' || 
                action.selector.includes('search') || 
                action.selector.includes('query')) {
              
              console.log(`🔍 SPECIAL HANDLING for search input: "${action.text}"`);
              
              try {
                // First, clear the input and focus it with visual effects
                await session.page.evaluate((selector) => {
                  const searchInput = document.querySelector(selector);
                  if (searchInput) {
                    // Focus the input with visual effect
                    searchInput.focus();
                    
                    // Add visual focus effect
                    const originalBoxShadow = searchInput.style.boxShadow;
                    searchInput.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.7)';
                    
                    // Clear the input field
                    searchInput.value = '';
                    
                    // Dispatch events for clearing
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // Return true to indicate success
                    return true;
                  }
                  return false;
                }, action.selector);
                
                // REAL-TIME CHARACTER-BY-CHARACTER TYPING! 🔤
                let currentText = '';
                let charIndex = 0;
                
                // Setup typing interval for real-time updates
                session.streaming.typingInterval = setInterval(async () => {
                  if (charIndex < action.text.length) {
                    const char = action.text[charIndex];
                    currentText += char;
                    charIndex++;
                    
                    // Update streaming status
                    session.streaming.textBuffer = currentText;
                    
                    // Update global typing status for status endpoint
                    typingStatus.set(sessionId, {
                      isTyping: true,
                      text: currentText,
                      selector: action.selector,
                      timestamp: Date.now()
                    });
                    
                    // Type the current character in the browser
                    try {
                      await session.page.evaluate((selector, text) => {
                        const input = document.querySelector(selector);
                        if (input) {
                          input.value = text;
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                          return true;
                        }
                        return false;
                      }, action.selector, currentText);
                    } catch (typeError) {
                      console.error('Error during character typing:', typeError);
                      // Continue typing even if this character fails
                    }
                  } else {
                    // Typing complete
                    clearInterval(session.streaming.typingInterval);
                    session.streaming.typingInterval = null;
                    session.streaming.isTyping = false;
                    
                    // Update typing status
                    typingStatus.set(sessionId, {
                      isTyping: false,
                      text: currentText,
                      selector: action.selector,
                      timestamp: Date.now()
                    });
                    
                    console.log(`✅ COMPLETED TYPING: "${action.text}"`);
                  }
                }, session.streaming.typingSpeed);
                
                // Return success immediately rather than waiting for typing to complete
                return res.status(200).json({
                  status: 'typing_in_progress',
                  selector: action.selector,
                  text: action.text
                });
              } catch (searchBoxError) {
                console.error('Error with search box typing:', searchBoxError);
                
                // Stop any ongoing typing
                if (session.streaming && session.streaming.typingInterval) {
                  clearInterval(session.streaming.typingInterval);
                  session.streaming.typingInterval = null;
                }
                
                // Reset typing status
                session.streaming.isTyping = false;
                typingStatus.set(sessionId, {
                  isTyping: false,
                  text: '',
                  selector: null,
                  timestamp: Date.now()
                });
                
                // Try a more direct approach as fallback
                try {
                  await session.page.type(action.selector, action.text);
                  console.log(`✅ TYPED TEXT using fallback: "${action.text}"`);
                  
                  session.performance.typeCount++;
                  return res.status(200).json({
                    status: 'typed_with_fallback',
                    selector: action.selector,
                    text: action.text
                  });
                } catch (fallbackError) {
                  console.error('Fallback typing also failed:', fallbackError);
                  throw fallbackError; // Let the outer catch handle it
                }
              }
            } else {
              // REGULAR INPUT FIELDS with real-time typing
              try {
                await session.page.waitForSelector(action.selector, { timeout: 5000 });
                
                // Clear existing text first
                await session.page.evaluate(
                  selector => { 
                    const element = document.querySelector(selector);
                    if (element) {
                      element.value = '';
                      element.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  },
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
                let currentText = '';
                let charIndex = 0;
                
                // Setup typing interval for real-time updates
                session.streaming.typingInterval = setInterval(async () => {
                  if (charIndex < action.text.length) {
                    const char = action.text[charIndex];
                    currentText += char;
                    charIndex++;
                    
                    // Update streaming status
                    session.streaming.textBuffer = currentText;
                    
                    // Update global typing status for status endpoint
                    typingStatus.set(sessionId, {
                      isTyping: true,
                      text: currentText,
                      selector: action.selector,
                      timestamp: Date.now()
                    });
                    
                    // Type the current character in the browser
                    try {
                      await session.page.type(action.selector, char, { delay: 0 });
                    } catch (typeError) {
                      console.error('Error during character typing:', typeError);
                      // Try fallback method if standard typing fails
                      try {
                        await session.page.evaluate((selector, text) => {
                          const input = document.querySelector(selector);
                          if (input) {
                            input.value = text;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                          }
                        }, action.selector, currentText);
                      } catch (fallbackError) {
                        console.error('Fallback typing method also failed:', fallbackError);
                      }
                    }
                    
                    // Take screenshot periodically during typing
                    if (charIndex % 5 === 0) {
                      try {
                        const screenshotPath = path.join(screenshotsDir, `${sessionId}-typing-${Date.now()}.jpg`);
                        await session.page.screenshot({ 
                          path: screenshotPath, 
                          fullPage: false,
                          type: 'jpeg',
                          quality: 75
                        });
                      } catch (screenshotError) {
                        console.error('Error taking typing screenshot:', screenshotError);
                      }
                    }
                  } else {
                    // Typing complete
                    clearInterval(session.streaming.typingInterval);
                    session.streaming.typingInterval = null;
                    session.streaming.isTyping = false;
                    
                    // Update typing status
                    typingStatus.set(sessionId, {
                      isTyping: false,
                      text: currentText,
                      selector: action.selector,
                      timestamp: Date.now()
                    });
                    
                    console.log(`✅ COMPLETED TYPING: "${action.text}"`);
                    
                    // Take final screenshot after typing
                    try {
                      const screenshotPath = path.join(screenshotsDir, `${sessionId}-typing-complete-${Date.now()}.jpg`);
                      await session.page.screenshot({ 
                        path: screenshotPath, 
                        fullPage: false,
                        type: 'jpeg',
                        quality: 80
                      });
                    } catch (screenshotError) {
                      console.error('Error taking final typing screenshot:', screenshotError);
                    }
                  }
                }, session.streaming.typingSpeed);
                
                // Return success immediately rather than waiting for typing to complete
                return res.status(200).json({
                  status: 'typing_in_progress',
                  selector: action.selector,
                  text: action.text
                });
              } catch (typeError) {
                console.error('Initial typing setup failed:', typeError);
                
                // Stop any ongoing typing
                if (session.streaming && session.streaming.typingInterval) {
                  clearInterval(session.streaming.typingInterval);
                  session.streaming.typingInterval = null;
                }
                
                // Reset typing status
                session.streaming.isTyping = false;
                typingStatus.set(sessionId, {
                  isTyping: false,
                  text: '',
                  selector: null,
                  timestamp: Date.now()
                });
                
                // Try JavaScript injection as fallback
                console.log(`⚠️ Standard typing failed, trying JavaScript injection...`);
                
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
                
                session.performance.typeCount++;
                return res.status(200).json({
                  status: 'typed_with_fallback',
                  selector: action.selector,
                  text: action.text
                });
              }
            }
            
            // This code is only reached if the character-by-character typing setup fails
            session.streaming.isTyping = false;
            session.streaming.textBuffer = '';
            typingStatus.set(sessionId, {
              isTyping: false,
              text: '',
              selector: null,
              timestamp: Date.now()
            });
            
            session.performance.typeCount++;
            
            // Direct typing as final fallback
            await session.page.type(action.selector, action.text, { delay: 20 });
            
            return res.status(200).json({
              status: 'typed_direct',
              selector: action.selector,
              text: action.text
            });
          } catch (typeActionError) {
            console.error(`⚠️ Type error but CONTINUING:`, typeActionError);
            
            // Reset typing status
            session.streaming.isTyping = false;
            session.streaming.textBuffer = '';
            typingStatus.set(sessionId, {
              isTyping: false,
              text: '',
              selector: null,
              timestamp: Date.now()
            });
            
            // Try to capture current state even after error
            try {
              const screenshotPath = path.join(screenshotsDir, `${sessionId}-type-error-${Date.now()}.jpg`);
              await session.page.screenshot({ 
                path: screenshotPath, 
                fullPage: false,
                type: 'jpeg',
                quality: 70 
              });
            } catch (screenshotError) {
              console.error('Error capturing error screenshot:', screenshotError);
            }
            
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
            
            // SMOOTH SCROLLING implementation with visual effects!
            await session.page.evaluate(({ direction, amount }) => {
              // Create scroll indicator element
              const createScrollIndicator = () => {
                const indicator = document.createElement('div');
                indicator.style.cssText = `
                  position: fixed;
                  right: 20px;
                  top: 50%;
                  width: 30px;
                  height: 50px;
                  background-color: rgba(59, 130, 246, 0.2);
                  border-radius: 15px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  z-index: 9999;
                  transform: translateY(-50%);
                  pointer-events: none;
                `;
                
                // Create arrow element
                const arrow = document.createElement('div');
                arrow.style.cssText = `
                  width: 12px;
                  height: 12px;
                  border-style: solid;
                  border-width: 0 2px 2px 0;
                  border-color: rgba(59, 130, 246, 0.8);
                  transform: ${direction === 'down' ? 'rotate(45deg)' : 'rotate(-135deg)'};
                  ${direction === 'down' ? 'margin-top: -5px;' : 'margin-bottom: -5px;'}
                `;
                
                indicator.appendChild(arrow);
                document.body.appendChild(indicator);
                
                // Animate arrow
                let animateArrow;
                if (direction === 'down') {
                  animateArrow = [
                    { transform: 'rotate(45deg) translate(0, 0)' },
                    { transform: 'rotate(45deg) translate(0, 5px)' },
                    { transform: 'rotate(45deg) translate(0, 0)' }
                  ];
                } else {
                  animateArrow = [
                    { transform: 'rotate(-135deg) translate(0, 0)' },
                    { transform: 'rotate(-135deg) translate(0, -5px)' },
                    { transform: 'rotate(-135deg) translate(0, 0)' }
                  ];
                }
                
                arrow.animate(animateArrow, {
                  duration: 1000,
                  iterations: Infinity
                });
                
                return indicator;
              };
              
              const scrollIndicator = createScrollIndicator();
              
              // Smooth scrolling animation
              return new Promise((resolve) => {
                const duration = 800; // ms
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
                    // Remove indicator after scrolling
                    setTimeout(() => {
                      if (scrollIndicator.parentNode) {
                        scrollIndicator.parentNode.removeChild(scrollIndicator);
                      }
                      resolve();
                    }, 200);
                  }
                }
                
                window.requestAnimationFrame(step);
              });
            }, { direction, amount });
            
            // Take scrolling screenshots
            for (let i = 0; i < 2; i++) {
              await new Promise(r => setTimeout(r, 150));
              const screenshotPath = path.join(screenshotsDir, `${sessionId}-scroll-${i}-${Date.now()}.jpg`);
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
            
            // Try to capture current state even after error
            try {
              const screenshotPath = path.join(screenshotsDir, `${sessionId}-scroll-error-${Date.now()}.jpg`);
              await session.page.screenshot({ 
                path: screenshotPath, 
                fullPage: false,
                type: 'jpeg',
                quality: 70 
              });
            } catch (screenshotError) {
              console.error('Error capturing error screenshot:', screenshotError);
            }
            
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
            
            // Try to capture current state even after error
            try {
              const screenshotPath = path.join(screenshotsDir, `${sessionId}-submit-error-${Date.now()}.jpg`);
              await session.page.screenshot({ 
                path: screenshotPath, 
                fullPage: false,
                type: 'jpeg',
                quality: 70 
              });
            } catch (screenshotError) {
              console.error('Error capturing error screenshot:', screenshotError);
            }
            
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
            
            // Show visual timer on page for waits
            await session.page.evaluate((duration) => {
              // Create timer element
              const timer = document.createElement('div');
              timer.id = 'ai-agent-timer';
              timer.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(59, 130, 246, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-family: sans-serif;
                font-size: 12px;
                z-index: 9999;
                transition: opacity 0.3s ease;
              `;
              
              // Add countdown display
              timer.textContent = `Waiting: ${Math.ceil(duration/1000)}s`;
              document.body.appendChild(timer);
              
              // Update timer
              const startTime = Date.now();
              const endTime = startTime + duration;
              
              const interval = setInterval(() => {
                const remaining = Math.max(0, endTime - Date.now());
                timer.textContent = `Waiting: ${Math.ceil(remaining/1000)}s`;
                
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
                    
                    // Create cursor element
                    const cursor = document.createElement('div');
                    cursor.style.cssText = `
                      position: fixed;
                      width: 20px;
                      height: 20px;
                      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path></svg>');
                      background-size: contain;
                      background-repeat: no-repeat;
                      z-index: 9999;
                      pointer-events: none;
                    `;
                    document.body.appendChild(cursor);
                    
                    // Animate cursor to checkbox
                    const startX = window.innerWidth * 0.7;
                    const startY = window.innerHeight * 0.3;
                    const targetX = rect.left + rect.width/2;
                    const targetY = rect.top + rect.height/2;
                    
                    cursor.style.left = `${startX}px`;
                    cursor.style.top = `${startY}px`;
                    
                    cursor.animate([
                      { left: `${startX}px`, top: `${startY}px` },
                      { left: `${targetX}px`, top: `${targetY}px` }
                    ], {
                      duration: 1000,
                      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                      fill: 'forwards'
                    });
                    
                    // Click after cursor reaches target
                    setTimeout(() => {
                      // Create mousedown event
                      checkbox.dispatchEvent(new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: targetX,
                        clientY: targetY
                      }));
                      
                      // Create mouseup/click events with slight delay
                      setTimeout(() => {
                        checkbox.dispatchEvent(new MouseEvent('mouseup', {
                          bubbles: true,
                          cancelable: true,
                          view: window,
                          clientX: targetX,
                          clientY: targetY
                        }));
                        checkbox.click();
                        
                        // Remove cursor after click
                        setTimeout(() => {
                          if (cursor.parentNode) {
                            cursor.parentNode.removeChild(cursor);
                          }
                        }, 500);
                      }, 120);
                    }, 1000);
                  }
                });
                
                await new Promise(r => setTimeout(r, 2000));
              } else if (captchaResult.type === 'cloudflare') {
                // For CloudFlare, we often just need to wait
                console.log('⏱️ Waiting for CloudFlare check to complete...');
                await new Promise(r => setTimeout(r, 8000));
              }
              
              // Take screenshot after CAPTCHA attempt
              const screenshotPath = path.join(screenshotsDir, `${sessionId}-captcha-attempt-${Date.now()}.jpg`);
              await session.page.screenshot({ 
                path: screenshotPath, 
                fullPage: false,
                type: 'jpeg',
                quality: 80
              });
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
      const screenshotPath = path.join(screenshotsDir, `${sessionId}-${Date.now()}.jpg`);
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
      
      // Update session status
      if (sessions.has(sessionId)) {
        const session = sessions.get(sessionId);
        
        // Clean up any hanging typing operations
        if (session.streaming && session.streaming.typingInterval) {
          clearInterval(session.streaming.typingInterval);
          session.streaming.typingInterval = null;
          session.streaming.isTyping = false;
          session.streaming.textBuffer = '';
        }
        
        // Update typing status
        typingStatus.set(sessionId, {
          isTyping: false,
          text: '',
          selector: null,
          timestamp: Date.now()
        });
        
        session.status = 'error';
      }
      
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
  const MAX_IDLE_TIME = 20 * 60 * 1000; // 20 minutes
  let cleanedCount = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    const idleTime = now.getTime() - session.lastActivity.getTime();
    
    if (idleTime > MAX_IDLE_TIME) {
      try {
        console.log(`🧹 Cleaning up inactive session: ${sessionId}`);
        
        // Clean up typing interval if present
        if (session.streaming && session.streaming.typingInterval) {
          clearInterval(session.streaming.typingInterval);
        }
        
        await session.browser.close();
        sessions.delete(sessionId);
        typingStatus.delete(sessionId);
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

// Run cleanup every 10 minutes
setInterval(cleanupInactiveSessions, 10 * 60 * 1000);

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
      // Clean up typing interval if present
      if (session.streaming && session.streaming.typingInterval) {
        clearInterval(session.streaming.typingInterval);
      }
      
      await session.browser.close();
      console.log(`🛑 Closed browser session: ${sessionId}`);
    } catch (error) {
      console.error(`💥 ERROR closing browser session ${sessionId}:`, error);
    }
  }
  
  process.exit(0);
});