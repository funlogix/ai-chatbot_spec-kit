/**
 * TaskType Model
 * Represents a category of AI task (e.g., chat, image generation, text processing)
 */
class TaskType {
  constructor(data = {}) {
    this.taskTypeId = data.taskTypeId || '';
    this.taskTypeName = data.taskTypeName || '';
    this.description = data.description || '';
    this.defaultProviderId = data.defaultProviderId || null;
    this.defaultModelId = data.defaultModelId || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validate the task type instance
   * @returns {Object} Object with isValid boolean and errors array
   */
  validate() {
    const errors = [];

    if (!this.taskTypeId || typeof this.taskTypeId !== 'string' || this.taskTypeId.trim() === '') {
      errors.push('taskTypeId is required and must be a non-empty string');
    }

    if (!this.taskTypeName || typeof this.taskTypeName !== 'string' || this.taskTypeName.trim() === '') {
      errors.push('taskTypeName is required and must be a non-empty string');
    }

    if (this.description && typeof this.description !== 'string') {
      errors.push('description must be a string');
    }

    // If defaultProviderId is provided, it should be a non-empty string
    if (this.defaultProviderId && 
        (typeof this.defaultProviderId !== 'string' || this.defaultProviderId.trim() === '')) {
      errors.push('defaultProviderId must be a non-empty string');
    }

    // If defaultModelId is provided, it should be a non-empty string
    if (this.defaultModelId && 
        (typeof this.defaultModelId !== 'string' || this.defaultModelId.trim() === '')) {
      errors.push('defaultModelId must be a non-empty string');
    }

    // If one of defaultProviderId or defaultModelId is set, both should be set (or both null)
    if ((this.defaultProviderId && !this.defaultModelId) || (!this.defaultProviderId && this.defaultModelId)) {
      errors.push('defaultProviderId and defaultModelId must both be set or both be null');
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
   * Set default provider and model for this task type
   * @param {string} providerId - ID of the default provider
   * @param {string} modelId - ID of the default model
   * @returns {void}
   */
  setDefaultProviderAndModel(providerId, modelId) {
    if (!providerId || !modelId) {
      throw new Error('Provider ID and Model ID are required');
    }
    
    this.defaultProviderId = providerId;
    this.defaultModelId = modelId;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Clear default provider and model for this task type
   * @returns {void}
   */
  clearDefaultProviderAndModel() {
    this.defaultProviderId = null;
    this.defaultModelId = null;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Check if this task type has default provider and model set
   * @returns {boolean} True if both default provider and model are set
   */
  hasDefaultProviderAndModel() {
    return !!this.defaultProviderId && !!this.defaultModelId;
  }

  /**
   * Get task type as a plain object
   * @returns {Object} Plain task type object
   */
  toObject() {
    return {
      taskTypeId: this.taskTypeId,
      taskTypeName: this.taskTypeName,
      description: this.description,
      defaultProviderId: this.defaultProviderId,
      defaultModelId: this.defaultModelId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create a TaskType instance from a plain object
   * @param {Object} data - Plain object with task type data
   * @returns {TaskType} TaskType instance
   */
  static fromObject(data) {
    return new TaskType(data);
  }
}

export default TaskType;