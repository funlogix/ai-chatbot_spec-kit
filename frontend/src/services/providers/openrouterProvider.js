/**
 * OpenRouter Provider Adapter
 * Implements the BaseProvider interface for OpenRouter's API
 */
import BaseProvider from './baseProvider.js';

class OpenRouterProvider extends BaseProvider {
  constructor(providerConfig) {
    super(providerConfig);
    this.name = 'OpenRouter';
    // When using backend proxy, we don't directly connect to provider APIs
    this.apiEndpoint = '/api/proxy'; // Use backend proxy
  }

  /**
   * Initialize the OpenRouter provider
   * @returns {Promise<void>}
   */
  async init() {
    console.log(`${this.name} provider initialized to use backend proxy`);
    // Perform any OpenRouter-specific initialization
    return Promise.resolve();
  }

  /**
   * Make a request to the OpenRouter API via backend proxy
   * @param {Object} requestData - Data for the AI request
   * @returns {Promise<Object>} Response from the OpenRouter API
   */
  async makeRequest(requestData) {
    // Check rate limits
    const rateLimitCheck = await this.checkRateLimit(requestData);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${rateLimitCheck.timeToReset || 0} seconds.`);
    }

    // Transform the request to OpenRouter's format
    const openrouterRequest = this.transformRequest(requestData);

    try {
      // Use the backend proxy instead of direct API call
      const response = await fetch('/api/proxy/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId: this.providerId,
          model: openrouterRequest.model,
          messages: openrouterRequest.messages,
          temperature: openrouterRequest.temperature,
          max_tokens: openrouterRequest.max_tokens,
          top_p: openrouterRequest.top_p,
          stream: openrouterRequest.stream,
          presence_penalty: openrouterRequest.presence_penalty,
          frequency_penalty: openrouterRequest.frequency_penalty,
          tools: openrouterRequest.tools,
          tool_choice: openrouterRequest.tool_choice
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
      console.error(`Error making request to OpenRouter via proxy:`, error);
      throw error;
    }
  }

  /**
   * Transform a standard request to OpenRouter's specific format
   * @param {Object} requestData - Standard request data
   * @returns {Object} OpenRouter-specific request data
   */
  transformRequest(requestData) {
    // Default model if not specified
    const model = requestData.model || this.providerConfig.defaultModel || 'mistralai/mistral-7b-instruct:free';
    
    // Construct the request body according to OpenRouter's API specification
    const openrouterRequest = {
      model: model,
      messages: requestData.messages || [
        { role: 'user', content: requestData.prompt || requestData.content || '' }
      ],
      temperature: requestData.temperature !== undefined ? requestData.temperature : 0.7,
      max_tokens: requestData.max_tokens,
      top_p: requestData.top_p !== undefined ? requestData.top_p : 1.0,
      stream: requestData.stream || false,
      presence_penalty: requestData.presence_penalty,
      frequency_penalty: requestData.frequency_penalty,
      ...(requestData.tools && { tools: requestData.tools }),
      ...(requestData.tool_choice && { tool_choice: requestData.tool_choice })
    };

    // Only include properties that have actual values
    Object.keys(openrouterRequest).forEach(key => {
      if (openrouterRequest[key] === undefined) {
        delete openrouterRequest[key];
      }
    });
    
    return openrouterRequest;
  }

  /**
   * Transform the OpenRouter API response to standard format
   * @param {Object} openrouterResponse - OpenRouter API response
   * @returns {Object} Standard response format
   */
  transformResponse(openrouterResponse) {
    // Transform OpenRouter response to standard format
    return {
      id: openrouterResponse.id,
      object: openrouterResponse.object,
      created: openrouterResponse.created,
      model: openrouterResponse.model,
      choices: openrouterResponse.choices.map(choice => ({
        index: choice.index,
        message: {
          role: choice.message.role,
          content: choice.message.content
        },
        finish_reason: choice.finish_reason
      })),
      usage: openrouterResponse.usage ? {
        prompt_tokens: openrouterResponse.usage.prompt_tokens,
        completion_tokens: openrouterResponse.usage.completion_tokens,
        total_tokens: openrouterResponse.usage.total_tokens
      } : null,
      provider_specific: {
        raw_response: openrouterResponse
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
   * Health check for the OpenRouter provider via backend proxy
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
   * Get available models from OpenRouter via backend proxy
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

      // Find the OpenRouter provider in the response
      const openrouterProvider = data.providers.find(p => p.id === this.providerId);

      if (!openrouterProvider) {
        throw new Error(`OpenRouter provider not found in available providers`);
      }

      // Transform the models data into the expected format
      const models = openrouterProvider.models.map(modelId => ({
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
      console.error('Error fetching models from OpenRouter via backend:', error);
      throw error;
    }
  }

  /**
   * Determine capabilities based on model name
   * @param {string} modelId - Model ID
   * @returns {Array} Capabilities list
   */
  getCapabilitiesForModel(modelId) {
    const capabilities = ['text-generation'];
    
    if (modelId.includes('dall-e')) {
      capabilities.push('image-generation');
    }
    
    if (modelId.includes('whisper')) {
      capabilities.push('speech-to-text');
    }
    
    if (modelId.includes('tts')) {
      capabilities.push('text-to-speech');
    }
    
    if (modelId.includes('free')) {
      capabilities.push('free-tier');
    }
    
    return capabilities;
  }
}

export default OpenRouterProvider;