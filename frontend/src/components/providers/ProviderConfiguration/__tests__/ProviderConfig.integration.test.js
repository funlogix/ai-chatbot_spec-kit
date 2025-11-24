// frontend/src/components/providers/ProviderConfiguration/__tests__/ProviderConfig.integration.test.js
// Mock the fetch API
global.fetch = jest.fn();

// Import the necessary services
import ApiKeyManager from '../../../../services/auth/apiKeyManager.js';
import ProviderService from '../../../../services/api/providerService.js';

describe('Provider Configuration Integration Tests', () => {
  const mockAdminAccessKey = 'test-admin-key-123456';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses by default
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/providers/available')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            providers: [
              { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
              { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b-8192'] }
            ]
          })
        });
      } else if (url.includes('/api/providers/configure')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'config987',
            providerId: 'openai',
            name: 'OpenAI',
            message: 'Provider configured successfully'
          })
        });
      } else if (url.includes('/api/providers/openai')) {
        if (url.includes('/status')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 'openai', status: 'available', hasApiKey: true
            })
          });
        } else {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Provider operation successful' })
          });
        }
      } else {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
    });
  });

  test('Full provider configuration flow', async () => {
    // Step 1: Get available providers
    const availableProviders = await ProviderService.getAvailableProviders();
    expect(availableProviders).toHaveLength(2);
    expect(availableProviders[0].id).toBe('openai');
    expect(availableProviders[1].id).toBe('groq');

    // Step 2: Configure a provider with an API key
    const configureResponse = await ApiKeyManager.configureProvider(
      'openai',
      'test-api-key-sk-123abc',
      mockAdminAccessKey
    );
    
    expect(configureResponse.providerId).toBe('openai');
    expect(configureResponse.message).toBe('Provider configured successfully');

    // Step 3: Verify the provider is now available 
    const status = await ProviderService.getProviderStatus('openai');
    expect(status.id).toBe('openai');
    expect(status.hasApiKey).toBe(true);

    // Verify all API calls were made to the expected endpoints
    expect(global.fetch).toHaveBeenCalledTimes(3);
    
    // Verify configuration call to the backend
    expect(global.fetch).toHaveBeenNthCalledWith(
      2, // Second call after getting available providers
      'http://localhost:3000/api/providers/configure',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Admin-Access': mockAdminAccessKey
        })
      })
    );
  });

  test('Provider configuration with invalid admin access key', async () => {
    const invalidAccessKey = 'invalid-key';

    // Mock a 403 response for unauthorized access
    global.fetch.mockImplementationOnce((url) => {
      if (url.includes('/api/providers/configure')) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ error: 'Admin access required' })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await expect(
      ApiKeyManager.configureProvider('groq', 'test-key', invalidAccessKey)
    ).rejects.toThrow('Failed to configure provider: 403 - Admin access required');
  });

  test('Provider configuration with missing API key', async () => {
    await expect(
      ApiKeyManager.configureProvider('openai', '', mockAdminAccessKey)
    ).rejects.toThrow('API key is required and cannot be empty');
  });

  test('Provider removal flow', async () => {
    // Mock successful deletion response
    global.fetch.mockImplementationOnce((url) => {
      if (url.includes('/api/providers/openai') && !url.includes('/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Provider configuration removed successfully' })
        });
      }
      // Default response for other API calls
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    // First, get all providers
    const providers = await ProviderService.getAllProviderConfigs(mockAdminAccessKey);
    
    // Then delete a provider
    const deleteResponse = await ApiKeyManager.deleteProviderConfig('openai', mockAdminAccessKey);
    
    expect(deleteResponse.message).toBe('Provider configuration removed successfully');
    
    // Verify the call was made with admin access key
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/providers/openai',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Admin-Access': mockAdminAccessKey
        })
      })
    );
  });

  test('Provider selection after configuration', async () => {
    // Configure a provider first
    await ApiKeyManager.configureProvider('groq', 'test-groq-key', mockAdminAccessKey);
    
    // Check that the provider is now available
    const status = await ProviderService.getProviderStatus('groq');
    expect(status.hasApiKey).toBe(true);
    expect(status.status).toBe('available');

    // Select the provider
    const selectionResponse = await ProviderService.selectProvider('groq');
    expect(selectionResponse.providerId).toBe('groq');
  });

  test('Error handling during provider configuration', async () => {
    // Mock an error response during configuration
    global.fetch.mockImplementationOnce((url) => {
      if (url.includes('/api/providers/configure')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Invalid API key format' })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await expect(
      ApiKeyManager.configureProvider('openai', 'invalid-key', mockAdminAccessKey)
    ).rejects.toThrow('Failed to configure provider: 400 - Invalid API key format');

    // Verify the API call was made
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/providers/configure',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('openai')
      })
    );
  });
});