// frontend/src/utils/configLoader.js
/**
 * Configuration loader for the frontend application
 * Loads settings from the backend API
 */

class ConfigLoader {
  constructor() {
    this.config = null;
    this.baseURL = this.getBaseURL();
  }

  /**
   * Get the base URL for API requests
   * @returns {string} Base URL for API requests
   */
  getBaseURL() {
    // Use the backend server for API requests
    // In production, you might want to make this configurable
    const env = process?.env?.NODE_ENV || 'development';
    
    if (env === 'production') {
      // In production, we might be running behind a proxy
      return '';
    } else {
      // In development, use the backend server directly
      return 'http://localhost:3000';
    }
  }

  /**
   * Load configuration from the backend API
   * @returns {Promise<Object>} Configuration object
   */
  async loadConfig() {
    try {
      const response = await fetch(`${this.baseURL}/api/providers/available`);
      
      if (!response.ok) {
        throw new Error(`Failed to load configuration: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      this.config = {
        providers: data.providers,
        timestamp: new Date().toISOString()
      };
      
      return this.config;
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw error;
    }
  }

  /**
   * Get the current configuration
   * @returns {Object|null} Configuration object or null if not loaded
   */
  getConfig() {
    return this.config;
  }

  /**
   * Get available providers
   * @returns {Array} Array of available providers
   */
  getProviders() {
    return this.config?.providers || [];
  }

  /**
   * Get a specific provider by ID
   * @param {string} providerId - ID of the provider to get
   * @returns {Object|undefined} Provider object or undefined if not found
   */
  getProvider(providerId) {
    return this.getProviders().find(p => p.id === providerId);
  }

  /**
   * Check if a provider is available
   * @param {string} providerId - ID of the provider to check
   * @returns {boolean} True if the provider is available, false otherwise
   */
  isProviderAvailable(providerId) {
    const provider = this.getProvider(providerId);
    return provider && provider.isActive;
  }

  /**
   * Get models for a specific provider
   * @param {string} providerId - ID of the provider
   * @returns {Array} Array of models for the provider
   */
  getProviderModels(providerId) {
    const provider = this.getProvider(providerId);
    return provider?.models || [];
  }
}

// Export a singleton instance
const configLoader = new ConfigLoader();
export default configLoader;