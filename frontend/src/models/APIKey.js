/**
 * API Key Model
 * Secure credential used to authenticate with an AI provider API
 */
class APIKey {
  constructor(data = {}) {
    this.keyId = data.keyId || this.generateId();
    this.providerId = data.providerId || '';
    this.encryptedKey = data.encryptedKey || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Generate a unique ID for the API key
   * @returns {string} A unique identifier
   */
  generateId() {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate the API key instance
   * @returns {Object} Object with isValid boolean and errors array
   */
  validate() {
    const errors = [];

    if (!this.keyId || typeof this.keyId !== 'string' || this.keyId.trim() === '') {
      errors.push('keyId is required and must be a non-empty string');
    }

    if (!this.providerId || typeof this.providerId !== 'string' || this.providerId.trim() === '') {
      errors.push('providerId is required and must be a non-empty string');
    }

    if (!this.encryptedKey || typeof this.encryptedKey !== 'string' || this.encryptedKey.trim() === '') {
      errors.push('encryptedKey is required and must be a non-empty string');
    }

    if (typeof this.isActive !== 'boolean') {
      errors.push('isActive must be a boolean');
    }

    if (this.createdAt) {
      const date = new Date(this.createdAt);
      if (isNaN(date.getTime())) {
        errors.push('createdAt must be a valid date string');
      }
    }

    if (this.updatedAt) {
      const date = new Date(this.updatedAt);
      if (isNaN(date.getTime())) {
        errors.push('updatedAt must be a valid date string');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Activate the API key
   * @returns {void}
   */
  activate() {
    this.isActive = true;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Deactivate the API key
   * @returns {void}
   */
  deactivate() {
    this.isActive = false;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get API key as a plain object
   * NOTE: The encrypted key is included in the object but should be handled securely
   * @returns {Object} Plain API key object
   */
  toObject() {
    return {
      keyId: this.keyId,
      providerId: this.providerId,
      // Note: In a real implementation, the encrypted key might be omitted from this representation
      // for security reasons, depending on the context where this object is used
      encryptedKey: this.encryptedKey,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create an APIKey instance from a plain object
   * @param {Object} data - Plain object with API key data
   * @returns {APIKey} APIKey instance
   */
  static fromObject(data) {
    return new APIKey(data);
  }
}

export default APIKey;