// frontend/src/services/api/__tests__/providerFlow.integration.test.js
// Mock the fetch API
global.fetch = jest.fn();

import ProviderService from '../providerService';

describe('Provider Switching Integration Flow', () => {
  let providerService;

  beforeEach(() => {
    jest.clearAllMocks();
    providerService = new ProviderService();
  });

  it('should complete the full provider switching flow', async () => {
    // Mock the sequence of API calls for the entire flow
    const mockAvailableProviders = [
      { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
      { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] },
      { id: 'gemini', name: 'Google Gemini', isActive: true, models: ['gemini-pro'] }
    ];

    // Mock the responses for each API call in the flow
    global.fetch
      .mockResolvedValueOnce({ // For getAvailableProviders
        ok: true,
        json: async () => ({ providers: mockAvailableProviders })
      })
      .mockResolvedValueOnce({ // For getProviderStatus (openai)
        ok: true,
        json: async () => ({ id: 'openai', status: 'available', hasApiKey: true })
      })
      .mockResolvedValueOnce({ // For selectProvider
        ok: true,
        json: async () => ({ providerId: 'openai', message: 'Provider selected successfully' })
      });

    // Step 1: Get available providers
    const availableProviders = await providerService.getAvailableProviders();
    expect(availableProviders).toHaveLength(3);
    expect(availableProviders[0].id).toBe('openai');
    expect(availableProviders[1].id).toBe('groq');
    expect(availableProviders[2].id).toBe('gemini');

    // Step 2: Check the status of a specific provider
    const openaiStatus = await providerService.getProviderStatus('openai');
    expect(openaiStatus.id).toBe('openai');
    expect(openaiStatus.status).toBe('available');
    expect(openaiStatus.hasApiKey).toBe(true);

    // Step 3: Select a provider
    const selectionResult = await providerService.selectProvider('openai');
    expect(selectionResult.providerId).toBe('openai');
    expect(selectionResult.message).toBe('Provider selected successfully');

    // Verify all expected API calls were made
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/api/providers/available',
      expect.objectContaining({ method: 'GET' })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/api/providers/openai/status',
      expect.objectContaining({ method: 'GET' })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      'http://localhost:3000/api/providers/select',
      expect.objectContaining({ 
        method: 'POST',
        body: JSON.stringify({ providerId: 'openai' })
      })
    );
  });

  it('should handle provider switching with failure scenarios', async () => {
    const mockAvailableProviders = [
      { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
      { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] }
    ];

    global.fetch
      .mockResolvedValueOnce({ // For getAvailableProviders
        ok: true,
        json: async () => ({ providers: mockAvailableProviders })
      })
      .mockResolvedValueOnce({ // For getProviderStatus (openai)
        ok: true,
        json: async () => ({ id: 'openai', status: 'available', hasApiKey: true })
      })
      .mockResolvedValueOnce({ // For getProviderStatus (groq) - simulate missing API key
        ok: true,
        json: async () => ({ id: 'groq', status: 'missing_api_key', hasApiKey: false })
      })
      .mockResolvedValueOnce({ // For selectProvider (first attempt - success)
        ok: true,
        json: async () => ({ providerId: 'openai', message: 'Provider selected successfully' })
      });

    // Step 1: Get available providers
    const availableProviders = await providerService.getAvailableProviders();
    expect(availableProviders).toHaveLength(2);

    // Step 2: Check statuses
    const openaiStatus = await providerService.getProviderStatus('openai');
    expect(openaiStatus.hasApiKey).toBe(true);

    const groqStatus = await providerService.getProviderStatus('groq');
    expect(groqStatus.hasApiKey).toBe(false);
    expect(groqStatus.status).toBe('missing_api_key');

    // Step 3: Select a working provider
    const selectionResult = await providerService.selectProvider('openai');
    expect(selectionResult.providerId).toBe('openai');

    // Verify all API calls were made
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('should handle errors during the provider switching flow', async () => {
    // Simulate an error when getting available providers
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' })
    });

    await expect(providerService.getAvailableProviders()).rejects.toThrow(
      'Failed to get available providers: 500 - Internal server error'
    );

    // Reset mock for next test
    jest.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ providers: [] })
    });

    // Simulate error when selecting provider
    await expect(providerService.selectProvider('nonexistent')).rejects.toThrow(
      'Failed to select provider'
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should perform health checks as part of the flow', async () => {
    const providerId = 'gemini';
    const mockStatus = { id: 'gemini', status: 'available', hasApiKey: true };

    global.fetch
      .mockResolvedValueOnce({ // For getProviderStatus (used in health check)
        ok: true,
        json: async () => mockStatus
      });

    // Perform a health check
    const healthResult = await providerService.healthCheck(providerId);

    expect(healthResult.providerId).toBe(providerId);
    expect(healthResult.isHealthy).toBe(true);
    expect(healthResult.details).toEqual(mockStatus);

    // Verify the API call was made
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/providers/gemini/status',
      expect.objectContaining({ method: 'GET' })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});