/**
 * OpenAI Provider Adapter
 * Implements the BaseProvider interface for OpenAI's API
 */
import BaseProvider from './baseProvider.js';

class OpenAIProvider extends BaseProvider {
  constructor(providerConfig) {
    super(providerConfig);
    this.name = 'OpenAI';
    // When using backend proxy, we don't directly connect to provider APIs
    this.apiEndpoint = '/api/proxy'; // Use backend proxy
  }

  /**
   * Initialize the OpenAI provider
   * @returns {Promise<void>}
   */
  async init() {
    console.log(`${this.name} provider initialized to use backend proxy`);
    // Perform any OpenAI-specific initialization
    return Promise.resolve();
  }

  /**
   * Make a request to the OpenAI API via backend proxy
   * @param {Object} requestData - Data for the AI request
   * @returns {Promise<Object>} Response from the OpenAI API
   */
  async makeRequest(requestData) {
    // Check rate limits
    const rateLimitCheck = await this.checkRateLimit(requestData);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${rateLimitCheck.timeToReset || 0} seconds.`);
    }

    // Transform the request to OpenAI's format
    const openaiRequest = this.transformRequest(requestData);

    try {
      // Use the backend proxy instead of direct API call
      const response = await fetch('/api/proxy/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId: this.providerId,
          model: openaiRequest.model,
          messages: openaiRequest.messages,
          temperature: openaiRequest.temperature,
          max_tokens: openaiRequest.max_tokens,
          top_p: openaiRequest.top_p,
          frequency_penalty: openaiRequest.frequency_penalty,
          presence_penalty: openaiRequest.presence_penalty,
          stream: openaiRequest.stream,
          stop: openaiRequest.stop
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend proxy error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();

      // Record the API call for rate limiting
      const { default: rateLimiter } = await import('../../utils/rateLimiter.js');
      await rateLimiter.recordAPIRequest(this.providerId);

      // Transform the response to standard format
      return this.transformResponse(data);
    } catch (error) {
      console.error(`Error making request to OpenAI via proxy:`, error);
      throw error;
    }
  }

  /**
   * Transform a standard request to OpenAI's specific format
   * @param {Object} requestData - Standard request data
   * @returns {Object} OpenAI-specific request data
   */
  transformRequest(requestData) {
    // Default model if not specified
    const model = requestData.model || this.providerConfig.defaultModel || 'gpt-3.5-turbo';
    
    // Construct the request body according to OpenAI's API specification
    const openaiRequest = {
      model: model,
      messages: requestData.messages || [
        { role: 'user', content: requestData.prompt || requestData.content || '' }
      ],
      temperature: requestData.temperature !== undefined ? requestData.temperature : 0.7,
      max_tokens: requestData.max_tokens,
      top_p: requestData.top_p !== undefined ? requestData.top_p : 1.0,
      frequency_penalty: requestData.frequency_penalty,
      presence_penalty: requestData.presence_penalty,
      stream: requestData.stream || false,
      stop: requestData.stop
    };

    // Only include properties that have actual values
    Object.keys(openaiRequest).forEach(key => {
      if (openaiRequest[key] === undefined) {
        delete openaiRequest[key];
      }
    });
    
    return openaiRequest;
  }

  /**
   * Transform the OpenAI API response to standard format
   * @param {Object} openaiResponse - OpenAI API response
   * @returns {Object} Standard response format
   */
  transformResponse(openaiResponse) {
    // Transform OpenAI response to standard format
    return {
      id: openaiResponse.id,
      object: openaiResponse.object,
      created: openaiResponse.created,
      model: openaiResponse.model,
      choices: openaiResponse.choices.map(choice => ({
        index: choice.index,
        message: {
          role: choice.message.role,
          content: choice.message.content
        },
        finish_reason: choice.finish_reason
      })),
      usage: openaiResponse.usage ? {
        prompt_tokens: openaiResponse.usage.prompt_tokens,
        completion_tokens: openaiResponse.usage.completion_tokens,
        total_tokens: openaiResponse.usage.total_tokens
      } : null,
      provider_specific: {
        raw_response: openaiResponse
      }
    };
  }

  /**
   * Get the headers for backend proxy requests
   * @returns {Object} Headers object
   */
  getHeaders() {
    // When using the backend proxy, we don't need provider-specific headers
    // since the backend handles the direct API communication
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Health check for the OpenAI provider via backend proxy
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();

    try {
      // Use the backend proxy to check provider status
      const response = await fetch(`/api/providers/${this.providerId}/status`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      baseHealth.isHealthy = response.ok;
      baseHealth.details.apiAccessible = response.ok;

      if (response.ok) {
        const data = await response.json();
        baseHealth.details.status = data.status;
        baseHealth.details.hasApiKey = data.hasApiKey;
      }
    } catch (error) {
      baseHealth.isHealthy = false;
      baseHealth.details.error = error.message;
    }

    return baseHealth;
  }

  /**
   * Get available models from OpenAI via backend proxy
   * @returns {Promise<Array>} List of available models
   */
  async getAvailableModels() {
    try {
      // Use the backend to get provider configuration which includes models
      const response = await fetch('/api/providers/available', {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch available providers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Find the OpenAI provider in the response
      const openaiProvider = data.providers.find(p => p.id === this.providerId);

      if (!openaiProvider) {
        throw new Error(`OpenAI provider not found in available providers`);
      }

      // Transform the models data into the expected format
      const models = openaiProvider.models.map(modelId => ({
        modelId: modelId,
        modelName: modelId,
        providerId: this.providerId,
        capabilities: this.getCapabilitiesForModel(modelId),
        createdAt: new Date().toISOString()
      }));

      // Update stored models
      this.models = models;

      return models;
    } catch (error) {
      console.error('Error fetching models from OpenAI via backend:', error);
      throw error;
    }
  }

  /**
   * Determine capabilities based on model name
   * @param {string} modelId - Model ID
   * @returns {Array} Capabilities list
   */
  getCapabilitiesForModel(modelId) {
    // Different models may have different capabilities
    const capabilities = ['text-generation'];
    
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
    
    return capabilities;
  }
}

export default OpenAIProvider;