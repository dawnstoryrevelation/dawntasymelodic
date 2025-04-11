// ⚠️ EMERGENCY DEVELOPMENT MODE ONLY - COMPLETELY DISABLES CSP ⚠️
// Save as disable-csp.js and run with: node disable-csp.js

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3777; // Pick any port that's free

// Remove ALL security restrictions for development
app.use((req, res, next) => {
  // COMPLETELY DISABLE CSP
  res.setHeader('Content-Security-Policy', ""); 
  
  // Set permissive CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  next();
});

// Proxy ALL Firebase requests
app.use('/firebase-proxy', createProxyMiddleware({
  target: 'https://us-central1-dawntasyai.cloudfunctions.net',
  changeOrigin: true,
  pathRewrite: {
    '^/firebase-proxy': '',
  },
}));

// Proxy Firestore requests
app.use('/firestore-proxy', createProxyMiddleware({
  target: 'https://firestore.googleapis.com',
  changeOrigin: true,
  pathRewrite: {
    '^/firestore-proxy': '',
  },
}));

// Proxy RemixIcon CSS
app.use('/remix-proxy', createProxyMiddleware({
  target: 'https://cdn.jsdelivr.net',
  changeOrigin: true,
  pathRewrite: {
    '^/remix-proxy': '',
  },
}));

app.listen(PORT, () => {
  console.log(`
  🔥🔥🔥 NUCLEAR OPTION ACTIVATED! 🔥🔥🔥
  
  Dev proxy running on: http://localhost:${PORT}
  
  USAGE INSTRUCTIONS:
  1. Update your Firebase function calls to use:
     http://localhost:${PORT}/firebase-proxy/processAiRequest
  
  2. Update your Firestore URL to use:
     http://localhost:${PORT}/firestore-proxy
  
  3. Update RemixIcon CSS link to use:
     http://localhost:${PORT}/remix-proxy/npm/remixicon@2.5.0/fonts/remixicon.css
  
  ⚠️ FOR LOCAL DEVELOPMENT ONLY! EXTREMELY UNSAFE FOR PRODUCTION! ⚠️
  `);
});