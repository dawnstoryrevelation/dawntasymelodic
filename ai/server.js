// Express server with Socket.io, Puppeteer, and OpenAI integration
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const puppeteer = require('puppeteer');
const { OpenAI } = require('openai');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Your Vue app URL
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});

// Puppeteer browser instance
let browser;
let page;

// Initialize Puppeteer
async function initPuppeteer() {
  console.log('Initializing Puppeteer...');
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  console.log('Puppeteer initialized successfully');
}

// Take screenshot of current page
async function takeScreenshot() {
  if (!page) return null;
  const screenshot = await page.screenshot({ encoding: 'base64' });
  return screenshot;
}

// Generate random thinking actions
function getRandomThinkingAction() {
  const actions = [
    'Analyzing your request...',
    'Searching for information...',
    'Processing data...',
    'Evaluating options...',
    'Reviewing context...',
    'Connecting to web sources...',
    'Gathering relevant details...',
    'Preparing visual demonstration...',
    'Formulating response strategy...',
    'Organizing findings...',
    'Checking for accuracy...',
    'Finalizing analysis...',
    'Examining file contents...',
    'Cross-referencing information...',
    'Validating results...'
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

// Generate dynamic reasoning
async function generateReasoning(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI agent with computer browsing capabilities. Generate a detailed reasoning process (100-300 words) that explains your thought process for solving the user's task. Make it feel like real-time thinking with phrases like "Hmm, let me think about this..." and "I need to analyze...". Focus on how you would break down and approach the task step-by-step.`
        },
        { role: 'user', content: `Task: ${prompt}` }
      ],
      max_tokens: 500
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating reasoning:', error);
    return 'I\'m thinking about how to approach this problem effectively...';
  }
}

// Process image with OCR via GPT-4o Vision
async function processImageWithVision(base64Image) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant with vision capabilities. Extract all text and describe the content of the image provided.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Here is an image. Please extract all text and describe what you see.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error processing image with Vision:', error);
    return 'I was unable to process the image properly.';
  }
}

