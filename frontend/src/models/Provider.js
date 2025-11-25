/**
 * Provider Model
 * Represents an AI service provider (e.g., OpenAI, Groq, Gemini)
 */
class Provider {
  constructor(data = {}) {
    this.providerId = data.providerId || '';
    this.providerName = data.providerName || '';
    this.endpoint = data.endpoint || '';
    this.apiKey = data.apiKey || '';
    this.models = Array.isArray(data.models) ? data.models : [];
    this.rateLimit = data.rateLimit || {};
    this.tier = data.tier || 'free'; // 'free', 'paid', 'enterprise'
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validate the provider instance
   * @returns {Object} Object with isValid boolean and errors array
   */
  validate() {
    const errors = [];

    if (!this.providerId || typeof this.providerId !== 'string' || this.providerId.trim() === '') {
      errors.push('providerId is required and must be a non-empty string');
    }

    if (!this.providerName || typeof this.providerName !== 'string' || this.providerName.trim() === '') {
      errors.push('providerName is required and must be a non-empty string');
    }

    if (!this.endpoint || typeof this.endpoint !== 'string' || this.endpoint.trim() === '') {
      errors.push('endpoint is required and must be a non-empty string');
    } else {
      // Validate that endpoint is a proper URL
      try {
        new URL(this.endpoint);
      } catch (e) {
        errors.push('endpoint must be a valid URL');
      }
    }

    if (this.rateLimit && typeof this.rateLimit === 'object') {
      if (this.rateLimit.requestsPerMinute !== undefined && 
          (typeof this.rateLimit.requestsPerMinute !== 'number' || this.rateLimit.requestsPerMinute < 0)) {
        errors.push('rateLimit.requestsPerMinute must be a non-negative number');
      }
    } else {
      // If rateLimit is not an object, that's an error
      errors.push('rateLimit must be an object');
    }

    if (!['free', 'paid', 'enterprise'].includes(this.tier)) {
      errors.push('tier must be one of: free, paid, enterprise');
    }

    if (typeof this.isActive !== 'boolean') {
      errors.push('isActive must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if the provider is active
   * @returns {boolean} True if provider is active
   */
  isActiveProvider() {
    return this.isActive;
  }

  /**
   * Add a model to the provider
   * @param {Object} model - Model to add
   * @returns {void}
   */
  addModel(model) {
    if (!model || !model.modelId) {
      throw new Error('Model must have a modelId');
    }
    // Check if model already exists
    if (!this.models.some(m => m.modelId === model.modelId)) {
      this.models.push(model);
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Remove a model from the provider
   * @param {string} modelId - ID of the model to remove
   * @returns {boolean} True if model was removed, false if not found
   */
  removeModel(modelId) {
    const initialLength = this.models.length;
    this.models = this.models.filter(model => model.modelId !== modelId);
    if (this.models.length !== initialLength) {
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Find a model by ID
   * @param {string} modelId - ID of the model to find
   * @returns {Object|undefined} Model object if found, undefined otherwise
   */
  findModel(modelId) {
    return this.models.find(model => model.modelId === modelId);
  }

  /**
   * Get provider as a plain object
   * @returns {Object} Plain provider object
   */
  toObject() {
    // Excluding apiKey from the returned object for security reasons
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      endpoint: this.endpoint,
      models: [...this.models],
      rateLimit: { ...this.rateLimit },
      tier: this.tier,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create a Provider instance from a plain object
   * @param {Object} data - Plain object with provider data
   * @returns {Provider} Provider instance
   */
  static fromObject(data) {
    return new Provider(data);
  }
}

export default Provider;