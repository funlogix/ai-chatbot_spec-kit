/**
 * Provider Router Service
 * Handles routing requests to the appropriate provider based on task type
 */
class ProviderRouterService {
  constructor() {
    this.taskTypeService = null;
    this.providerService = null;
    this.modelService = null;
    this.baseProvider = null;
    
    this.init();
  }

  async init() {
    // Import required services
    const { default: taskTypeService } = await import('./TaskTypeService.js');
    const { default: providerService } = await import('./api/providerService.js');
    const { default: modelService } = await import('./api/modelService.js');
    const { default: BaseProvider } = await import('./providers/baseProvider.js');
    
    this.taskTypeService = taskTypeService;
    this.providerService = providerService;
    this.modelService = modelService;
    this.baseProvider = BaseProvider;
  }

  /**
   * Get the assigned provider for a specific task type
   * @param {string} taskType - The task type (e.g., 'chat', 'image')
   * @returns {Promise<Object>} Object containing providerId and modelId
   */
  async getAssignedProvider(taskType) {
    // Get the provider-task assignments from localStorage
    const assignments = JSON.parse(localStorage.getItem('providerTaskAssignments') || '[]');
    
    // Find the assignment for the given task type
    const assignment = assignments.find(a => a.taskType === taskType);
    
    if (assignment) {
      return {
        providerId: assignment.providerId,
        modelId: assignment.modelId
      };
    }
    
    // If no assignment is found, return an object indicating no specific assignment
    return {
      providerId: null,
      modelId: null
    };
  }

  /**
   * Route a request to the appropriate provider based on task type
   * @param {string} taskType - The task type (e.g., 'chat', 'image')
   * @param {Object} requestData - The data for the request
   * @returns {Promise<Object>} Response from the appropriate provider
   */
  async routeRequest(taskType, requestData) {
    if (!taskType || !requestData) {
      throw new Error('Task type and request data are required');
    }

    try {
      // Get the assigned provider for this task type
      const assignment = await this.getAssignedProvider(taskType);
      
      if (!assignment.providerId) {
        // If no provider is assigned for this task type, we need to decide on a default
        // For now, we'll throw an error to indicate that a configuration is required
        throw new Error(`No provider assigned for task type: ${taskType}`);
      }
      
      // Enhance request data with the assigned model if not already specified
      if (assignment.modelId && !requestData.model) {
        requestData.model = assignment.modelId;
      }
      
      // Get provider details from the provider service
      const providers = await this.providerService.getAvailableProviders();
      const provider = providers.find(p => p.providerId === assignment.providerId);
      
      if (!provider) {
        throw new Error(`Provider ${assignment.providerId} not found or not available`);
      }
      
      // Check if provider is active
      if (!provider.isActive) {
        throw new Error(`Provider ${assignment.providerId} is not active`);
      }
      
      // Check rate limits before making request
      const rateLimiter = await import('./utils/rateLimiter.js').then(m => m.default);
      const rateLimitCheck = await rateLimiter.isRequestAllowed(assignment.providerId, requestData.tokens || 0);
      
      if (!rateLimitCheck.allowed) {
        const seconds = rateLimitCheck.timeToReset || 0;
        throw new Error(`Rate limit exceeded. Try again in ${seconds} seconds.`);
      }
      
      // For this implementation, we'll return a mock response
      // In a real implementation, this would call the specific provider's API
      return await this.callProvider(provider, requestData);
    } catch (error) {
      console.error(`Error routing request for task type ${taskType}:`, error);
      throw error;
    }
  }

