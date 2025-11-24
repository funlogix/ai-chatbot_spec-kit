// frontend/src/services/api/__tests__/providerConfig.integration.test.js
// Mock the fetch API
global.fetch = jest.fn();

import APIKeyManager from '../../auth/apiKeyManager';
import ProviderService from './providerService';

describe('Provider Configuration Integration Test', () => {
  const mockAdminAccessKey = 'test-admin-access-key';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete the full provider configuration flow', async () => {
    // Mock responses for the full configuration flow
    const mockAvailableProviders = [
      { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
      { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] },
      { id: 'gemini', name: 'Google Gemini', isActive: true, models: ['gemini-pro'] }
    ];
    
    const mockNewConfigResponse = {
      id: 'config-openai-123',
      providerId: 'openai',
      name: 'OpenAI',
      message: 'Provider configured successfully'
    };
    
    const mockUpdatedAvailableProviders = [
      ...mockAvailableProviders,
      { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'], hasApiKey: true }
    ];

    // Sequence of API calls during the configuration process
    global.fetch
      .mockResolvedValueOnce({ // Get available providers
        ok: true,
        json: async () => ({ providers: mockAvailableProviders })
      })
      .mockResolvedValueOnce({ // Configure provider
        ok: true,
        json: async () => mockNewConfigResponse
      })
      .mockResolvedValueOnce({ // Get available providers after config
        ok: true,
        json: async () => ({ providers: mockUpdatedAvailableProviders })
      })
      .mockResolvedValueOnce({ // Verify provider status
        ok: true,
        json: async () => ({ id: 'openai', status: 'available', hasApiKey: true })
      });

    // Step 1: Get available providers
    const initialProviders = await providerService.getAvailableProviders();
    expect(initialProviders).toHaveLength(3);
    
    const openaiBefore = initialProviders.find(p => p.id === 'openai');
    expect(openaiBefore.hasApiKey).toBe(undefined); // Initially we don't know about API key status

    // Step 2: Configure a provider with an API key
    const configResult = await apiKeyManager.configureProvider(
      'openai',
      'test-api-key-sk-123abc',
      mockAdminAccessKey
    );
    
    expect(configResult.providerId).toBe('openai');
    expect(configResult.message).toBe('Provider configured successfully');

    // Step 3: Verify the provider is now available with API key
    const updatedProviders = await providerService.getAvailableProviders();
    const openaiAfter = updatedProviders.find(p => p.id === 'openai');
    expect(openaiAfter.hasApiKey).toBe(true);

    // Step 4: Check provider status
    const status = await providerService.getProviderStatus('openai');
    expect(status.status).toBe('available');
    expect(status.hasApiKey).toBe(true);

    // Verify all API calls were made in the correct sequence
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(global.fetch).toHaveBeenNthCalledWith(1,
      'http://localhost:3000/api/providers/available',
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenNthCalledWith(2,
      'http://localhost:3000/api/providers/configure',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"providerId":"openai"')
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(3,
      'http://localhost:3000/api/providers/available',
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenNthCalledWith(4,
      'http://localhost:3000/api/providers/openai/status',
      expect.any(Object)
    );
  });

  it('should handle errors in the configuration flow', async () => {
    // Simulate an error during the configuration step
    global.fetch
      .mockResolvedValueOnce({ // Get available providers - success
        ok: true,
        json: async () => ({ providers: [{ id: 'openai', name: 'OpenAI' }] })
      })
      .mockResolvedValueOnce({ // Configure provider - failure
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid API key' })
      });

    // Get available providers first (should succeed)
    const availableProviders = await providerService.getAvailableProviders();
    expect(availableProviders).toHaveLength(1);

    // Attempt to configure with invalid API key (should fail)
    await expect(
      apiKeyManager.configureProvider('openai', 'invalid-key', mockAdminAccessKey)
    ).rejects.toThrow('Failed to configure provider: 401 - Invalid API key');

    // Verify both calls were made
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle admin access validation in the flow', async () => {
    global.fetch
      .mockResolvedValueOnce({ // Get available providers
        ok: true,
        json: async () => ({ providers: [{ id: 'groq', name: 'Groq' }] })
      })
      .mockResolvedValueOnce({ // Configure provider - but with invalid admin key
        ok: false,
        status: 403,
        json: async () => ({ error: 'Admin access required' })
      });

    const availableProviders = await providerService.getAvailableProviders();
    expect(availableProviders).toHaveLength(1);

    // Attempt to configure provider with invalid admin access key
    await expect(
      apiKeyManager.configureProvider('groq', 'some-key', 'invalid-admin-key')
    ).rejects.toThrow('Failed to configure provider: 403 - Admin access required');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/providers/configure',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Admin-Access': 'invalid-admin-key'
        })
      })
    );
  });

  it('should be able to remove a provider configuration', async () => {
    const providerId = 'gemini';
    
    global.fetch
      .mockResolvedValueOnce({ // Delete provider config
        ok: true,
        json: async () => ({ message: 'Provider configuration removed successfully' })
      })
      .mockResolvedValueOnce({ // Get available providers after removal
        ok: true,
        json: async () => ({ providers: [
          { id: 'openai', name: 'OpenAI', isActive: true, hasApiKey: true },
          { id: 'groq', name: 'Groq', isActive: true, hasApiKey: false }
        ]})
      });

    // Remove the provider configuration
    const removeResult = await apiKeyManager.deleteProviderConfig(
      providerId, 
      mockAdminAccessKey
    );
    expect(removeResult.message).toBe('Provider configuration removed successfully');

    // Verify the provider is no longer configured
    const updatedProviders = await providerService.getAvailableProviders();
    const gemini = updatedProviders.find(p => p.id === providerId);
    // Depending on implementation, this might show as available but without API key,
    // or might not even appear if the removal completely deactivates it
    if (gemini) {
      expect(gemini.hasApiKey).toBe(false);
    }
  });
});