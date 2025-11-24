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
    const env = process?.env?.NODE_ENV || 'development';
    
    if (env === 'production') {
      return '';
    } else {
      return 'http://localhost:3000';
    }
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

  /**
   * Health check for a provider
   * @param {string} providerId - ID of the provider to check
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck(providerId) {
    try {
      const response = await this.getProviderStatus(providerId);
      return {
        providerId,
        isHealthy: response.status === 'available' || response.hasApiKey,
        timestamp: new Date().toISOString(),
        details: response
      };
    } catch (error) {
      return {
        providerId,
        isHealthy: false,
        timestamp: new Date().toISOString(),
        details: { error: error.message }
      };
    }
  }

  /**
   * Get provider configuration (admin only)
   * @param {string} adminAccessKey - Admin access key
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
   * Configure a provider (admin only)
   * @param {Object} config - Configuration object
   * @param {string} adminAccessKey - Admin access key
   * @returns {Promise<Object>} Response from the backend
   */
  async configureProvider(config, adminAccessKey) {
    try {
      const response = await fetch(`${this.baseURL}/api/providers/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Access': adminAccessKey
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to configure provider: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error configuring provider:', error);
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
}

// Export a singleton instance
const providerService = new ProviderService();
export default providerService;