// Process text file
async function processTextFile(content, filename) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant analyzing a file named "${filename}". Provide a comprehensive analysis of its contents.`
        },
        {
          role: 'user',
          content: `Here is the content of the file: ${content.slice(0, 15000)}${content.length > 15000 ? '... (file truncated due to size)' : ''}`
        }
      ],
      max_tokens: 1000
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error processing text file:', error);
    return 'I was unable to process the file properly.';
  }
}

// Perform web browsing tasks with Puppeteer
async function performWebBrowsing(query) {
  try {
    // Navigate to Google
    await page.goto('https://www.google.com');
    
    // Type and search
    await page.waitForSelector('input[name="q"]');
    await page.type('input[name="q"]', query);
    await page.keyboard.press('Enter');
    
    // Wait for results
    await page.waitForSelector('#search');
    
    // Find and click on the first result
    await page.waitForSelector('.g a');
    const firstResultSelector = '.g a';
    await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      if (element) {
        // Scroll into view with a smooth effect
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, firstResultSelector);
    
    // Take a screenshot after scrolling
    const screenshot = await takeScreenshot();
    io.emit('screenshot', { screenshot });
    
    // Simulate thinking
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click the first result
    await page.click(firstResultSelector);
    
    // Wait for the page to load
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Take another screenshot after the page loads
    const newScreenshot = await takeScreenshot();
    io.emit('screenshot', { screenshot: newScreenshot });
    
    // Simulate scrolling down to read content
    await page.evaluate(() => {
      window.scrollBy(0, 300);
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const scrollScreenshot = await takeScreenshot();
    io.emit('screenshot', { screenshot: scrollScreenshot });
    
    // Scroll further
    await page.evaluate(() => {
      window.scrollBy(0, 300);
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const scrollScreenshot2 = await takeScreenshot();
    io.emit('screenshot', { screenshot: scrollScreenshot2 });
    
    // Extract content from the page
    const pageContent = await page.evaluate(() => {
      return document.body.innerText.slice(0, 8000); // Get first 8000 chars of content
    });
    
    // Get the page title
    const pageTitle = await page.title();
    const pageUrl = page.url();
    
    return {
      title: pageTitle,
      url: pageUrl,
      content: pageContent
    };
  } catch (error) {
    console.error('Error performing web browsing:', error);
    return {
      title: 'Error browsing web',
      url: 'N/A',
      content: 'I encountered an error while trying to browse the web for your query.'
    };
  }
}

// Generate response based on web browsing results
async function generateResponse(query, webResults) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI agent with web browsing capabilities. You've just performed a web search and visited a page for the user's query. Synthesize the information you found into a helpful response. Include relevant details from the page title, URL, and content. Format your response in a clean, readable way.`
        },
        {
          role: 'user',
          content: `Query: ${query}\n\nPage Title: ${webResults.title}\nURL: ${webResults.url}\nPage Content: ${webResults.content}`
        }
      ],
      max_tokens: 1000
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    return 'I was unable to generate a proper response based on the web search results.';
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Handle incoming messages
  socket.on('message', async (data) => {
    console.log('Received message:', data.content);
    
    // Emit initial thinking action
    socket.emit('thinking', { action: 'Analyzing your request...' });
    
    // Generate reasoning if enabled
    if (data.reasoning) {
      setTimeout(async () => {
        const reasoning = await generateReasoning(data.content);
        socket.emit('reasoning', { reasoning });
      }, 2000);
    }
    
    // Emit more thinking actions with random intervals
    const thinkingInterval = setInterval(() => {
      socket.emit('thinking', { action: getRandomThinkingAction() });
    }, 2500);
    
    try {
      let response = '';
      let showScreen = false;
      
      // Handle file processing if present
      if (data.file) {
        socket.emit('thinking', { action: 'Processing attached file...' });
        
        if (data.file.type.startsWith('image/')) {
          // Process image with GPT-4o Vision
          const base64Image = data.file.data.split(',')[1];
          const visionResult = await processImageWithVision(base64Image);
          response = `**Analysis of your image:**\n\n${visionResult}`;
        } else {
          // Process text-based file
          const fileContent = data.file.data;
          const fileAnalysis = await processTextFile(fileContent, data.file.name);
          response = `**Analysis of ${data.file.name}:**\n\n${fileAnalysis}`;
        }
      } else {
        // Check if query requires web browsing
        const needsWebBrowsing = /search|find|look up|browse|what is|how to|web/i.test(data.content);
        
        if (needsWebBrowsing) {
          showScreen = true;
          socket.emit('thinking', { action: 'Preparing web browsing session...' });
          
          // Take initial screenshot if puppeteer is initialized
          if (page) {
            const screenshot = await takeScreenshot();
            if (screenshot) {
              socket.emit('screenshot', { screenshot });
            }
          }
          
          // Perform web browsing
          const webResults = await performWebBrowsing(data.content);
          
          // Generate response based on web results
          response = await generateResponse(data.content, webResults);
        } else {
          // Regular OpenAI response for non-browsing queries
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are DawntasyAI, an advanced AI agent with computer use capabilities. Provide helpful, detailed responses to user queries.'
              },
              { role: 'user', content: data.content }
            ],
            max_tokens: 1000
          });
          
          response = completion.choices[0].message.content;
        }
      }
      
      // Clear thinking interval
      clearInterval(thinkingInterval);
      
      // Emit final response
      socket.emit('response', { content: response, showScreen });
    } catch (error) {
      console.error('Error processing message:', error);
      clearInterval(thinkingInterval);
      socket.emit('response', { 
        content: 'I encountered an error while processing your request. Please try again.',
        showScreen: false
      });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Shutdown handling
async function shutdownApp() {
  if (browser) {
    console.log('Closing Puppeteer browser...');
    await browser.close();
  }
  
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server shut down complete.');
    process.exit(0);
  });
}

// Handle process termination
process.on('SIGINT', shutdownApp);
process.on('SIGTERM', shutdownApp);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize Puppeteer
  await initPuppeteer();
});