/**
 * Groq Provider Adapter
 * Implements the BaseProvider interface for Groq's API
 */
import BaseProvider from './baseProvider.js';

class GroqProvider extends BaseProvider {
  constructor(providerConfig) {
    super(providerConfig);
    this.name = 'Groq';
    this.apiEndpoint = this.endpoint || 'https://api.groq.com/openai/v1';
  }

  /**
   * Initialize the Groq provider
   * @returns {Promise<void>}
   */
  async init() {
    console.log(`${this.name} provider initialized with endpoint: ${this.apiEndpoint}`);
    // Perform any Groq-specific initialization
    return Promise.resolve();
  }

  /**
   * Make a request to the Groq API via backend proxy
   * @param {Object} requestData - Data for the AI request
   * @returns {Promise<Object>} Response from the Groq API
   */
  async makeRequest(requestData) {
    // Check rate limits
    const rateLimitCheck = await this.checkRateLimit(requestData);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${rateLimitCheck.timeToReset || 0} seconds.`);
    }

    // Transform the request to Groq's format
    const groqRequest = this.transformRequest(requestData);

    try {
      // Use the backend proxy instead of direct API call
      const response = await fetch('/api/proxy/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId: this.providerId,
          model: groqRequest.model,
          messages: groqRequest.messages,
          temperature: groqRequest.temperature,
          max_tokens: groqRequest.max_tokens,
          top_p: groqRequest.top_p,
          stream: groqRequest.stream,
          stop: groqRequest.stop
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
      console.error(`Error making request to Groq via proxy:`, error);
      throw error;
    }
  }

  /**
   * Transform a standard request to Groq's specific format
   * @param {Object} requestData - Standard request data
   * @returns {Object} Groq-specific request data
   */
  transformRequest(requestData) {
    // Default model if not specified
    const model = requestData.model || this.providerConfig.defaultModel || 'llama3-8b-8192';
    
    // Construct the request body according to Groq's API specification
    return {
      model: model,
      messages: requestData.messages || [
        { role: 'user', content: requestData.prompt || requestData.content || '' }
      ],
      temperature: requestData.temperature || 0.7,
      max_tokens: requestData.max_tokens || 1024,
      top_p: requestData.top_p || 1.0,
      stream: requestData.stream || false,
      stop: requestData.stop || null
    };
  }

  /**
   * Transform the Groq API response to standard format
   * @param {Object} groqResponse - Groq API response
   * @returns {Object} Standard response format
   */
  transformResponse(groqResponse) {
    // Transform Groq response to standard format
    return {
      id: groqResponse.id,
      object: groqResponse.object,
      created: groqResponse.created,
      model: groqResponse.model,
      choices: groqResponse.choices.map(choice => ({
        index: choice.index,
        message: {
          role: choice.message.role,
          content: choice.message.content
        },
        finish_reason: choice.finish_reason
      })),
      usage: groqResponse.usage ? {
        prompt_tokens: groqResponse.usage.prompt_tokens || 0,
        completion_tokens: groqResponse.usage.completion_tokens || 0,
        total_tokens: groqResponse.usage.total_tokens || 0
      } : null,
      provider_specific: {
        raw_response: groqResponse
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
   * Health check for the Groq provider via backend proxy
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    const baseHealth = await super.healthCheck();

    try {
      // Use the backend proxy to check provider status
      const response = await fetch(`/api/providers/${this.providerId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
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
   * Get available models from Groq via backend proxy
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

      // Find the Groq provider in the response
      const groqProvider = data.providers.find(p => p.id === this.providerId);

      if (!groqProvider) {
        throw new Error(`Groq provider not found in available providers`);
      }

      // Transform the models data into the expected format
      const models = groqProvider.models.map(modelId => ({
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
      console.error('Error fetching models from Groq via backend:', error);
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
    
    if (modelId.includes('whisper')) {
      capabilities.push('audio-processing');
    }
    
    if (modelId.includes('llama') || modelId.includes('mixtral')) {
      capabilities.push('reasoning');
    }
    
    return capabilities;
  }
}

export default GroqProvider;