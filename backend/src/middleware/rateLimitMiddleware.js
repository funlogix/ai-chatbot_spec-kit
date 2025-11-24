// backend/src/middleware/rateLimitMiddleware.js
const RateLimitLog = require('../models/RateLimitLog');

// In-memory storage for rate limiting (in production, this would use Redis or similar)
let rateLimitStorage = new Map();

class RateLimitMiddleware {
  constructor() {
    // Default rate limits per provider (can be configured per provider)
    this.defaultLimits = {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60,     // max requests per window
      apiKey: null         // specific key to track (IP, user ID, etc.)
    };
    
    // Provider-specific limits (these would come from config in production)
    this.providerLimits = {
      openai: { windowMs: 60 * 1000, maxRequests: 3000 },   // 3000 requests per minute
      groq: { windowMs: 60 * 1000, maxRequests: 30 },       // 30 requests per minute (free tier)
      gemini: { windowMs: 60 * 1000, maxRequests: 600 },    // 600 requests per minute
      openrouter: { windowMs: 60 * 1000, maxRequests: 100 } // 100 requests per minute
    };
  }

  // Generic rate limiter middleware
  createRateLimiter(options = {}) {
    const opts = { ...this.defaultLimits, ...options };
    
    return (req, res, next) => {
      // Determine the rate limit key (IP address, user ID, etc.)
      const key = opts.keyFn ? opts.keyFn(req) : req.ip;
      const now = Date.now();
      const windowStart = now - opts.windowMs;
      
      // Get or create the request record for this key
      if (!rateLimitStorage.has(key)) {
        rateLimitStorage.set(key, []);
      }
      
      // Get the request history for this key
      let requests = rateLimitStorage.get(key);
      
      // Remove requests outside the current window
      requests = requests.filter(timestamp => timestamp > windowStart);
      
      // Check if the limit has been exceeded
      if (requests.length >= opts.maxRequests) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests, please try again later`,
          retryAfter: Math.ceil((requests[0] - now + opts.windowMs) / 1000)
        });
      }
      
      // Add current request timestamp
      requests.push(now);
      rateLimitStorage.set(key, requests);
      
      // Add rate limit headers to the response
      res.set({
        'X-RateLimit-Limit': opts.maxRequests,
        'X-RateLimit-Remaining': opts.maxRequests - requests.length,
        'X-RateLimit-Reset': new Date(now + opts.windowMs).toISOString()
      });
      
      next();
    };
  }

  // Rate limiter specifically for provider API calls
  providerRateLimiter(providerId) {
    const limits = this.providerLimits[providerId] || this.defaultLimits;
    
    return (req, res, next) => {
      // Determine the rate limit key (could be user ID or IP)
      const userId = req.user?.id || req.ip;
      const key = `provider_${providerId}_${userId}`;
      const now = Date.now();
      const windowStart = now - limits.windowMs;
      
      // Get or create the request record for this provider/user combination
      if (!rateLimitStorage.has(key)) {
        rateLimitStorage.set(key, []);
      }
      
      // Get the request history
      let requests = rateLimitStorage.get(key);
      
      // Remove requests outside the current window
      requests = requests.filter(timestamp => timestamp > windowStart);
      
      // Check if the limit has been exceeded
      if (requests.length >= limits.maxRequests) {
        console.log(`Rate limit exceeded for provider ${providerId} by user ${userId}`);
        
        return res.status(429).json({
          error: 'Provider rate limit exceeded',
          message: `Too many requests to ${providerId}, please try again later`,
          provider: providerId,
          retryAfter: Math.ceil((requests[0] - now + limits.windowMs) / 1000)
        });
      }
      
      // Add current request timestamp
      requests.push(now);
      rateLimitStorage.set(key, requests);
      
      // Add provider-specific rate limit headers to the response
      res.set({
        'X-Provider-RateLimit-Limit': limits.maxRequests,
        'X-Provider-RateLimit-Remaining': limits.maxRequests - requests.length,
        'X-Provider-RateLimit-Reset': new Date(now + limits.windowMs).toISOString(),
        'X-Provider': providerId
      });
      
      // Log this rate limit event
      const logId = require('crypto').randomBytes(16).toString('hex');
      const rateLimitLog = new RateLimitLog({
        id: logId,
        providerId,
        userId,
        endpoint: req.url,
        limit: limits.maxRequests,
        remaining: limits.maxRequests - requests.length,
        resetTime: new Date(now + limits.windowMs).toISOString()
      });
      
      // In a real implementation, you might store these logs in a database
      console.log(`Rate limit log: ${JSON.stringify(rateLimitLog)}`);
      
      next();
    };
  }

  // Get rate limit information for a user/provider
  getRateLimitInfo(providerId, userId) {
    const key = `provider_${providerId}_${userId}`;
    const requests = rateLimitStorage.get(key) || [];
    const limits = this.providerLimits[providerId] || this.defaultLimits;
    const now = Date.now();
    const windowStart = now - limits.windowMs;
    
    // Filter to only requests in the current window
    const currentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    return {
      providerId,
      userId,
      limit: limits.maxRequests,
      remaining: limits.maxRequests - currentRequests.length,
      resetTime: new Date(now + limits.windowMs).toISOString(),
      currentRequests: currentRequests.length
    };
  }
}

module.exports = new RateLimitMiddleware();