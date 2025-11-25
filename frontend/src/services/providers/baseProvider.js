/**
 * Base Provider Adapter
 * Provides a standard interface for all AI provider adapters
 */
class BaseProvider {
  constructor(providerConfig) {
    if (new.target === BaseProvider) {
      throw new TypeError("Cannot instantiate BaseProvider directly");
    }
    
    this.providerConfig = providerConfig || {};
    this.providerId = providerConfig.providerId;
    this.apiKey = providerConfig.apiKey;
    this.endpoint = providerConfig.endpoint;
    this.name = providerConfig.name || 'BaseProvider';
    this.models = providerConfig.models || [];
  }

  /**
   * Initialize the provider adapter
   * @returns {Promise<void>}
   */
  async init() {
    // Base initialization - to be overridden by specific providers if needed
    console.log(`${this.name} provider initialized`);
    return Promise.resolve();
  }

  /**
   * Make a request to the AI provider
   * @param {Object} requestData - Data for the AI request
   * @returns {Promise<Object>} Response from the provider
   */
  async makeRequest(requestData) {
    throw new Error('makeRequest method must be implemented by subclasses');
  }

  /**
   * Validate the configuration for this provider
   * @returns {Object} Object with isValid boolean and errors array
   */
  validateConfig() {
    const errors = [];
    
    if (!this.providerId || typeof this.providerId !== 'string') {
      errors.push('providerId is required and must be a string');
    }
    
    if (!this.apiKey || typeof this.apiKey !== 'string') {
      errors.push('apiKey is required and must be a string');
    }
    
    if (!this.endpoint || typeof this.endpoint !== 'string') {
      errors.push('endpoint is required and must be a string');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get the provider's rate limit information
   * @returns {Object} Rate limit information
   */
  getRateLimits() {
    // Return the rate limits defined in the provider's configuration
    return this.providerConfig.rateLimit || {};
  }

  /**
   * Check if a request would exceed rate limits
   * @param {Object} requestData - The request data to check
   * @returns {Object} Object with allowed boolean and timeToReset if blocked
   */
  async checkRateLimit(requestData) {
    // This would integrate with the rate limiter utility
    // For now, return allowed = true
    // In a real implementation, this would check against the provider's rate limits
    return { allowed: true };
  }

  /**
   * Get list of available models for this provider
   * @returns {Promise<Array>} List of available models
   */
  async getAvailableModels() {
    // Return models from configuration or fetch from provider API
    if (this.models && this.models.length > 0) {
      return Promise.resolve(this.models);
    }
    
    // If no models in config, return empty array
    // Subclasses can override to fetch from API
    return Promise.resolve([]);
  }

  /**
   * Set the API key for this provider
   * @param {string} apiKey - The API key to use
   * @returns {void}
   */
  setApiKey(apiKey) {
    if (!apiKey) {
      throw new Error('API key cannot be empty');
    }
    this.apiKey = apiKey;
  }

  /**
   * Get the provider's name
   * @returns {string} Provider name
   */
  getName() {
    return this.name;
  }

  /**
   * Get the provider's ID
   * @returns {string} Provider ID
   */
  getProviderId() {
    return this.providerId;
  }

  /**
   * Transform a standard request to the provider's specific format
   * @param {Object} requestData - Standard request data
   * @returns {Object} Provider-specific request data
   */
  transformRequest(requestData) {
    // Base transformation - subclasses should override this
    return requestData;
  }

  /**
   * Transform the provider's response to a standard format
   * @param {Object} providerResponse - Provider-specific response
   * @returns {Object} Standard response format
   */
  transformResponse(providerResponse) {
    // Base transformation - subclasses should override this
    return providerResponse;
  }

  /**
   * Health check for the provider
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    // Base health check - return basic status
    const configValidation = this.validateConfig();
    
    return {
      providerId: this.providerId,
      name: this.name,
      isHealthy: configValidation.isValid,
      timestamp: new Date().toISOString(),
      details: {
        configValid: configValidation.isValid,
        configErrors: configValidation.errors
      }
    };
  }

  /**
   * Get provider-specific headers for API requests
   * @returns {Object} Headers object
   */
  getHeaders() {
    // Base headers - subclasses should extend this
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }
}

export default BaseProvider;