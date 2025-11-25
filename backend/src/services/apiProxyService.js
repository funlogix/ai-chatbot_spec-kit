// backend/src/services/apiProxyService.js
const axios = require('axios');
const crypto = require('crypto');
const RateLimitLog = require('../models/RateLimitLog');
const apiKeyController = require('../controllers/apiKeyController');
const configService = require('./configService');

// In-memory storage for rate limit logs and request tracking
let rateLimitLogs = new Map();
let requestCache = new Map();  // For caching responses (optional)

class APIProxyService {
  constructor() {
    this.requestTimeout = configService.get('requestTimeout') || 30000; // 30 seconds
    this.maxConcurrentRequests = configService.get('maxConcurrentRequests') || 100;
    
    // Provider endpoints configuration
    this.providerEndpoints = {
      openai: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
      groq: process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1',
      gemini: process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
      openrouter: process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1',
    };
  }

  // Decrypt API key using stored encryption key
  decryptApiKey(encryptedDataStr, encryptionKey) {
    try {
      const encryptedData = JSON.parse(encryptedDataStr);
      const { encrypted, iv } = encryptedData;
      
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(encryptionKey, 'GfG', 32);
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting API key:', error);
      return null;
    }
  }

  // Format the request data for different providers
  formatRequestForProvider(providerId, requestData) {
    // Create a copy of the request data to avoid modifying the original
    const formattedData = { ...requestData };
    
    // Some providers may need different request formatting
    switch (providerId) {
      case 'gemini':
        // Gemini might need different endpoint or body format
        if (formattedData.url.includes('/chat/completions')) {
          formattedData.url = formattedData.url.replace('/chat/completions', ':generateContent');
          // Additional transformation might be needed based on Gemini's API
        }
        break;
        
      case 'openrouter':
        // OpenRouter might need special headers
        if (!formattedData.headers) formattedData.headers = {};
        formattedData.headers['HTTP-Referer'] = 'http://localhost:3000';
        formattedData.headers['X-Title'] = 'AI Chatbot';
        break;
        
      default:
        // Other providers follow standard OpenAI format
        break;
    }
    
    return formattedData;
  }

  // Validate and prepare request data
  validateAndPrepareRequest(providerId, requestData) {
    // Check if the provider is supported
    if (!this.providerEndpoints[providerId]) {
      throw new Error(`Unsupported provider: ${providerId}`);
    }
    
    // Ensure required fields are present
    if (!requestData.url) {
      throw new Error('Request URL is required');
    }
    
    // Ensure the request method is supported
    const method = (requestData.method || 'POST').toUpperCase();
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    // Prepare the full URL
    let fullUrl = requestData.url;
    if (!fullUrl.startsWith('http')) {
      fullUrl = `${this.providerEndpoints[providerId]}${fullUrl}`;
    }
    
    // Get the API key for this provider
    const apiKey = apiKeyController.validateApiKey(providerId, null);
    if (!apiKey) {
      throw new Error(`No API key configured for provider: ${providerId}`);
    }
    
    // Prepare headers with the API key
    const headers = {
      'Authorization': `Bearer ${this.decryptApiKey(apiKey.encryptedKey, process.env.ENCRYPTION_KEY || 'fallback_encryption_key')}`,
      'Content-Type': 'application/json',
      ...(requestData.headers || {})
    };
    
    // Format the request specifically for this provider
    const formattedRequest = this.formatRequestForProvider(providerId, {
      url: fullUrl,
      method,
      headers,
      data: requestData.data
    });
    
    return formattedRequest;
  }

