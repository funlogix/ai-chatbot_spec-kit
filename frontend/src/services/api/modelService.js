// frontend/src/services/api/modelService.js
/**
 * Model Service
 * Handles operations related to AI models via the backend API
 */

class ModelService {
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
   * Get capabilities for a model based on provider and model ID
   * @param {string} modelId - ID of the model
   * @param {string} providerId - ID of the provider
   * @returns {Array} Array of capabilities
   */
  getCapabilitiesForModel(modelId, providerId) {
    const capabilities = ['text-generation'];

    // Add provider-specific capabilities based on the updated models
    if (providerId === 'openai') {
      if (modelId.includes('gpt-5')) {
        capabilities.push('reasoning', 'advanced-context', 'multimodal');
      } else if (modelId.includes('o4')) {
        capabilities.push('reasoning', 'fast-response');
      }

      if (modelId.includes('dall-e')) {
        capabilities.push('image-generation');
      }

      if (modelId.includes('tts')) {
        capabilities.push('text-to-speech');
      }

      if (modelId.includes('whisper')) {
        capabilities.push('speech-to-text');
      }
    } else if (providerId === 'groq') {
      if (modelId.includes('gpt-oss')) {
        capabilities.push('reasoning', 'fast-inference');
      }

      if (modelId.includes('qwen')) {
        capabilities.push('multilingual', 'reasoning');
      }
    } else if (providerId === 'gemini') {
      if (modelId.includes('vision')) {
        capabilities.push('image-analysis');
      }

      if (modelId.includes('flash')) {
        capabilities.push('fast-response');
      }

      if (modelId.includes('pro')) {
        capabilities.push('reasoning', 'advanced-context');
      }
    } else if (providerId === 'openrouter') {
      if (modelId.includes('free')) {
        capabilities.push('free-tier');
      }

      if (modelId.includes('glm')) {
        capabilities.push('efficient-processing');
      }

      if (modelId.includes('grok')) {
        capabilities.push('reasoning', 'multimodal');
      }
    }

    return capabilities;
  }

  /**
   * Get available models for a specific provider
   * @param {string} providerId - ID of the provider
   * @returns {Promise<Array>} Array of available models
   */
  async getProviderModels(providerId) {
    try {
      // We need to get the available providers and then extract models for the specific provider
      const response = await fetch(`${this.baseURL}/api/providers/available`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get provider models: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      const provider = data.providers.find(p => p.id === providerId);

      if (!provider) {
        throw new Error(`Provider ${providerId} not found`);
      }

      return provider.models.map(modelId => ({
        id: modelId,
        name: modelId,
        providerId: provider.id,
        capabilities: this.getCapabilitiesForModel(modelId, provider.id),
        description: `${modelId} model from ${provider.name}`,
        isAvailable: true
      }));
    } catch (error) {
      console.error(`Error getting models for provider ${providerId}:`, error);
      // Re-throw the error for the caller to handle appropriately
      throw error;
    }
  }

  /**
   * Get all models for all providers
   * @returns {Promise<Array>} Array of all available models
   */
  async getAllModels() {
    try {
      const response = await fetch(`${this.baseURL}/api/providers/available`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to get all models: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      const allModels = [];

      for (const provider of data.providers) {
        const providerModels = await this.getProviderModels(provider.id);
        allModels.push(...providerModels);
      }

      return allModels;
    } catch (error) {
      console.error('Error getting all models:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const modelService = new ModelService();
export default modelService;