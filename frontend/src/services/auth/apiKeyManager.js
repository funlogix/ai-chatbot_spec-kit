// frontend/src/services/auth/apiKeyManager.js
/**
 * API Key Manager
 * Handles secure API key management (interacts with backend for actual storage)
 */

class APIKeyManager {
  constructor() {
    this.baseURL = this.getBaseURL();
  }

  /**
   * Get the base URL for API requests
   * @returns {string} Base URL for API requests
   */
  getBaseURL() {
    const env = process?.env?.NODE_ENV || 'development';
    
    if (env === 'production') {
      return '';
    } else {
      return 'http://localhost:3000';
    }
  }

  /**
   * Configure a provider with an API key via the backend
   * @param {string} providerId - ID of the provider
   * @param {string} apiKey - API key for the provider
   * @returns {Promise<Object>} Response from the backend
   */
  async configureProvider(providerId, apiKey) {
    try {
      // In a real implementation, we would send this to our backend
      // which would securely store the API key
      const response = await fetch(`${this.baseURL}/api/providers/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Access': process.env.ADMIN_ACCESS_KEY || localStorage.getItem('adminAccessKey') // Use admin access key
        },
        body: JSON.stringify({
          providerId,
          name: this.getProviderName(providerId),
          endpoint: this.getProviderEndpoint(providerId),
          apiKey,
          config: {}
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to configure provider: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error configuring provider ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Get a provider's name based on ID
   * @param {string} providerId - ID of the provider
   * @returns {string} Name of the provider
   */
  getProviderName(providerId) {
    const names = {
      'openai': 'OpenAI',
      'groq': 'Groq',
      'gemini': 'Google Gemini',
      'openrouter': 'OpenRouter'
    };
    return names[providerId] || providerId;
  }

  /**
   * Get a provider's default endpoint based on ID
   * @param {string} providerId - ID of the provider
   * @returns {string} Default endpoint for the provider
   */
  getProviderEndpoint(providerId) {
    const endpoints = {
      'openai': 'https://api.openai.com/v1',
      'groq': 'https://api.groq.com/openai/v1',
      'gemini': 'https://generativelanguage.googleapis.com/v1beta',
      'openrouter': 'https://openrouter.ai/api/v1'
    };
    return endpoints[providerId] || '';
  }

  /**
   * Get all provider configurations (admin only)
   * @returns {Promise<Array>} Array of provider configurations
   */
  async getAllProviderConfigs(adminAccessKey) {
    try {
      const response = await fetch(`${this.baseURL}/api/providers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Access': adminAccessKey
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get provider configs: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return data.providers;
    } catch (error) {
      console.error('Error getting provider configurations:', error);
      throw error;
    }
  }

  /**
   * Delete a provider configuration (admin only)
   * @param {string} providerId - ID of the provider to delete
   * @param {string} adminAccessKey - Admin access key
   * @returns {Promise<Object>} Response from the backend
   */
  async deleteProviderConfig(providerId, adminAccessKey) {
    try {
      const response = await fetch(`${this.baseURL}/api/providers/${providerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Access': adminAccessKey
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete provider config: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting provider config for ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Get provider status
   * @param {string} providerId - ID of the provider
   * @returns {Promise<Object>} Provider status
   */
  async getProviderStatus(providerId) {
    try {
      const response = await fetch(`${this.baseURL}/api/providers/${providerId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
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
          'Content-Type': 'application/json'
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
}

// Export a singleton instance
const apiKeyManager = new APIKeyManager();
export default apiKeyManager;