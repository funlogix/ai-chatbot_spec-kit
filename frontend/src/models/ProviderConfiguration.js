/**
 * ProviderConfiguration Model
 * Settings that define how to connect to and use an AI provider
 */
class ProviderConfiguration {
  constructor(data = {}) {
    this.configId = data.configId || this.generateId();
    this.providerId = data.providerId || '';
    this.assignedTaskTypes = Array.isArray(data.assignedTaskTypes) ? [...data.assignedTaskTypes] : [];
    this.rateLimitOverride = data.rateLimitOverride || null; // Optional override of default rate limits
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Generate a unique ID for the configuration
   * @returns {string} A unique identifier
   */
  generateId() {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate the provider configuration instance
   * @returns {Object} Object with isValid boolean and errors array
   */
  validate() {
    const errors = [];

    if (!this.configId || typeof this.configId !== 'string' || this.configId.trim() === '') {
      errors.push('configId is required and must be a non-empty string');
    }

    if (!this.providerId || typeof this.providerId !== 'string' || this.providerId.trim() === '') {
      errors.push('providerId is required and must be a non-empty string');
    }

    if (!Array.isArray(this.assignedTaskTypes)) {
      errors.push('assignedTaskTypes must be an array');
    } else {
      // Validate each task type
      for (let i = 0; i < this.assignedTaskTypes.length; i++) {
        const taskType = this.assignedTaskTypes[i];
        if (typeof taskType !== 'string' || taskType.trim() === '') {
          errors.push(`assignedTaskTypes[${i}] must be a non-empty string`);
        }
      }
    }

    if (this.rateLimitOverride !== null && typeof this.rateLimitOverride !== 'object') {
      errors.push('rateLimitOverride must be an object or null');
    } else if (this.rateLimitOverride !== null) {
      // Validate rate limit override properties if present
      if (this.rateLimitOverride.requestsPerMinute !== undefined && 
          (typeof this.rateLimitOverride.requestsPerMinute !== 'number' || 
          this.rateLimitOverride.requestsPerMinute < 0)) {
        errors.push('rateLimitOverride.requestsPerMinute must be a non-negative number');
      }
      
      if (this.rateLimitOverride.requestsPerDay !== undefined && 
          (typeof this.rateLimitOverride.requestsPerDay !== 'number' || 
          this.rateLimitOverride.requestsPerDay < 0)) {
        errors.push('rateLimitOverride.requestsPerDay must be a non-negative number');
      }
      
      if (this.rateLimitOverride.tokensPerMinute !== undefined && 
          (typeof this.rateLimitOverride.tokensPerMinute !== 'number' || 
          this.rateLimitOverride.tokensPerMinute < 0)) {
        errors.push('rateLimitOverride.tokensPerMinute must be a non-negative number');
      }
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
   * Add an assigned task type to the configuration
   * @param {string} taskType - Task type to add
   * @returns {void}
   */
  addAssignedTaskType(taskType) {
    if (typeof taskType !== 'string' || taskType.trim() === '') {
      throw new Error('Task type must be a non-empty string');
    }

    if (!this.assignedTaskTypes.includes(taskType)) {
      this.assignedTaskTypes.push(taskType);
      this.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Remove an assigned task type from the configuration
   * @param {string} taskType - Task type to remove
   * @returns {boolean} True if task type was removed, false if not found
   */
  removeAssignedTaskType(taskType) {
    const initialLength = this.assignedTaskTypes.length;
    this.assignedTaskTypes = this.assignedTaskTypes.filter(t => t !== taskType);
    if (this.assignedTaskTypes.length !== initialLength) {
      this.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Check if a task type is assigned to this configuration
   * @param {string} taskType - Task type to check
   * @returns {boolean} True if task type is assigned
   */
  isTaskTypeAssigned(taskType) {
    return this.assignedTaskTypes.includes(taskType);
  }

  /**
   * Get provider configuration as a plain object
   * @returns {Object} Plain provider configuration object
   */
  toObject() {
    return {
      configId: this.configId,
      providerId: this.providerId,
      assignedTaskTypes: [...this.assignedTaskTypes],
      rateLimitOverride: this.rateLimitOverride ? { ...this.rateLimitOverride } : null,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create a ProviderConfiguration instance from a plain object
   * @param {Object} data - Plain object with provider configuration data
   * @returns {ProviderConfiguration} ProviderConfiguration instance
   */
  static fromObject(data) {
    return new ProviderConfiguration(data);
  }
}

export default ProviderConfiguration;