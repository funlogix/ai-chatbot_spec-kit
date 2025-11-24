// frontend/src/services/apiClient.js
/**
 * API Client Service
 * Handles direct communication with AI provider APIs through the backend proxy
 */

class ApiClient {
  constructor() {
    this.baseURL = 'http://localhost:3000'; // Our backend server
    this.apiKey = null;
  }

  /**
   * Set the API key (though with our backend proxy, this isn't actually used for direct requests)
   * @param {string} key - The API key to set
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Make a chat completion request through the backend proxy
   * @param {Object} requestData - Request data including providerId, model, and messages
   * @returns {Promise<Object>} Response from the provider via the backend proxy
   */
  async createChatCompletion(requestData) {
    try {
      // Validate required fields
      if (!requestData.providerId) {
        throw new Error('providerId is required for chat completion requests');
      }

      if (!requestData.messages || !Array.isArray(requestData.messages) || requestData.messages.length === 0) {
        throw new Error('messages array is required for chat completion requests');
      }

      // Default to a reasonable model if none provided
      const model = requestData.model || 'llama3-70b-8192'; // Default to Groq's Llama3 model

      // Make the request to our backend proxy
      const response = await fetch(`${this.baseURL}/api/proxy/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include authentication token if available
          'Authorization': `Bearer ${localStorage.getItem('access_token') || 'anon'}`
        },
        body: JSON.stringify({
          providerId: requestData.providerId,
          model,
          messages: requestData.messages,
          temperature: requestData.temperature || 0.7,
          max_tokens: requestData.max_tokens || 1024,
          top_p: requestData.top_p || 1.0,
          stream: requestData.stream || false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in createChatCompletion:', error);
      throw error;
    }
  }

  /**
   * Make a general API request through the backend proxy
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Request options including method, headers, body
   * @returns {Promise<Object>} Response from the backend proxy
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const {
        method = 'GET',
        headers = {},
        body = null,
        providerId = null
      } = options;

      const url = `${this.baseURL}${endpoint}`;

      const requestOptions = {
        method,
        headers: {
          'Content-Type': 'application/json',
          // Include authentication token if available
          'Authorization': `Bearer ${localStorage.getItem('access_token') || 'anon'}`,
          ...headers
        }
      };

      if (body && typeof body === 'object') {
        requestOptions.body = JSON.stringify(body);
      } else if (body) {
        requestOptions.body = body;
      }

      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in API request to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get available providers
   * @returns {Promise<Object>} Response with available providers
   */
  async getAvailableProviders() {
    return await this.makeRequest('/api/providers/available', {
      method: 'GET'
    });
  }

  /**
   * Get provider status
   * @param {string} providerId - ID of the provider to check
   * @returns {Promise<Object>} Provider status response
   */
  async getProviderStatus(providerId) {
    return await this.makeRequest(`/api/providers/${providerId}/status`, {
      method: 'GET'
    });
  }

  /**
   * Select a provider
   * @param {string} providerId - ID of the provider to select
   * @returns {Promise<Object>} Response from the backend
   */
  async selectProvider(providerId) {
    return await this.makeRequest('/api/providers/select', {
      method: 'POST',
      body: { providerId }
    });
  }
}

// Export a singleton instance
const apiClient = new ApiClient();
export default apiClient;