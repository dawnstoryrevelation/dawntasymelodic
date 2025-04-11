// src/server/proxy.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors());

// Proxy any requests to /api/firebase/* to the actual Firebase Function
app.use('/api/firebase', createProxyMiddleware({
  target: 'https://us-central1-dawntasyai.cloudfunctions.net',
  changeOrigin: true,
  pathRewrite: {
    '^/api/firebase': '', // Remove the /api/firebase prefix
  },
}));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

// Then update your Firebase function call in ChatView.vue to use:
// const functionUrl = 'http://localhost:3001/api/firebase/processAiRequest';