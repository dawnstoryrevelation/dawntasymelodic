// src/devServer.js - USE THIS FOR LOCAL DEVELOPMENT ONLY!
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable CORS for all requests
app.use(cors({ origin: '*' }));

// Disable CSP for local development
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', ""); // Empty CSP = no restrictions
  next();
});

// Proxy Firebase functions
app.use('/api/firebase', createProxyMiddleware({
  target: 'https://us-central1-dawntasyai.cloudfunctions.net',
  changeOrigin: true,
  pathRewrite: {
    '^/api/firebase': '',
  },
}));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🔥 Development proxy server running at http://localhost:${PORT}`);
  console.log(`🛡️ CSP disabled for development! DON'T USE IN PRODUCTION!`);
});