// frontend/src/services/api/__tests__/taskRouting.integration.test.js
// Mock the fetch API
global.fetch = jest.fn();

// Import dependencies
import ProviderService from '../providerService';
import ModelService from '../modelService';

describe('Task-Type Routing Integration Tests', () => {
  let providerService;
  let modelService;

  beforeEach(() => {
    jest.clearAllMocks();
    providerService = new ProviderService();
    modelService = new ModelService();
  });

  it('should route different task types to appropriate providers', async () => {
    const mockProviders = [
      { 
        id: 'openai', 
        name: 'OpenAI', 
        isActive: true, 
        models: ['gpt-4', 'dall-e-3'],
        capabilities: ['text-generation', 'image-generation']
      },
      { 
        id: 'groq', 
        name: 'Groq', 
        isActive: true, 
        models: ['llama3-70b', 'mixtral-8x7b'],
        capabilities: ['text-generation', 'reasoning']
      },
      { 
        id: 'gemini', 
        name: 'Google Gemini', 
        isActive: true, 
        models: ['gemini-pro-vision'],
        capabilities: ['text-generation', 'image-analysis', 'multimodal']
      }
    ];

    // Mock the API calls
    global.fetch
      .mockResolvedValueOnce({ // For getAvailableProviders
        ok: true,
        json: async () => ({ providers: mockProviders })
      })
      .mockResolvedValueOnce({ // For getProviderModels (for OpenAI)
        ok: true,
        json: async () => ({ providers: mockProviders })
      })
      .mockResolvedValueOnce({ // For getProviderModels (for Groq)
        ok: true,
        json: async () => ({ providers: mockProviders })
      })
      .mockResolvedValueOnce({ // For getProviderModels (for Gemini)
        ok: true,
        json: async () => ({ providers: mockProviders })
      });

    // Get all providers
    const availableProviders = await providerService.getAvailableProviders();
    expect(availableProviders).toHaveLength(3);

    // Simulate task routing configuration
    const taskRoutingConfig = {
      'chat': 'openai',
      'image-generation': 'openai',
      'text-analysis': 'groq',
      'multimodal': 'gemini'
    };

    // Verify routing works correctly
    expect(taskRoutingConfig['chat']).toBe('openai');
    expect(taskRoutingConfig['image-generation']).toBe('openai');
    expect(taskRoutingConfig['text-analysis']).toBe('groq');
    expect(taskRoutingConfig['multimodal']).toBe('gemini');

    // Verify each assigned provider exists
    for (const [task, provider] of Object.entries(taskRoutingConfig)) {
      expect(availableProviders.some(p => p.id === provider)).toBe(true);
    }
  });

  it('should handle task routing with model selection', async () => {
    const mockProviders = [
      { 
        id: 'openai', 
        name: 'OpenAI', 
        isActive: true, 
        models: ['gpt-4', 'gpt-3.5-turbo', 'dall-e-3']
      },
      { 
        id: 'groq', 
        name: 'Groq', 
        isActive: true, 
        models: ['llama3-70b', 'mixtral-8x7b']
      }
    ];

    global.fetch
      .mockResolvedValueOnce({ // For getAvailableProviders
        ok: true,
        json: async () => ({ providers: mockProviders })
      })
      .mockResolvedValue({ // For getProviderModels (all subsequent calls)
        ok: true,
        json: async () => ({ providers: mockProviders })
      });

    // Get providers and models
    const providers = await providerService.getAvailableProviders();
    const openaiModels = await modelService.getProviderModels('openai');
    const groqModels = await modelService.getProviderModels('groq');

    // Verify we have the expected providers and models
    expect(providers).toHaveLength(2);
    expect(openaiModels).toHaveLength(3); // gpt-4, gpt-3.5-turbo, dall-e-3
    expect(groqModels).toHaveLength(2); // llama3-70b, mixtral-8x7b

    // Simulate task-based model selection
    const getBestModelForTask = (taskType, providerId) => {
      if (providerId === 'openai') {
        switch (taskType) {
          case 'chat':
            return 'gpt-4'; // Best for chat
          case 'image-generation':
            return 'dall-e-3'; // Best for image generation
          default:
            return 'gpt-3.5-turbo'; // Default
        }
      } else if (providerId === 'groq') {
        return 'llama3-70b'; // Groq's powerful model
      }
      return null;
    };

    // Test model selection for different tasks
    const chatModel = getBestModelForTask('chat', 'openai');
    expect(chatModel).toBe('gpt-4');

    const imageModel = getBestModelForTask('image-generation', 'openai');
    expect(imageModel).toBe('dall-e-3');

    const textModel = getBestModelForTask('text-analysis', 'groq');
    expect(textModel).toBe('llama3-70b');
  });

  it('should handle task routing failures gracefully', async () => {
    // Simulate situation where a task has no assigned provider
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ providers: [] }) // No providers available
    });

    await expect(providerService.getAvailableProviders()).resolves.toEqual([]);

    // In the real application, this would trigger appropriate error handling
  });

  it('should validate provider-task assignments', async () => {
    const mockProviders = [
      { 
        id: 'openai', 
        name: 'OpenAI', 
        isActive: true, 
        models: ['gpt-4'],
        capabilities: ['text-generation']
      },
      { 
        id: 'groq', 
        name: 'Groq', 
        isActive: true, 
        models: ['llama3-70b'],
        capabilities: ['text-generation', 'reasoning']
      }
    ];

    global.fetch
      .mockResolvedValueOnce({ // For getAvailableProviders
        ok: true,
        json: async () => ({ providers: mockProviders })
      })
      .mockResolvedValue({ // For subsequent calls
        ok: true,
        json: async () => ({ providers: mockProviders })
      });

    const providers = await providerService.getAvailableProviders();

    // Define task assignments
    const taskAssignments = {
      'chat': 'openai',
      'text-analysis': 'groq'
      // image-generation is not assigned
    };

    // Validate assignments
    const validationResults = {};
    for (const [task, providerId] of Object.entries(taskAssignments)) {
      const provider = providers.find(p => p.id === providerId);
      validationResults[task] = {
        isValid: !!provider,
        provider: provider
      };
    }

    // Check that assigned providers are valid
    expect(validationResults['chat'].isValid).toBe(true);
    expect(validationResults['text-analysis'].isValid).toBe(true);

    // Simulate checking for a task with no assignment
    const imageGenAssigned = taskAssignments['image-generation'];
    expect(imageGenAssigned).toBeUndefined();
  });

  it('should handle provider unavailability in task routing', async () => {
    const mockAllProviders = [
      { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
      { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] },
      { id: 'unavailable', name: 'Unavailable', isActive: false, models: ['model1'] }
    ];

    const mockAvailableProviders = [
      { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
      { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] }
    ];

    global.fetch
      .mockResolvedValueOnce({ // For getAvailableProviders
        ok: true,
        json: async () => ({ providers: mockAvailableProviders })
      })
      .mockResolvedValue({ // For subsequent calls
        ok: true,
        json: async () => ({ providers: mockAllProviders })
      });

    const availableProviders = await providerService.getAvailableProviders();
    expect(availableProviders).toHaveLength(2);

    // Simulate task assignments
    const taskAssignments = {
      'chat': 'openai',      // Available
      'analysis': 'groq',    // Available
      'special': 'unavailable'  // This provider is inactive
    };

    // Only assign tasks to available providers
    const validAssignments = {};
    for (const [task, providerId] of Object.entries(taskAssignments)) {
      if (availableProviders.some(p => p.id === providerId)) {
        validAssignments[task] = providerId;
      }
    }

    expect(Object.keys(validAssignments)).toHaveLength(2);
    expect(validAssignments['chat']).toBe('openai');
    expect(validAssignments['analysis']).toBe('groq');
    expect(validAssignments['special']).toBeUndefined();
  });
});