  // Make a request to the provider API
  async makeRequest(providerId, requestData, userId = 'anonymous') {
    try {
      // Validate and prepare the request
      const preparedRequest = this.validateAndPrepareRequest(providerId, requestData);
      
      // Make the request to the provider API
      const response = await axios({
        method: preparedRequest.method,
        url: preparedRequest.url,
        headers: preparedRequest.headers,
        data: preparedRequest.data,
        timeout: this.requestTimeout
      });
      
      // Log rate limit information if available in response headers
      this.logRateLimit(providerId, userId, preparedRequest.url, response.headers);
      
      return {
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        return {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          error: true
        };
      } else if (error.request) {
        // Request was made but no response received
        throw new Error(`Provider API is not responding: ${error.message}`);
      } else {
        // Something else happened
        throw new Error(`Error making request to provider API: ${error.message}`);
      }
    }
  }

  // Log rate limit information
  logRateLimit(providerId, userId, endpoint, responseHeaders) {
    try {
      // Extract rate limit information from response headers (varies by provider)
      const rateLimitHeaders = {
        limit: responseHeaders['x-ratelimit-limit-requests'] || 
               responseHeaders['x-ratelimit-limit'] ||
               responseHeaders['x-ratelimit-reset'] ||
               responseHeaders['retry-after'] ||
               responseHeaders['ratelimit-limit'],
        remaining: responseHeaders['x-ratelimit-remaining-requests'] ||
                   responseHeaders['x-ratelimit-remaining'] ||
                   responseHeaders['ratelimit-remaining'],
        reset: responseHeaders['x-ratelimit-reset'] ||
               responseHeaders['x-ratelimit-reset-requests'] ||
               responseHeaders['retry-after'] ||
               responseHeaders['ratelimit-reset']
      };

      // Only log if we have meaningful rate limit data
      if (rateLimitHeaders.limit !== undefined || rateLimitHeaders.remaining !== undefined) {
        const id = crypto.randomBytes(16).toString('hex');
        const log = new RateLimitLog({
          id,
          providerId,
          userId,
          endpoint,
          limit: parseInt(rateLimitHeaders.limit) || 0,
          remaining: parseInt(rateLimitHeaders.remaining) || 0,
          resetTime: rateLimitHeaders.reset
        });

        rateLimitLogs.set(id, log);
      }
    } catch (error) {
      console.error('Error logging rate limit:', error);
    }
  }

  // Get rate limit logs for a specific provider
  getRateLimitLogs(providerId, userId = null) {
    const logs = [];
    
    for (const [id, log] of rateLimitLogs) {
      if (log.providerId === providerId && (!userId || log.userId === userId)) {
        logs.push({
          id: log.id,
          providerId: log.providerId,
          userId: log.userId,
          endpoint: log.endpoint,
          timestamp: log.timestamp,
          limit: log.limit,
          remaining: log.remaining,
          resetTime: log.resetTime
        });
      }
    }
    
    return logs;
  }

  // Cache API responses (optional, for performance)
  cacheResponse(cacheKey, response, ttl = 300000) { // Default TTL: 5 minutes
    const expiry = Date.now() + ttl;
    requestCache.set(cacheKey, { response, expiry });
  }

  // Get cached response if still valid
  getCachedResponse(cacheKey) {
    const cached = requestCache.get(cacheKey);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.response;
    } else if (cached) {
      // Remove expired cache entry
      requestCache.delete(cacheKey);
    }
    
    return null;
  }

  // Make a cached request (optional functionality)
  async makeCachedRequest(providerId, requestData, userId = 'anonymous', cacheKey = null) {
    // If no cache key provided, generate one based on provider, endpoint, and data
    if (!cacheKey) {
      const dataHash = crypto.createHash('md5')
        .update(JSON.stringify(requestData))
        .digest('hex');
      cacheKey = `${providerId}_${requestData.url}_${dataHash}`;
    }
    
    // Try to get from cache first
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Make the actual request
    const response = await this.makeRequest(providerId, requestData, userId);
    
    // Cache the response if it was successful
    if (response.status >= 200 && response.status < 300) {
      this.cacheResponse(cacheKey, response);
    }
    
    return response;
  }
}

module.exports = new APIProxyService();