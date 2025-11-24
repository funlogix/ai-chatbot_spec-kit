/**
 * Gemini Provider Adapter
 * Implements the BaseProvider interface for Google's Gemini API
 */
import BaseProvider from './baseProvider.js';

class GeminiProvider extends BaseProvider {
  constructor(providerConfig) {
    super(providerConfig);
    this.name = 'Gemini';
    // When using backend proxy, we don't directly connect to provider APIs
    this.apiEndpoint = '/api/proxy'; // Use backend proxy
  }

  /**
   * Initialize the Gemini provider
   * @returns {Promise<void>}
   */
  async init() {
    console.log(`${this.name} provider initialized to use backend proxy`);
    // Perform any Gemini-specific initialization
    return Promise.resolve();
  }

  /**
   * Make a request to the Gemini API via backend proxy
   * @param {Object} requestData - Data for the AI request
   * @returns {Promise<Object>} Response from the Gemini API
   */
  async makeRequest(requestData) {
    // Check rate limits
    const rateLimitCheck = await this.checkRateLimit(requestData);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${rateLimitCheck.timeToReset || 0} seconds.`);
    }

    // Transform the request to Gemini's format
    const geminiRequest = this.transformRequest(requestData);

    try {
      // Use the backend proxy instead of direct API call
      const response = await fetch('/api/proxy/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId: this.providerId,
          model: geminiRequest.model,
          messages: geminiRequest.messages, // This will be transformed in the backend
          temperature: geminiRequest.temperature,
          maxOutputTokens: geminiRequest.maxOutputTokens,
          topP: geminiRequest.topP,
          topK: geminiRequest.topK
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
      console.error(`Error making request to Gemini via proxy:`, error);
      throw error;
    }
  }

  /**
   * Transform a standard request to Gemini's specific format
   * @param {Object} requestData - Standard request data
   * @returns {Object} Gemini-specific request data
   */
  transformRequest(requestData) {
    // Default model if not specified
    const model = requestData.model || this.providerConfig.defaultModel || 'gemini-pro';
    
    // Construct the request body according to Gemini's API specification
    const geminiRequest = {
      contents: [{
        parts: [{
          text: requestData.prompt || requestData.content || (requestData.messages && requestData.messages.length > 0 
            ? requestData.messages[requestData.messages.length - 1].content 
            : '')
        }]
      }],
      generationConfig: {
        temperature: requestData.temperature !== undefined ? requestData.temperature : 0.9,
        maxOutputTokens: requestData.max_tokens,
        topP: requestData.top_p,
        topK: requestData.top_k
      }
    };

    // Only include properties that have actual values
    if (!geminiRequest.generationConfig.maxOutputTokens) delete geminiRequest.generationConfig.maxOutputTokens;
    if (!geminiRequest.generationConfig.topP) delete geminiRequest.generationConfig.topP;
    if (!geminiRequest.generationConfig.topK) delete geminiRequest.generationConfig.topK;
    
    return geminiRequest;
  }

  /**
   * Transform the Gemini API response to standard format
   * @param {Object} geminiResponse - Gemini API response
   * @returns {Object} Standard response format
   */
  transformResponse(geminiResponse) {
    // Transform Gemini response to standard format
    return {
      id: `gemini-${Date.now()}`, // Create an ID since Gemini doesn't return one in this format
      object: 'generateContentResponse',
      created: Math.floor(Date.now() / 1000),
      model: 'gemini-unknown', // Gemini doesn't return the model in the response for this endpoint
      choices: geminiResponse.candidates ? geminiResponse.candidates.map((candidate, index) => ({
        index: index,
        message: {
          role: 'model', // Gemini's role
          content: candidate.content.parts ? candidate.content.parts.map(part => part.text).join('') : ''
        },
        finish_reason: candidate.finishReason || 'unknown'
      })) : [],
      usage: geminiResponse.usageMetadata ? {
        prompt_tokens: geminiResponse.usageMetadata.promptTokenCount || 0,
        completion_tokens: geminiResponse.usageMetadata.candidatesTokenCount || 0,
        total_tokens: geminiResponse.usageMetadata.totalTokenCount || 0
      } : null,
      provider_specific: {
        raw_response: geminiResponse
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
   * Health check for the Gemini provider via backend proxy
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
   * Get available models from Gemini via backend proxy
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

      // Find the Gemini provider in the response
      const geminiProvider = data.providers.find(p => p.id === this.providerId);

      if (!geminiProvider) {
        throw new Error(`Gemini provider not found in available providers`);
      }

      // Transform the models data into the expected format
      const models = geminiProvider.models.map(modelId => ({
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
      console.error('Error fetching models from Gemini via backend:', error);
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
    
    if (modelId.includes('vision')) {
      capabilities.push('image-analysis');
    }
    
    if (modelId.includes('flash')) {
      capabilities.push('fast-response');
    }
    
    return capabilities;
  }
}

export default GeminiProvider;