/**
 * Model Model
 * Represents a specific AI model within a provider (e.g., GPT-4, Gemini Pro)
 */
class Model {
  constructor(data = {}) {
    this.modelId = data.modelId || '';
    this.modelName = data.modelName || '';
    this.providerId = data.providerId || '';
    this.capabilities = Array.isArray(data.capabilities) ? [...data.capabilities] : [];
    this.pricing = data.pricing || {};
    this.isDefault = data.isDefault === true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validate the model instance
   * @returns {Object} Object with isValid boolean and errors array
   */
  validate() {
    const errors = [];

    if (!this.modelId || typeof this.modelId !== 'string' || this.modelId.trim() === '') {
      errors.push('modelId is required and must be a non-empty string');
    }

    if (!this.modelName || typeof this.modelName !== 'string' || this.modelName.trim() === '') {
      errors.push('modelName is required and must be a non-empty string');
    }

    if (!this.providerId || typeof this.providerId !== 'string' || this.providerId.trim() === '') {
      errors.push('providerId is required and must be a non-empty string');
    }

    if (!Array.isArray(this.capabilities)) {
      errors.push('capabilities must be an array');
    } else {
      // Validate that all capabilities are strings
      for (let i = 0; i < this.capabilities.length; i++) {
        if (typeof this.capabilities[i] !== 'string') {
          errors.push(`capabilities[${i}] must be a string`);
        }
      }
    }

    if (this.pricing && typeof this.pricing !== 'object') {
      errors.push('pricing must be an object');
    }

    if (typeof this.isDefault !== 'boolean') {
      errors.push('isDefault must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Add a capability to the model
   * @param {string} capability - Capability to add
   * @returns {void}
   */
  addCapability(capability) {
    if (typeof capability !== 'string' || capability.trim() === '') {
      throw new Error('Capability must be a non-empty string');
    }
    
    if (!this.capabilities.includes(capability)) {
      this.capabilities.push(capability);
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Remove a capability from the model
   * @param {string} capability - Capability to remove
   * @returns {boolean} True if capability was removed, false if not found
   */
  removeCapability(capability) {
    const initialLength = this.capabilities.length;
    this.capabilities = this.capabilities.filter(c => c !== capability);
    if (this.capabilities.length !== initialLength) {
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Check if the model has a specific capability
   * @param {string} capability - Capability to check
   * @returns {boolean} True if model has the capability
   */
  hasCapability(capability) {
    return this.capabilities.includes(capability);
  }

  /**
   * Get model as a plain object
   * @returns {Object} Plain model object
   */
  toObject() {
    return {
      modelId: this.modelId,
      modelName: this.modelName,
      providerId: this.providerId,
      capabilities: [...this.capabilities],
      pricing: { ...this.pricing },
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create a Model instance from a plain object
   * @param {Object} data - Plain object with model data
   * @returns {Model} Model instance
   */
  static fromObject(data) {
    return new Model(data);
  }
}

export default Model;