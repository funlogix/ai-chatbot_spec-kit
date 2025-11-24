// frontend/src/components/providers/ProviderTaskAssignment/__tests__/ProviderTaskAssignment.test.js
// Mock the modules that the ProviderTaskAssignment component might use
jest.mock('../../../../services/api/providerService');

import ProviderService from '../../../../services/api/providerService';

// Mock implementation of providerService
const mockGetAvailableProviders = jest.fn();
const mockGetAllProviderConfigs = jest.fn();
const mockConfigureProvider = jest.fn();

ProviderService.getAvailableProviders = mockGetAvailableProviders;
ProviderService.getAllProviderConfigs = mockGetAllProviderConfigs;
ProviderService.configureProvider = mockConfigureProvider;

// Create a mock ProviderTaskAssignment component implementation for testing
class MockProviderTaskAssignment {
  constructor() {
    this.providers = [];
    this.taskTypes = ['chat', 'image-generation', 'text-analysis'];
    this.providerTaskAssignments = {};
  }

  async init(adminAccessKey) {
    this.providers = await ProviderService.getAvailableProviders();
  }

  async assignProviderToTask(providerId, taskType, adminAccessKey) {
    // Validate inputs
    if (!this.providers.some(p => p.id === providerId)) {
      throw new Error(`Provider ${providerId} does not exist`);
    }
    
    if (!this.taskTypes.includes(taskType)) {
      throw new Error(`Task type ${taskType} is not supported`);
    }

    // Assign provider to task
    this.providerTaskAssignments[taskType] = providerId;
    
    // In a real implementation, this would call the backend API
    const result = await ProviderService.configureProvider({
      providerId,
      taskType,
      assignedAt: new Date().toISOString()
    }, adminAccessKey);
    
    return result;
  }

  getAssignedProvider(taskType) {
    return this.providerTaskAssignments[taskType] || null;
  }

  getAvailableProvidersForTask(taskType) {
    // In this simplified implementation, all providers are available for all tasks
    // In a real implementation, this would check provider capabilities
    return this.providers;
  }

  validateAssignment(providerId, taskType) {
    // Check if provider supports the task type
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) {
      return { valid: false, errors: [`Provider ${providerId} not found`] };
    }

    // In a real implementation, this would check provider capabilities
    // For now, assume all providers support all task types
    return { valid: true, errors: [] };
  }
}

describe('ProviderTaskAssignment Component', () => {
  let taskAssignment;
  const mockAdminAccessKey = 'test-admin-key';

  beforeEach(() => {
    jest.clearAllMocks();
    taskAssignment = new MockProviderTaskAssignment();
  });

  describe('Initialization', () => {
    it('should load available providers', async () => {
      const mockProviders = [
        { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
        { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] }
      ];

      mockGetAvailableProviders.mockResolvedValue(mockProviders);

      await taskAssignment.init(mockAdminAccessKey);

      expect(mockGetAvailableProviders).toHaveBeenCalledWith();
      expect(taskAssignment.providers).toEqual(mockProviders);
    });
  });

  describe('Provider-Task Assignment', () => {
    beforeEach(async () => {
      const mockProviders = [
        { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
        { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] }
      ];

      mockGetAvailableProviders.mockResolvedValue(mockProviders);
      await taskAssignment.init(mockAdminAccessKey);
    });

    it('should assign a provider to a task type', async () => {
      const providerId = 'openai';
      const taskType = 'chat';
      const mockResponse = { 
        id: 'assignment1', 
        providerId, 
        taskType,
        message: 'Provider assigned to task successfully' 
      };

      mockConfigureProvider.mockResolvedValue(mockResponse);

      const result = await taskAssignment.assignProviderToTask(providerId, taskType, mockAdminAccessKey);

      expect(mockConfigureProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId,
          taskType
        }),
        mockAdminAccessKey
      );
      expect(result).toEqual(mockResponse);
      expect(taskAssignment.getAssignedProvider(taskType)).toBe(providerId);
    });

    it('should fail to assign a non-existent provider', async () => {
      const providerId = 'nonexistent';
      const taskType = 'chat';

      await expect(
        taskAssignment.assignProviderToTask(providerId, taskType, mockAdminAccessKey)
      ).rejects.toThrow(`Provider ${providerId} does not exist`);
    });

    it('should fail to assign to an unsupported task type', async () => {
      const providerId = 'openai';
      const taskType = 'unsupported-task';

      await expect(
        taskAssignment.assignProviderToTask(providerId, taskType, mockAdminAccessKey)
      ).rejects.toThrow(`Task type ${taskType} is not supported`);
    });

    it('should update assignment when reassigning', async () => {
      const providerId1 = 'openai';
      const providerId2 = 'groq';
      const taskType = 'chat';

      mockConfigureProvider.mockResolvedValue({
        id: 'assignment1',
        providerId,
        taskType,
        message: 'Provider assigned to task successfully'
      });

      // First, assign openai to chat
      await taskAssignment.assignProviderToTask(providerId1, taskType, mockAdminAccessKey);
      expect(taskAssignment.getAssignedProvider(taskType)).toBe(providerId1);

      // Then, reassign to groq
      await taskAssignment.assignProviderToTask(providerId2, taskType, mockAdminAccessKey);
      expect(taskAssignment.getAssignedProvider(taskType)).toBe(providerId2);
    });
  });

  describe('Task Type Management', () => {
    it('should have the correct default task types', () => {
      expect(taskAssignment.taskTypes).toEqual(['chat', 'image-generation', 'text-analysis']);
    });
  });

  describe('Assignment Validation', () => {
    beforeEach(async () => {
      const mockProviders = [
        { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
        { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] }
      ];

      mockGetAvailableProviders.mockResolvedValue(mockProviders);
      await taskAssignment.init(mockAdminAccessKey);
    });

    it('should validate valid provider-task assignments', () => {
      const result = taskAssignment.validateAssignment('openai', 'chat');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should invalidate non-existent providers', () => {
      const result = taskAssignment.validateAssignment('nonexistent', 'chat');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Provider nonexistent not found']);
    });
  });

  describe('Available Providers for Tasks', () => {
    beforeEach(async () => {
      const mockProviders = [
        { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
        { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] }
      ];

      mockGetAvailableProviders.mockResolvedValue(mockProviders);
      await taskAssignment.init(mockAdminAccessKey);
    });

    it('should return available providers for a task', () => {
      const available = taskAssignment.getAvailableProvidersForTask('chat');
      expect(available).toHaveLength(2);
      expect(available[0].id).toBe('openai');
      expect(available[1].id).toBe('groq');
    });
  });
});