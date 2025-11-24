/**
 * Secure Storage Utility
 * Handles secure storage and retrieval of sensitive data in the browser
 * NOTE: This is for demonstration purposes only. In a real application,
 * API keys should never be stored in client-side code for security reasons.
 */

class SecureStorage {
  constructor() {
    // Define prefixes for different types of stored data
    this.prefixes = {
      CONFIG: 'ai_chatbot_config_',
      PROVIDER: 'ai_chatbot_provider_',
      USER_PREF: 'ai_chatbot_user_pref_'
    };
  }

  /**
   * Store configuration data securely in localStorage
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   * @param {string} type - Type of data (CONFIG, PROVIDER, USER_PREF)
   * @returns {void}
   */
  setConfig(key, value, type = 'CONFIG') {
    if (!key) {
      throw new Error('Key is required');
    }
    
    const prefix = this.prefixes[type] || this.prefixes.CONFIG;
    const fullKey = `${prefix}${key}`;
    
    try {
      // For sensitive data, we should not store it directly
      // In a real app, only store non-sensitive configuration data
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(fullKey, serializedValue);
    } catch (error) {
      console.error('Error storing config:', error);
      throw error;
    }
  }

  /**
   * Retrieve configuration data from localStorage
   * @param {string} key - Configuration key
   * @param {string} type - Type of data (CONFIG, PROVIDER, USER_PREF)
   * @returns {*} Configuration value or null if not found
   */
  getConfig(key, type = 'CONFIG') {
    if (!key) {
      return null;
    }
    
    const prefix = this.prefixes[type] || this.prefixes.CONFIG;
    const fullKey = `${prefix}${key}`;
    
    try {
      const serializedValue = localStorage.getItem(fullKey);
      return serializedValue ? JSON.parse(serializedValue) : null;
    } catch (error) {
      console.error('Error retrieving config:', error);
      return null;
    }
  }

  /**
   * Remove configuration data from localStorage
   * @param {string} key - Configuration key
   * @param {string} type - Type of data (CONFIG, PROVIDER, USER_PREF)
   * @returns {void}
   */
  removeConfig(key, type = 'CONFIG') {
    if (!key) {
      return;
    }
    
    const prefix = this.prefixes[type] || this.prefixes.CONFIG;
    const fullKey = `${prefix}${key}`;
    
    localStorage.removeItem(fullKey);
  }

  /**
   * Store a provider's non-sensitive configuration
   * @param {string} providerId - Provider ID
   * @param {Object} config - Provider configuration (without API keys)
   * @returns {void}
   */
  setProviderConfig(providerId, config) {
    if (!providerId || !config) {
      throw new Error('Provider ID and config are required');
    }
    
    // Only store non-sensitive provider configuration
    const safeConfig = {
      providerId: config.providerId,
      providerName: config.providerName,
      endpoint: config.endpoint,
      models: config.models,
      rateLimit: config.rateLimit,
      tier: config.tier,
      isActive: config.isActive,
      lastUpdated: new Date().toISOString()
    };
    
    this.setConfig(providerId, safeConfig, 'PROVIDER');
  }

  /**
   * Retrieve a provider's non-sensitive configuration
   * @param {string} providerId - Provider ID
   * @returns {Object} Provider configuration or null if not found
   */
  getProviderConfig(providerId) {
    if (!providerId) {
      return null;
    }
    
    return this.getConfig(providerId, 'PROVIDER');
  }

  /**
   * Clear all stored configuration data
   * @returns {void}
   */
  clearAll() {
    Object.keys(localStorage).forEach(key => {
      if (Object.values(this.prefixes).some(prefix => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Check if running in a secure context (HTTPS)
   * @returns {boolean} True if in a secure context
   */
  isSecureContext() {
    return window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  /**
   * Generate a secure random string (for demonstration purposes)
   * @param {number} length - Length of the string to generate
   * @returns {string} Random string
   */
  generateSecureId(length = 16) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Export a singleton instance
const secureStorage = new SecureStorage();
export default secureStorage;