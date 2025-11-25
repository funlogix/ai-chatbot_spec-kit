/**
 * Task Type Service
 * Handles operations for task type management
 */
class TaskTypeService {
  constructor() {
    this.apiBaseUrl = '/api/task-types'; // In a real API
    this.headers = {
      'Content-Type': 'application/json'
    };
    
    // For this client-side mock, we'll store task types in localStorage
    this.storageKey = 'taskTypes';
  }

  /**
   * Get all task types
   * @returns {Promise<Array>} List of task types
   */
  async getAllTaskTypes() {
    // For this mock implementation, return a default set of task types
    // In a real application, this would fetch from the backend API
    const defaultTaskTypes = [
      { 
        taskTypeId: 'chat', 
        taskTypeName: 'Chat', 
        description: 'Text-based conversations', 
        defaultProviderId: null, 
        defaultModelId: null,
        createdAt: '2025-11-23T10:00:00Z',
        updatedAt: '2025-11-23T10:00:00Z'
      },
      { 
        taskTypeId: 'image', 
        taskTypeName: 'Image Generation', 
        description: 'Creating images from text prompts', 
        defaultProviderId: null, 
        defaultModelId: null,
        createdAt: '2025-11-23T10:00:00Z',
        updatedAt: '2025-11-23T10:00:00Z'
      },
      { 
        taskTypeId: 'text', 
        taskTypeName: 'Text Processing', 
        description: 'Text analysis and transformation', 
        defaultProviderId: null, 
        defaultModelId: null,
        createdAt: '2025-11-23T10:00:00Z',
        updatedAt: '2025-11-23T10:00:00Z'
      },
      { 
        taskTypeId: 'code', 
        taskTypeName: 'Code Generation', 
        description: 'Writing and reviewing code', 
        defaultProviderId: null, 
        defaultModelId: null,
        createdAt: '2025-11-23T10:00:00Z',
        updatedAt: '2025-11-23T10:00:00Z'
      }
    ];
    
    // Check if there are custom task types in storage
    const storedTaskTypes = this.getStoredTaskTypes();
    if (storedTaskTypes && storedTaskTypes.length > 0) {
      return storedTaskTypes;
    }
    
    return defaultTaskTypes;
  }

  /**
   * Get a specific task type by ID
   * @param {string} taskTypeId - ID of the task type to retrieve
   * @returns {Promise<Object>} Task type object
   */
  async getTaskTypeById(taskTypeId) {
    const taskTypes = await this.getAllTaskTypes();
    const taskType = taskTypes.find(t => t.taskTypeId === taskTypeId);
    
    if (!taskType) {
      throw new Error(`Task type with ID ${taskTypeId} not found`);
    }
    
    return taskType;
  }

