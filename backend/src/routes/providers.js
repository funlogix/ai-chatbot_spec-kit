// backend/src/routes/providers.js
const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimitMiddleware = require('../middleware/rateLimitMiddleware');

// Get all available providers
router.get('/available', 
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 100 }), // 100 requests per minute
  providerController.getAvailableProviders
);

// Get provider status
router.get('/:providerId/status', 
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 300 }), // 300 requests per minute
  providerController.getProviderStatus
);

// Configure a provider (admin only)
router.post('/configure', 
  authMiddleware.adminAuth,
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 50 }), // 50 requests per minute
  providerController.configureProvider
);

// Get all provider configurations (admin only)
router.get('/', 
  authMiddleware.adminAuth,
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 50 }),
  providerController.getAllProviderConfigs
);

// Get specific provider configuration (admin only)
router.get('/:id', 
  authMiddleware.adminAuth,
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 100 }),
  providerController.getProviderConfigById
);

// Update provider configuration (admin only)
router.put('/:id', 
  authMiddleware.adminAuth,
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 30 }),
  providerController.updateProviderConfig
);

// Delete provider configuration (admin only)
router.delete('/:id', 
  authMiddleware.adminAuth,
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 20 }),
  providerController.deleteProviderConfig
);

// Select a provider for use
router.post('/select', 
  rateLimitMiddleware.createRateLimiter({ windowMs: 1 * 60 * 1000, maxRequests: 200 }), // 200 requests per minute
  providerController.selectProvider
);

module.exports = router;