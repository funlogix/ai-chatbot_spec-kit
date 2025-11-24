// frontend/src/services/api/providerService.js
/**
 * Provider Service
 * Handles operations related to AI providers via the backend API
 */

class ProviderService {
  constructor() {
    this.baseURL = this.getBaseURL();
  }

  /**
   * Get the base URL for API requests
   * @returns {string} Base URL for API requests
   */
  getBaseURL() {
    return 'http://localhost:3000'; // Our backend server
  }

  /**
   * Get all available providers from the backend
   * @returns {Promise<Array>} Array of available providers
   */
  async getAvailableProviders() {
    try {
      const response = await fetch(`${this.baseURL}/api/providers/available`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get available providers: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.providers;
    } catch (error) {
      console.error('Error getting available providers:', error);
      throw error;
    }
  }

  /**
   * Get a specific provider's status
   * @param {string} providerId - ID of the provider to check
   * @returns {Promise<Object>} Provider status information
   */
  async getProviderStatus(providerId) {
    try {
      const response = await fetch(`${this.baseURL}/api/providers/${providerId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Include authentication token if available
          'Authorization': `Bearer ${localStorage.getItem('access_token') || 'anon'}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get provider status: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error getting status for provider ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Select a provider for use
   * @param {string} providerId - ID of the provider to select
   * @returns {Promise<Object>} Response from the backend
   */
  async selectProvider(providerId) {
    try {
      const response = await fetch(`${this.baseURL}/api/providers/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include authentication token if available
          'Authorization': `Bearer ${localStorage.getItem('access_token') || 'anon'}`,
        },
        body: JSON.stringify({ providerId })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to select provider: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error selecting provider ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Get rate limit information - this is handled by middleware, not a separate endpoint
   * @returns {Object} Rate limit information based on provider configuration
   */
  getRateLimits() {
    // The backend handles rate limiting through middleware
    // We return a default response indicating how rate limiting works
    return {
      info: 'Rate limits are handled by backend middleware. Check response headers for current limits.',
      providers: {
        'openai': {
          rpm: 3000,  // requests per minute based on OpenAI limits
          window: '1 minute'
        },
        'groq': {
          rpm: 30,    // requests per minute based on Groq free tier limits
          window: '1 minute'
        },
        'gemini': {
          rpm: 600,   // requests per minute based on Gemini limits
          window: '1 minute'
        },
        'openrouter': {
          rpm: 100,   // requests per minute based on OpenRouter limits
          window: '1 minute'
        }
      }
    };
  }
}

// Export a singleton instance
const providerService = new ProviderService();
export default providerService;