  /**
   * Call the specific provider's API
   * @param {Object} provider - The provider object
   * @param {Object} requestData - The request data
   * @returns {Promise<Object>} Response from the provider
   */
  async callProvider(provider, requestData) {
    // In a real implementation, this would call the specific provider's API
    // For this mock, we'll simulate a response
    
    // Simulate some delay to mimic network call
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Create a mock response based on the provider
    const mockResponses = {
      'groq:https://api.groq.com': {
        id: `groq-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: requestData.model || 'llama3-8b-8192',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: `This is a response from Groq using ${requestData.model || 'default model'} for a ${requestData.taskType || 'general'} task.` },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      },
      'openai:https://api.openai.com': {
        id: `openai-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: requestData.model || 'gpt-4-turbo',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: `This is a response from OpenAI using ${requestData.model || 'default model'} for a ${requestData.taskType || 'general'} task.` },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 25,
          total_tokens: 40
        }
      },
      'gemini:https://generativelanguage.googleapis.com': {
        id: `gemini-${Date.now()}`,
        object: 'generateContentResponse',
        model: requestData.model || 'gemini-2.5-flash',
        candidates: [
          {
            content: {
              parts: [{
                text: `This is a response from Gemini using ${requestData.model || 'default model'} for a ${requestData.taskType || 'general'} task.`
              }]
            },
            finishReason: 'STOP'
          }
        ]
      },
      'openrouter:https://openrouter.ai': {
        id: `openrouter-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: requestData.model || 'z-ai/glm-4.5-air:free',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: `This is a response from OpenRouter using ${requestData.model || 'default model'} for a ${requestData.taskType || 'general'} task.` },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 18,
          total_tokens: 30
        }
      }
    };
    
    // Return the appropriate mock response based on the provider ID
    const providerKey = Object.keys(mockResponses).find(key => provider.providerId.includes(key.split(':')[0]));
    
    return Promise.resolve(mockResponses[providerKey] || {
      error: { message: `Mock response for ${provider.providerName} not configured` }
    });
  }

  /**
   * Get all provider assignments
   * @returns {Promise<Array>} List of all provider-task assignments
   */
  async getAllAssignments() {
    return JSON.parse(localStorage.getItem('providerTaskAssignments') || '[]');
  }

  /**
   * Save provider assignments
   * @param {Array} assignments - List of provider-task assignments to save
   * @returns {Promise<void>}
   */
  async saveAssignments(assignments) {
    localStorage.setItem('providerTaskAssignments', JSON.stringify(assignments));
  }

  /**
   * Validate that a provider supports a particular task type
   * @param {string} providerId - ID of the provider
   * @param {string} taskType - Task type to validate
   * @returns {Promise<boolean>} True if provider supports the task type
   */
  async validateProviderSupportsTaskType(providerId, taskType) {
    try {
      // Get the provider details
      const providers = await this.providerService.getAvailableProviders();
      const provider = providers.find(p => p.providerId === providerId);
      
      if (!provider) {
        return false;
      }
      
      // In a real implementation, we would check the provider's capabilities
      // For this mock, we'll allow all providers to handle all task types
      return true;
    } catch (error) {
      console.error('Error validating provider support:', error);
      return false;
    }
  }

  /**
   * Check if the current configuration is valid
   * @returns {Promise<Object>} Object with isValid boolean and validation details
   */
  async validateConfiguration() {
    const validation = {
      isValid: true,
      details: []
    };

    try {
      // Get all task types
      const taskTypes = await this.taskTypeService.getAllTaskTypes();

      // Get all assignments
      const assignments = await this.getAllAssignments();

      // Check that each task type has an assigned provider
      for (const taskType of taskTypes) {
        const assignment = assignments.find(a => a.taskType === taskType.taskTypeId);

        if (!assignment) {
          validation.isValid = false;
          validation.details.push({
            taskType: taskType.taskTypeId,
            message: `No provider assigned for task type: ${taskType.taskTypeName}`,
            severity: 'warning'
          });
        } else {
          // Check if the assigned provider exists
          const providers = await this.providerService.getAvailableProviders();
          const providerExists = providers.some(p => p.providerId === assignment.providerId);

          if (!providerExists) {
            validation.isValid = false;
            validation.details.push({
              taskType: taskType.taskTypeId,
              message: `Assigned provider ${assignment.providerId} does not exist`,
              severity: 'error'
            });
          }
        }
      }

      return validation;
    } catch (error) {
      console.error('Error validating configuration:', error);
      return {
        isValid: false,
        details: [{ message: `Configuration validation failed: ${error.message}`, severity: 'error' }]
      };
    }
  }

  /**
   * Validate that each task type has exactly one assigned provider
   * @returns {Promise<Object>} Object with isValid boolean and validation details
   */
  async validateProviderTaskAssignment() {
    const validation = {
      isValid: true,
      details: []
    };

    try {
      // Get all task types
      const taskTypes = await this.taskTypeService.getAllTaskTypes();

      // Get all assignments
      const assignments = await this.getAllAssignments();

      // Check that each task type has at least one assigned provider
      for (const taskType of taskTypes) {
        const taskAssignments = assignments.filter(a => a.taskType === taskType.taskTypeId);

        if (taskAssignments.length === 0) {
          validation.isValid = false;
          validation.details.push({
            taskType: taskType.taskTypeId,
            message: `No provider assigned for task type: ${taskType.taskTypeName}`,
            severity: 'error'
          });
        } else if (taskAssignments.length > 1) {
          // Check if multiple providers are assigned to the same task type
          validation.isValid = false;
          validation.details.push({
            taskType: taskType.taskTypeId,
            message: `Multiple providers assigned for task type: ${taskType.taskTypeName} (${taskAssignments.length} assignments)`,
            severity: 'error'
          });
        } else {
          // Exactly one provider assigned - this is correct
        }
      }

      // Check for invalid task types in assignments
      for (const assignment of assignments) {
        const taskTypeExists = taskTypes.some(t => t.taskTypeId === assignment.taskType);
        if (!taskTypeExists) {
          validation.isValid = false;
          validation.details.push({
            taskType: assignment.taskType,
            message: `Invalid task type in assignment: ${assignment.taskType}`,
            severity: 'error'
          });
        }
      }

      return validation;
    } catch (error) {
      console.error('Error validating provider-task assignment:', error);
      return {
        isValid: false,
        details: [{ message: `Provider-task assignment validation failed: ${error.message}`, severity: 'error' }]
      };
    }
  }
}

// Export a singleton instance
const providerRouterService = new ProviderRouterService();
export default providerRouterService;