  /**
   * Create a new task type
   * @param {Object} taskTypeData - Data for the new task type
   * @returns {Promise<Object>} Created task type object
   */
  async createTaskType(taskTypeData) {
    if (!taskTypeData || !taskTypeData.taskTypeId || !taskTypeData.taskTypeName) {
      throw new Error('Task type ID and name are required');
    }

    // Get existing task types
    const existingTaskTypes = await this.getAllTaskTypes();
    
    // Check if task type ID already exists
    if (existingTaskTypes.some(t => t.taskTypeId === taskTypeData.taskTypeId)) {
      throw new Error(`Task type with ID ${taskTypeData.taskTypeId} already exists`);
    }
    
    // Create new task type object
    const newTaskType = {
      taskTypeId: taskTypeData.taskTypeId,
      taskTypeName: taskTypeData.taskTypeName,
      description: taskTypeData.description || '',
      defaultProviderId: taskTypeData.defaultProviderId || null,
      defaultModelId: taskTypeData.defaultModelId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to existing task types
    const updatedTaskTypes = [...existingTaskTypes, newTaskType];
    
    // Save to storage
    this.saveTaskTypes(updatedTaskTypes);
    
    return newTaskType;
  }

  /**
   * Update an existing task type
   * @param {string} taskTypeId - ID of the task type to update
   * @param {Object} taskTypeData - Updated task type data
   * @returns {Promise<Object>} Updated task type object
   */
  async updateTaskType(taskTypeId, taskTypeData) {
    if (!taskTypeId || !taskTypeData) {
      throw new Error('Task type ID and data are required');
    }

    // Get existing task types
    const existingTaskTypes = await this.getAllTaskTypes();
    
    // Find the task type to update
    const taskTypeIndex = existingTaskTypes.findIndex(t => t.taskTypeId === taskTypeId);
    
    if (taskTypeIndex === -1) {
      throw new Error(`Task type with ID ${taskTypeId} not found`);
    }
    
    // Update the task type
    const updatedTaskType = {
      ...existingTaskTypes[taskTypeIndex],
      ...taskTypeData,
      taskTypeId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    // Replace in the array
    const updatedTaskTypes = [...existingTaskTypes];
    updatedTaskTypes[taskTypeIndex] = updatedTaskType;
    
    // Save to storage
    this.saveTaskTypes(updatedTaskTypes);
    
    return updatedTaskType;
  }

  /**
   * Delete a task type
   * @param {string} taskTypeId - ID of the task type to delete
   * @returns {Promise<Object>} Result of the deletion operation
   */
  async deleteTaskType(taskTypeId) {
    if (!taskTypeId) {
      throw new Error('Task type ID is required');
    }

    // Get existing task types
    let existingTaskTypes = await this.getAllTaskTypes();
    
    // Check if task type exists
    const taskTypeIndex = existingTaskTypes.findIndex(t => t.taskTypeId === taskTypeId);
    
    if (taskTypeIndex === -1) {
      throw new Error(`Task type with ID ${taskTypeId} not found`);
    }
    
    // Remove the task type
    const deletedTaskType = existingTaskTypes[taskTypeIndex];
    existingTaskTypes = existingTaskTypes.filter(t => t.taskTypeId !== taskTypeId);
    
    // Save to storage
    this.saveTaskTypes(existingTaskTypes);
    
    return {
      success: true,
      message: `Task type ${deletedTaskType.taskTypeName} deleted successfully`,
      deletedTaskType
    };
  }

  /**
   * Set default provider and model for a task type
   * @param {string} taskTypeId - ID of the task type
   * @param {string} providerId - ID of the default provider
   * @param {string} modelId - ID of the default model
   * @returns {Promise<Object>} Updated task type object
   */
  async setDefaultProviderForTaskType(taskTypeId, providerId, modelId) {
    if (!taskTypeId || !providerId || !modelId) {
      throw new Error('Task type ID, provider ID, and model ID are required');
    }

    // Get existing task types
    const existingTaskTypes = await this.getAllTaskTypes();
    
    // Find the task type to update
    const taskTypeIndex = existingTaskTypes.findIndex(t => t.taskTypeId === taskTypeId);
    
    if (taskTypeIndex === -1) {
      throw new Error(`Task type with ID ${taskTypeId} not found`);
    }
    
    // Update the default provider and model
    const updatedTaskType = {
      ...existingTaskTypes[taskTypeIndex],
      defaultProviderId: providerId,
      defaultModelId: modelId,
      updatedAt: new Date().toISOString()
    };
    
    // Replace in the array
    const updatedTaskTypes = [...existingTaskTypes];
    updatedTaskTypes[taskTypeIndex] = updatedTaskType;
    
    // Save to storage
    this.saveTaskTypes(updatedTaskTypes);
    
    return updatedTaskType;
  }

  /**
   * Helper method to save task types to localStorage
   * @param {Array} taskTypes - Array of task types to save
   * @returns {void}
   */
  saveTaskTypes(taskTypes) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(taskTypes));
    } catch (error) {
      console.error('Error saving task types to localStorage:', error);
      throw error;
    }
  }

  /**
   * Helper method to retrieve task types from localStorage
   * @returns {Array} Array of task types from storage
   */
  getStoredTaskTypes() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving task types from localStorage:', error);
      return [];
    }
  }

  /**
   * Get the authentication headers for API requests
   * @returns {Object} Headers object with authentication
   */
  getAuthHeaders() {
    // Add authorization token if available
    const token = localStorage.getItem('authToken');
    const headers = { ...this.headers };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
}

// Export a singleton instance
const taskTypeService = new TaskTypeService();
export default taskTypeService;