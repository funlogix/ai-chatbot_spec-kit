// backend/src/routes/apikeys.js
const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

// Create or update an API key (admin only)
router.post('/', 
  authMiddleware.adminAuth,
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 30 }), // 30 requests per minute
  apiKeyController.createApiKey
);

// Get all API keys (admin only)
router.get('/', 
  authMiddleware.adminAuth,
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 50 }), // 50 requests per minute
  apiKeyController.getAllApiKeys
);

// Get specific API key by ID (admin only)
router.get('/:id', 
  authMiddleware.adminAuth,
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 100 }), // 100 requests per minute
  apiKeyController.getApiKeyById
);

// Update an API key (admin only)
router.put('/:id', 
  authMiddleware.adminAuth,
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 20 }), // 20 requests per minute
  apiKeyController.updateApiKey
);

// Delete an API key (admin only)
router.delete('/:id', 
  authMiddleware.adminAuth,
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 20 }), // 20 requests per minute
  apiKeyController.deleteApiKey
);

module.exports = router;