// backend/src/routes/proxy.js
const express = require('express');
const router = express.Router();
const proxyController = require('../controllers/proxyController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

// Proxy chat completion requests
router.post('/chat/completions', 
  authMiddleware.authenticate, // Basic authentication required
  // Provider-specific rate limiting will be applied within the controller
  proxyController.chatCompletion
);

// Generic proxy endpoint for other API requests to providers
router.post('/', 
  authMiddleware.authenticate, // Basic authentication required
  proxyController.proxyRequest
);

// Additional endpoints can be added as needed for specific provider functionality
// For example, embeddings, image generation, etc.

module.exports = router;