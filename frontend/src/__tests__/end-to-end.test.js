// frontend/src/__tests__/end-to-end.test.js
// End-to-end integration tests for the multi-provider AI chatbot

// Mock the fetch API globally for all tests
global.fetch = jest.fn();

describe('End-to-End Provider Switching Flow', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful API responses by default
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/providers/available')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            providers: [
              { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4', 'gpt-3.5-turbo'] },
              { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b-8192', 'mixtral-8x7b-32768'] },
              { id: 'gemini', name: 'Google Gemini', isActive: true, models: ['gemini-pro', 'gemini-1.5-pro'] },
              { id: 'openrouter', name: 'OpenRouter', isActive: true, models: ['openchat/openchat-7b', 'nousresearch/nous-hermes-llama2-13b'] }
            ]
          })
        });
      } else if (url.includes('/api/providers/select')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ providerId: 'openai', message: 'Provider selected successfully' })
        });
      } else if (url.includes('/api/providers/openai/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'openai', status: 'available', hasApiKey: true })
        });
      } else if (url.includes('/api/proxy/chat/completions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: 'This is a test response from the model.' } }]
          })
        });
      } else {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
    });
  });

  test('Complete flow: get providers, select one, make requests', async () => {
    // This test replicates the user flow:
    // 1. Get available providers
    // 2. Select a provider
    // 3. Make a chat request through the proxy
    // 4. Switch to a different provider
    // 5. Make another chat request
    
    // Step 1: Initialize ProviderSelector component
    const ProviderService = require('../services/api/providerService.js').default;
    
    const availableProviders = await ProviderService.getAvailableProviders();
    expect(availableProviders).toHaveLength(4);
    expect(availableProviders[0].id).toBe('openai');
    expect(availableProviders[1].id).toBe('groq');
    expect(availableProviders[2].id).toBe('gemini');
    expect(availableProviders[3].id).toBe('openrouter');

    // Step 2: Select a provider
    const selectionResult = await ProviderService.selectProvider('groq');
    expect(selectionResult.providerId).toBe('groq');

    // Step 3: Simulate making a chat request through the proxy
    const chatResponse = await fetch('http://localhost:3000/api/proxy/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 'groq',
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: 'Hello, how are you?' }]
      })
    });

    expect(chatResponse.ok).toBe(true);
    const chatData = await chatResponse.json();
    expect(chatData.choices[0].message.content).toBe('This is a test response from the model.');

    // Step 4: Switch to another provider and make another request
    await ProviderService.selectProvider('openai');
    const chatResponse2 = await fetch('http://localhost:3000/api/proxy/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 'openai',
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'How does AI work?' }]
      })
    });

    expect(chatResponse2.ok).toBe(true);
    const chatData2 = await chatResponse2.json();
    expect(chatData2.choices[0].message.content).toBe('This is a test response from the model.');

    // Verify all API calls were made to expected endpoints
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/providers/available',
      expect.objectContaining({ method: 'GET' })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/providers/select',
      expect.objectContaining({ 
        method: 'POST',
        body: JSON.stringify({ providerId: 'groq' })
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/providers/select',
      expect.objectContaining({ 
        method: 'POST',
        body: JSON.stringify({ providerId: 'openai' })
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/proxy/chat/completions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"providerId":"groq"')
      })
    );
  });

  test('Provider status checking flow', async () => {
    // Verify that provider status checking works correctly
    const ProviderService = require('../services/api/providerService.js').default;
    
    const status = await ProviderService.getProviderStatus('openai');
    expect(status.id).toBe('openai');
    expect(status.status).toBe('available');
    expect(status.hasApiKey).toBe(true);
  });

  test('Error handling when provider is unavailable', async () => {
    // Mock an error response for a provider status request
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/providers/unavailable/status')) {
        return Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ error: 'Provider unavailable' })
        });
      }
      // Default responses for other endpoints
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    const ProviderService = require('../services/api/providerService.js').default;
    
    await expect(ProviderService.getProviderStatus('unavailable'))
      .rejects
      .toThrow('Failed to get provider status: 503 - Provider unavailable');
  });

  test('Model retrieval for specific provider', async () => {
    // Mock a response with provider models
    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/providers/available')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            providers: [
              { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b-8192', 'llama3-8b-8192'] }
            ]
          })
        });
      }
      // Default response for other endpoints
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const ModelService = require('../services/api/modelService.js').default;
    
    const models = await ModelService.getProviderModels('groq');
    expect(models).toHaveLength(2);
    expect(models[0].name).toBe('llama3-70b-8192');
    expect(models[1].name).toBe('llama3-8b-8192');
    expect(models[0].providerId).toBe('groq');
  });
});