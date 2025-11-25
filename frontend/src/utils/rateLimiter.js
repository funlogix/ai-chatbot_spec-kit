// frontend/src/utils/rateLimiter.js
/**
 * Rate Limiter Utility
 * Tracks API usage by provider and enforces client-side rate limits
 */

class RateLimiter {
  constructor() {
    // Initialize tracking data structure
    this.requests = new Map(); // Maps providerId to request history
    this.limits = this.getDefaultLimits();
  }

  /**
   * Get default rate limits for each provider
   * @returns {Object} Default limits for each provider
   */
  getDefaultLimits() {
    return {
      // Free tier limits (per minute)
      'openai': { windowMs: 60 * 1000, maxRequests: 3 },      // Very low for testing
      'groq': { windowMs: 60 * 1000, maxRequests: 30 },       // 30 requests per minute (free tier)
      'gemini': { windowMs: 60 * 1000, maxRequests: 15 },     // 15 requests per minute (free tier)
      'openrouter': { windowMs: 60 * 1000, maxRequests: 20 }  // 20 requests per minute (free tier)
    };
  }

  /**
   * Record an API request for rate limiting purposes
   * @param {string} providerId - ID of the provider
   * @returns {Promise<boolean>} Whether the request was allowed
   */
  async recordAPIRequest(providerId) {
    const now = Date.now();
    const windowStart = now - this.limits[providerId].windowMs;

    // Initialize request history for this provider if needed
    if (!this.requests.has(providerId)) {
      this.requests.set(providerId, []);
    }

    // Get the request history for this provider
    const history = this.requests.get(providerId);

    // Remove requests outside the current window
    const recentRequests = history.filter(timestamp => timestamp > windowStart);
    
    // Check if we've exceeded the limit
    if (recentRequests.length >= this.limits[providerId].maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Add the current request to the history
    recentRequests.push(now);
    this.requests.set(providerId, recentRequests);

    return true;
  }

  /**
   * Check if a request would be allowed under rate limits
   * @param {string} providerId - ID of the provider
   * @returns {Promise<boolean>} Whether the request would be allowed
   */
  async wouldAllowRequest(providerId) {
    const now = Date.now();
    const windowStart = now - this.limits[providerId].windowMs;

    // Get the request history for this provider
    const history = this.requests.get(providerId) || [];

    // Count requests in the current window
    const recentRequests = history.filter(timestamp => timestamp > windowStart);

    return recentRequests.length < this.limits[providerId].maxRequests;
  }

  /**
   * Get rate limiting information for a provider
   * @param {string} providerId - ID of the provider
   * @returns {Object} Rate limiting information
   */
  getRateLimitInfo(providerId) {
    const now = Date.now();
    const windowStart = now - this.limits[providerId].windowMs;

    // Get the request history for this provider
    const history = this.requests.get(providerId) || [];

    // Count requests in the current window
    const recentRequests = history.filter(timestamp => timestamp > windowStart);

    return {
      providerId,
      limit: this.limits[providerId].maxRequests,
      remaining: this.limits[providerId].maxRequests - recentRequests.length,
      resetTime: new Date(windowStart + this.limits[providerId].windowMs).toISOString(),
      currentRequests: recentRequests.length
    };
  }

  /**
   * Get the time until rate limit resets for a provider
   * @param {string} providerId - ID of the provider
   * @returns {number} Milliseconds until reset
   */
  getTimeUntilReset(providerId) {
    const now = Date.now();
    const windowStart = now - this.limits[providerId].windowMs;

    // Get the request history for this provider
    const history = this.requests.get(providerId) || [];

    // Count requests in the current window
    const recentRequests = history.filter(timestamp => timestamp > windowStart);

    if (recentRequests.length < this.limits[providerId].maxRequests) {
      // Not at limit, so time until the next window starts
      return this.limits[providerId].windowMs - (now - windowStart);
    } else {
      // At limit, so time until the oldest request falls out of the window
      const oldestRequest = Math.min(...recentRequests);
      return oldestRequest + this.limits[providerId].windowMs - now;
    }
  }

  /**
   * Update rate limits from the backend
   * @param {Object} limits - Limits from the backend
   */
  updateLimits(limits) {
    this.limits = { ...this.getDefaultLimits(), ...limits };
  }

  /**
   * Clear all request history (for testing or user logout)
   */
  clearHistory() {
    this.requests.clear();
  }
}

// Export a singleton instance
const rateLimiter = new RateLimiter();
export default rateLimiter;