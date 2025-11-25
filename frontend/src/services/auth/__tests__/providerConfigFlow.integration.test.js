// frontend/src/services/auth/__tests__/providerConfigFlow.integration.test.js
// Mock the fetch API
global.fetch = jest.fn();

// Import dependencies
import APIKeyManager from '../apiKeyManager';
import ProviderService from '../../api/providerService';

describe('Provider Configuration Flow Integration Tests', () => {
  let apiKeyManager;
  let providerService;
  const mockAdminAccessKey = 'test-admin-key';

  beforeEach(() => {
    jest.clearAllMocks();
    apiKeyManager = new APIKeyManager();
    providerService = new ProviderService();
  });

  it('should complete the full provider configuration flow', async () => {
    const providerId = 'openai';
    const apiKey = 'test-api-key-sk-123';
    const mockConfigResponse = {
      id: 'config1',
      providerId,
      name: 'OpenAI',
      message: 'Provider configured successfully'
    };
    const mockProviders = [
      { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] }
    ];

    // Mock the sequence of API calls
    global.fetch
      .mockResolvedValueOnce({ // For configureProvider
        ok: true,
        json: async () => mockConfigResponse
      })
      .mockResolvedValueOnce({ // For getAvailableProviders (after config)
        ok: true,
        json: async () => ({ providers: mockProviders })
      })
      .mockResolvedValueOnce({ // For getProviderStatus
        ok: true,
        json: async () => ({ status: 'available', hasApiKey: true, message: 'Ready to use' })
      });

    // Step 1: Configure a provider
    const configResult = await apiKeyManager.configureProvider(providerId, apiKey);
    expect(configResult).toEqual(mockConfigResponse);

    // Step 2: Verify the provider is now available
    const availableProviders = await providerService.getAvailableProviders();
    expect(availableProviders).toHaveLength(1);
    expect(availableProviders[0].id).toBe('openai');

    // Step 3: Check provider status (should be available with API key)
    const status = await apiKeyManager.getProviderStatus(providerId);
    expect(status.hasApiKey).toBe(true);
    expect(status.status).toBe('available');
  });

  it('should handle configuration of multiple providers', async () => {
    const providersToConfigure = [
      { providerId: 'openai', apiKey: 'sk-openai-123' },
      { providerId: 'groq', apiKey: 'sk-groq-456' }
    ];
    const mockProviders = [
      { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
      { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] }
    ];

    // Mock API calls - first call configures provider, second gets available providers
    global.fetch
      .mockResolvedValue({ // For all configureProvider calls
        ok: true,
        json: async () => ({ id: 'config', message: 'Provider configured' })
      })
      .mockResolvedValueOnce({ // For getAvailableProviders
        ok: true,
        json: async () => ({ providers: mockProviders })
      });

    // Configure multiple providers
    for (const { providerId, apiKey } of providersToConfigure) {
      await apiKeyManager.configureProvider(providerId, apiKey);
    }

    // Verify both providers are available
    const availableProviders = await providerService.getAvailableProviders();
    expect(availableProviders).toHaveLength(2);
    expect(availableProviders.map(p => p.id)).toContain('openai');
    expect(availableProviders.map(p => p.id)).toContain('groq');
  });

  it('should allow admin to retrieve all configurations', async () => {
    const mockConfigs = [
      { id: 'config1', providerId: 'openai', name: 'OpenAI Config' },
      { id: 'config2', providerId: 'groq', name: 'Groq Config' }
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ providers: mockConfigs })
    });

    const configs = await apiKeyManager.getAllProviderConfigs(mockAdminAccessKey);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/providers',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Admin-Access': mockAdminAccessKey
        })
      })
    );
    expect(configs).toEqual(mockConfigs);
  });

  it('should handle configuration errors gracefully', async () => {
    const providerId = 'invalid-provider';
    const apiKey = 'invalid-key';

    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid provider ID' })
    });

    await expect(apiKeyManager.configureProvider(providerId, apiKey)).rejects.toThrow(
      'Failed to configure provider: 400 - Invalid provider ID'
    );
  });

  it('should handle the complete flow: configure -> verify -> select', async () => {
    const providerId = 'openrouter';
    const apiKey = 'sk-openrouter-789';
    const mockConfigResponse = {
      id: 'config1',
      providerId,
      name: 'OpenRouter',
      message: 'Provider configured successfully'
    };
    const mockSelectResponse = {
      providerId,
      message: 'Provider selected successfully'
    };

    global.fetch
      .mockResolvedValueOnce({ // For configureProvider
        ok: true,
        json: async () => mockConfigResponse
      })
      .mockResolvedValueOnce({ // For getProviderStatus
        ok: true,
        json: async () => ({ status: 'available', hasApiKey: true })
      })
      .mockResolvedValueOnce({ // For selectProvider
        ok: true,
        json: async () => mockSelectResponse
      });

    // Step 1: Configure provider
    const configResult = await apiKeyManager.configureProvider(providerId, apiKey);
    expect(configResult.providerId).toBe(providerId);

    // Step 2: Verify provider status
    const status = await apiKeyManager.getProviderStatus(providerId);
    expect(status.hasApiKey).toBe(true);
    expect(status.status).toBe('available');

    // Step 3: Select the provider for use
    const selectResult = await apiKeyManager.selectProvider(providerId);
    expect(selectResult.providerId).toBe(providerId);
    expect(selectResult.message).toBe('Provider selected successfully');
  });

  it('should handle provider deletion in the flow', async () => {
    const providerId = 'groq';
    const mockDeleteResponse = { message: 'Provider deleted successfully' };
    const mockRemainingProviders = [
      { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] }
    ];

    global.fetch
      .mockResolvedValueOnce({ // For deleteProviderConfig
        ok: true,
        json: async () => mockDeleteResponse
      })
      .mockResolvedValueOnce({ // For getAvailableProviders after deletion
        ok: true,
        json: async () => ({ providers: mockRemainingProviders })
      });

    // Delete the provider configuration
    const deleteResult = await apiKeyManager.deleteProviderConfig(providerId, mockAdminAccessKey);
    expect(deleteResult.message).toBe('Provider deleted successfully');

    // Verify that provider is no longer available
    const availableProviders = await providerService.getAvailableProviders();
    expect(availableProviders.some(p => p.id === providerId)).toBe(false);
  });
});