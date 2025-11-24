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
    const env = process?.env?.NODE_ENV || 'development';
    
    if (env === 'production') {
      return '';
    } else {
      return 'http://localhost:3000';
    }
  }

  /**
   * Get available models for a specific provider
   * @param {string} providerId - ID of the provider
   * @returns {Promise<Array>} Array of available models
   */
  async getProviderModels(providerId) {
    try {
      // We'll get the models from the available providers endpoint
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

      // Format the models to the expected structure
      return provider.models.map(modelId => ({
        id: modelId,
        name: modelId,
        providerId: providerId,
        capabilities: this.getCapabilitiesForModel(modelId, providerId),
        description: `${modelId} model from ${provider.name}`,
        isAvailable: true
      }));
    } catch (error) {
      console.error(`Error getting models for provider ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Get capabilities for a model based on provider and model ID
   * @param {string} modelId - ID of the model
   * @param {string} providerId - ID of the provider
   * @returns {Array} Array of capabilities
   */
  getCapabilitiesForModel(modelId, providerId) {
    const capabilities = ['text-generation'];

    // Add provider-specific capabilities
    if (providerId === 'openai') {
      if (modelId.includes('gpt-4')) {
        capabilities.push('reasoning', 'advanced-context');
      } else if (modelId.includes('gpt-3.5')) {
        capabilities.push('reasoning');
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
      if (modelId.includes('llama')) {
        capabilities.push('reasoning');
      }
      
      if (modelId.includes('whisper')) {
        capabilities.push('audio-processing');
      }
    } else if (providerId === 'gemini') {
      if (modelId.includes('vision')) {
        capabilities.push('image-analysis');
      }

      if (modelId.includes('flash')) {
        capabilities.push('fast-response');
      }
    } else if (providerId === 'openrouter') {
      if (modelId.includes('free')) {
        capabilities.push('free-tier');
      }
    }

    return capabilities;
  }

  /**
   * Get all models for all providers
   * @returns {Promise<Array>} Array of all available models
   */
  async getAllModels() {
    try {
      const providers = await fetch(`${this.baseURL}/api/providers/available`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(r => r.json()).then(data => data.providers);

      const allModels = [];
      for (const provider of providers) {
        const providerModels = await this.getProviderModels(provider.id);
        allModels.push(...providerModels);
      }

      return allModels;
    } catch (error) {
      console.error('Error getting all models:', error);
      throw error;
    }
  }

  /**
   * Get model by ID and provider
   * @param {string} modelId - ID of the model
   * @param {string} providerId - ID of the provider
   * @returns {Promise<Object>} Model information
   */
  async getModel(modelId, providerId) {
    try {
      const models = await this.getProviderModels(providerId);
      const model = models.find(m => m.id === modelId);
      
      if (!model) {
        throw new Error(`Model ${modelId} not found for provider ${providerId}`);
      }

      return model;
    } catch (error) {
      console.error(`Error getting model ${modelId} for provider ${providerId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
const modelService = new ModelService();
export default modelService;