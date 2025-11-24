// backend/src/controllers/proxyController.js
const axios = require('axios');
const crypto = require('crypto');
const RateLimitLog = require('../models/RateLimitLog');
const apiKeyController = require('./apiKeyController');
const configService = require('../services/configService');

// In-memory storage for rate limit logs (in production, this would be a database)
let rateLimitLogs = new Map();

// Provider endpoints configuration
const providerEndpoints = {
  openai: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
  groq: process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1',
  gemini: process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  openrouter: process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1',
};

class APIProxyService {
  constructor() {
    this.requestTimeout = configService.get('requestTimeout') || 30000; // 30 seconds
  }

  // Decrypt API key when needed
  decryptApiKey(encryptedApiKey, iv, encryptionKey) {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(encryptionKey, 'GfG', 32);
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encryptedApiKey, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Error decrypting API key:', error);
      return null;
    }
  }

  // Extract and store rate limit information from response headers
  logRateLimit(providerId, userId, endpoint, responseHeaders) {
    try {
      // Extract rate limit information from headers (these vary by provider)
      const rateLimitHeaders = {
        'x-ratelimit-limit-requests': responseHeaders['x-ratelimit-limit-requests'] || 
                                       responseHeaders['x-ratelimit-limit'] ||
                                       responseHeaders['x-ratelimit-reset'] ||
                                       responseHeaders['retry-after'],
        'x-ratelimit-remaining-requests': responseHeaders['x-ratelimit-remaining-requests'] ||
                                          responseHeaders['x-ratelimit-remaining'] ||
                                          responseHeaders['remaining'],
        'x-ratelimit-reset': responseHeaders['x-ratelimit-reset'] ||
                             responseHeaders['x-ratelimit-reset-requests'] ||
                             responseHeaders['retry-after']
      };

      // Create a rate limit log entry
      const id = crypto.randomBytes(16).toString('hex');
      const log = new RateLimitLog({
        id,
        providerId,
        userId,
        endpoint,
        limit: parseInt(rateLimitHeaders['x-ratelimit-limit-requests']) || 0,
        remaining: parseInt(rateLimitHeaders['x-ratelimit-remaining-requests']) || 0,
        resetTime: rateLimitHeaders['x-ratelimit-reset']
      });

      rateLimitLogs.set(id, log);
    } catch (error) {
      console.error('Error logging rate limit:', error);
    }
  }

  // Format the request for different providers
  formatRequest(providerId, requestData) {
    // Some providers may require request transformations
    let formattedData = { ...requestData };

    // For example, OpenRouter might need special headers
    if (providerId === 'openrouter') {
      if (!formattedData.headers) formattedData.headers = {};
      formattedData.headers['HTTP-Referer'] = 'http://localhost:3000';
      formattedData.headers['X-Title'] = 'AI Chatbot';
    }

    // For Gemini, we may need to adjust the structure
    if (providerId === 'gemini') {
      // Convert OpenAI-style request to Gemini format if needed
      if (formattedData.url && formattedData.url.includes('/chat/completions')) {
        formattedData.url = formattedData.url.replace('/chat/completions', ':generateContent');
      }
    }

    return formattedData;
  }

  // Make a request to the provider API
  async makeRequest(providerId, requestData) {
    const { url, method = 'POST', headers = {}, data } = requestData;

    // Get the API key for the specified provider
    const apiKey = apiKeyController.validateApiKey(providerId, null);
    if (!apiKey) {
      throw new Error(`No API key configured for provider: ${providerId}`);
    }

    // Determine the base endpoint for this provider
    const baseEndpoint = providerEndpoints[providerId];
    if (!baseEndpoint) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    // Build the full URL by combining the base endpoint with the requested path
    let fullUrl = url;
    if (!url.startsWith('http')) {
      fullUrl = `${baseEndpoint}${url}`;
    }

    // Parse and decrypt the API key
    const encryptedData = JSON.parse(apiKey.encryptedKey);
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    // Import the decrypt function from the encryption utility
    const { decryptApiKey } = require('../utils/encryptionUtil');
    const decryptedApiKey = decryptApiKey(encryptedData.encrypted, encryptedData.iv, encryptionKey);

    // Format the request based on provider requirements
    const formattedRequest = this.formatRequest(providerId, {
      url: fullUrl,
      method,
      headers: {
        ...headers,
        'Authorization': `Bearer ${decryptedApiKey}`,
        'Content-Type': 'application/json',
      },
      data
    });

    try {
      // Make the request to the provider API
      const response = await axios({
        method: formattedRequest.method,
        url: formattedRequest.url,
        headers: formattedRequest.headers,
        data: formattedRequest.data,
        timeout: this.requestTimeout
      });

      // Log rate limit information if available
      // Note: The actual API key decryption would be needed here, which is skipped for now
      // to avoid security issues in this example
      
      return response;
    } catch (error) {
      if (error.response) {
        // Server responded with error status
        throw {
          status: error.response.status,
          message: error.response.data.error?.message || 'Provider API error',
          data: error.response.data
        };
      } else if (error.request) {
        // Request was made but no response received
        throw {
          status: 503,
          message: 'Provider API is not responding',
          error: error.message
        };
      } else {
        // Something else happened
        throw {
          status: 500,
          message: 'Error making request to provider API',
          error: error.message
        };
      }
    }
  }
}

const apiProxyService = new APIProxyService();

const ProxyController = {
  // Proxy chat completion requests to different providers
  async chatCompletion(req, res) {
    try {
      const { providerId, model, messages, ...requestParams } = req.body;
      
      if (!providerId || !model || !messages) {
        return res.status(400).json({ 
          error: 'providerId, model, and messages are required' 
        });
      }

      // Prepare the request data for the provider
      const requestData = {
        url: '/chat/completions',
        method: 'POST',
        data: {
          model,
          messages,
          ...requestParams
        }
      };

      // Make the request to the provider API
      const response = await apiProxyService.makeRequest(providerId, requestData);
      
      // Send the provider's response back to the client
      res.status(response.status).json(response.data);
    } catch (error) {
      if (error.status) {
        // Provider API returned an error
        res.status(error.status).json({
          error: error.message,
          ...(error.data ? { providerResponse: error.data } : {})
        });
      } else {
        // Unexpected error
        console.error('Proxy error:', error);
        res.status(500).json({ 
          error: 'Internal server error during proxy request' 
        });
      }
    }
  },

  // Proxy other requests to different providers
  async proxyRequest(req, res) {
    try {
      const { providerId, endpoint, method = 'POST', data } = req.body;
      
      if (!providerId || !endpoint) {
        return res.status(400).json({ 
          error: 'providerId and endpoint are required' 
        });
      }

      // Prepare the request data for the provider
      const requestData = {
        url: endpoint,
        method,
        data
      };

      // Make the request to the provider API
      const response = await apiProxyService.makeRequest(providerId, requestData);
      
      // Send the provider's response back to the client
      res.status(response.status).json(response.data);
    } catch (error) {
      if (error.status) {
        // Provider API returned an error
        res.status(error.status).json({
          error: error.message,
          ...(error.data ? { providerResponse: error.data } : {})
        });
      } else {
        // Unexpected error
        console.error('Proxy error:', error);
        res.status(500).json({ 
          error: 'Internal server error during proxy request' 
        });
      }
    }
  }
};

module.exports = ProxyController;