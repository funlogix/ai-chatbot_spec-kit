/**
 * UserPreference Model
 * Settings that allow users to select which provider/model to use for their requests
 */
class UserPreference {
  constructor(data = {}) {
    this.userId = data.userId || '';
    this.selectedProviderId = data.selectedProviderId || '';
    this.selectedModelId = data.selectedModelId || '';
    this.taskTypePreferences = data.taskTypePreferences || {};
    this.lastUsed = data.lastUsed || new Date().toISOString();
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  /**
   * Validate the user preference instance
   * @returns {Object} Object with isValid boolean and errors array
   */
  validate() {
    const errors = [];

    if (!this.userId || typeof this.userId !== 'string' || this.userId.trim() === '') {
      errors.push('userId is required and must be a non-empty string');
    }

    if (!this.selectedProviderId || typeof this.selectedProviderId !== 'string' || this.selectedProviderId.trim() === '') {
      errors.push('selectedProviderId is required and must be a non-empty string');
    }

    if (!this.selectedModelId || typeof this.selectedModelId !== 'string' || this.selectedModelId.trim() === '') {
      errors.push('selectedModelId is required and must be a non-empty string');
    }

    if (this.taskTypePreferences && typeof this.taskTypePreferences !== 'object') {
      errors.push('taskTypePreferences must be an object');
    }

    if (this.lastUsed) {
      const date = new Date(this.lastUsed);
      if (isNaN(date.getTime())) {
        errors.push('lastUsed must be a valid date string');
      }
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
   * Set the selected provider and model
   * @param {string} providerId - ID of the provider to select
   * @param {string} modelId - ID of the model to select
   * @returns {void}
   */
  setSelectedProviderAndModel(providerId, modelId) {
    if (!providerId || !modelId) {
      throw new Error('Provider ID and Model ID are required');
    }
    
    this.selectedProviderId = providerId;
    this.selectedModelId = modelId;
    this.lastUsed = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Set a preference for a specific task type
   * @param {string} taskType - The task type (e.g., 'chat', 'image-generation')
   * @param {string} providerId - The provider ID for this task type
   * @param {string} modelId - The model ID for this task type
   * @returns {void}
   */
  setTaskTypePreference(taskType, providerId, modelId) {
    if (!taskType || !providerId || !modelId) {
      throw new Error('Task type, provider ID, and model ID are required');
    }
    
    if (!this.taskTypePreferences) {
      this.taskTypePreferences = {};
    }
    
    this.taskTypePreferences[taskType] = {
      providerId,
      modelId
    };
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Get the preferred provider and model for a specific task type
   * @param {string} taskType - The task type to get preferences for
   * @returns {Object|null} Object with providerId and modelId, or null if not set
   */
  getTaskTypePreference(taskType) {
    if (!this.taskTypePreferences || !this.taskTypePreferences[taskType]) {
      return null;
    }
    
    return {
      providerId: this.taskTypePreferences[taskType].providerId,
      modelId: this.taskTypePreferences[taskType].modelId
    };
  }

  /**
   * Clear the preference for a specific task type
   * @param {string} taskType - The task type to clear preference for
   * @returns {boolean} True if preference was cleared, false if not found
   */
  clearTaskTypePreference(taskType) {
    if (!this.taskTypePreferences || !this.taskTypePreferences[taskType]) {
      return false;
    }
    
    delete this.taskTypePreferences[taskType];
    this.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Get user preference as a plain object
   * @returns {Object} Plain user preference object
   */
  toObject() {
    return {
      userId: this.userId,
      selectedProviderId: this.selectedProviderId,
      selectedModelId: this.selectedModelId,
      taskTypePreferences: { ...this.taskTypePreferences },
      lastUsed: this.lastUsed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Create a UserPreference instance from a plain object
   * @param {Object} data - Plain object with user preference data
   * @returns {UserPreference} UserPreference instance
   */
  static fromObject(data) {
    return new UserPreference(data);
  }
}

export default UserPreference;