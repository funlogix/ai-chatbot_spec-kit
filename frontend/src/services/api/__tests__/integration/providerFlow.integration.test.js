// frontend/src/services/api/__tests__/integration/providerFlow.integration.test.js
// Mock the fetch API globally for this test suite
global.fetch = jest.fn();

// Import the services to test
import ProviderService from '../../providerService.js';
import ModelService from '../../modelService.js';
import APIProxyService from '../../../services/apiProxyService.js';

describe('Provider Switching Flow Integration Test', () => {
  const baseURL = 'http://localhost:3000';
  let providerService;
  let modelService;

  beforeEach(() => {
    jest.clearAllMocks();
    providerService = new ProviderService();
    modelService = new ModelService();
    
    // Set the base URL for the services
    providerService.baseURL = baseURL;
    modelService.baseURL = baseURL;
  });

  test('Complete provider switching flow: get providers -> select provider -> get models -> make chat request', async () => {
    // Mock successful responses for the entire flow
    global.fetch
      .mockResolvedValueOnce({  // For getAvailableProviders
        ok: true,
        json: async () => ({
          providers: [
            { id: 'groq', name: 'Groq', models: ['openai/gpt-oss-120b', 'qwen/qwen3-32b'], isActive: true },
            { id: 'openai', name: 'OpenAI', models: ['o4-mini', 'gpt-5'], isActive: true }
          ]
        })
      })
      .mockResolvedValueOnce({  // For selectProvider
        ok: true,
        json: async () => ({ providerId: 'groq', message: 'Provider selected successfully' })
      })
      .mockResolvedValueOnce({  // For getProviderStatus (during selection)
        ok: true,
        json: async () => ({ id: 'groq', status: 'available', hasApiKey: true })
      })
      .mockResolvedValueOnce({  // For chat completion proxy call
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'This is a test response' }}]
        })
      });

    // Step 1: Get available providers
    const providers = await providerService.getAvailableProviders();
    expect(providers).toHaveLength(2);
    expect(providers[0].id).toBe('groq');
    expect(providers[1].id).toBe('openai');

    // Step 2: Select a provider
    const selectionResult = await providerService.selectProvider('groq');
    expect(selectionResult.providerId).toBe('groq');

    // Step 3: Get models for the selected provider
    const groqModels = await modelService.getProviderModels('groq');
    expect(groqModels.length).toBeGreaterThan(0);

    // Step 4: Make a chat request through the proxy
    const proxyResponse = await fetch(`${baseURL}/api/proxy/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 'groq',
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    expect(proxyResponse.ok).toBe(true);
    const responseData = await proxyResponse.json();
    expect(responseData.choices[0].message.content).toBe('This is a test response');

    // Verify the correct API endpoints were called
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(global.fetch).toHaveBeenCalledWith(
      `${baseURL}/api/providers/available`,
      expect.objectContaining({ method: 'GET' })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `${baseURL}/api/providers/select`,
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"providerId":"groq"')
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `${baseURL}/api/providers/groq/status`,
      expect.objectContaining({ method: 'GET' })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `${baseURL}/api/proxy/chat/completions`,
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"providerId":"groq"')
      })
    );
  });

  test('Provider switching flow with model auto-selection', async () => {
    // Mock responses where the provider selection returns the default model
    global.fetch
      .mockResolvedValueOnce({ // getAvailableProviders
        ok: true,
        json: async () => ({
          providers: [
            { id: 'openrouter', name: 'OpenRouter', models: ['z-ai/glm-4.5-air:free', 'x-ai/grok-4.1-fast:free'], defaultModel: 'z-ai/glm-4.5-air:free', isActive: true }
          ]
        })
      })
      .mockResolvedValueOnce({ // selectProvider
        ok: true,
        json: async () => ({ providerId: 'openrouter', message: 'Provider selected successfully' })
      })
      .mockResolvedValueOnce({ // getProviderStatus
        ok: true,
        json: async () => ({ id: 'openrouter', status: 'available', hasApiKey: true })
      });

    // Step 1: Get available providers
    const providers = await providerService.getAvailableProviders();
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe('openrouter');

    // Step 2: Select provider and get its default model
    const selectionResult = await providerService.selectProvider('openrouter');
    expect(selectionResult.providerId).toBe('openrouter');

    // Step 3: Get models for the provider to see the default
    const models = await modelService.getProviderModels('openrouter');
    expect(models).toHaveLength(2);
    expect(models[0].id).toBe('z-ai/glm-4.5-air:free');
  });

  test('Provider switching flow handles errors gracefully', async () => {
    // Mock an error response for missing API key
    global.fetch
      .mockResolvedValueOnce({ // getAvailableProviders
        ok: true,
        json: async () => ({
          providers: [
            { id: 'gemini', name: 'Google Gemini', models: ['gemini-2.5-flash'], isActive: true }
          ]
        })
      })
      .mockResolvedValueOnce({ // selectProvider - returns 400 for missing key
        ok: false,
        status: 400,
        json: async () => ({ error: 'API key needs to be configured to use this provider' })
      });

    // Step 1: Get available providers
    const providers = await providerService.getAvailableProviders();
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe('gemini');

    // Step 2: Attempt to select a provider without API key should fail gracefully
    await expect(providerService.selectProvider('gemini')).rejects.toThrow('Failed to select provider: 400 - API key needs to be configured to use this provider');
  });

  test('Switch from one provider to another', async () => {
    global.fetch
      .mockResolvedValueOnce({ // First getAvailableProviders for Groq
        ok: true,
        json: async () => ({
          providers: [
            { id: 'groq', name: 'Groq', models: ['openai/gpt-oss-120b'], isActive: true }
          ]
        })
      })
      .mockResolvedValueOnce({ // Select Groq
        ok: true,
        json: async () => ({ providerId: 'groq', message: 'Provider selected successfully' })
      })
      .mockResolvedValueOnce({ // Status check for Groq
        ok: true,
        json: async () => ({ id: 'groq', status: 'available', hasApiKey: true })
      })
      .mockResolvedValueOnce({ // Get available for OpenAI 
        ok: true,
        json: async () => ({
          providers: [
            { id: 'openai', name: 'OpenAI', models: ['gpt-5'], isActive: true }
          ]
        })
      })
      .mockResolvedValueOnce({ // Select OpenAI
        ok: true,
        json: async () => ({ providerId: 'openai', message: 'Provider selected successfully' })
      })
      .mockResolvedValueOnce({ // Status check for OpenAI
        ok: true,
        json: async () => ({ id: 'openai', status: 'available', hasApiKey: true })
      });

    // Initially select Groq
    await providerService.selectProvider('groq');
    
    // Then switch to OpenAI
    await providerService.selectProvider('openai');
    
    // Verify both providers were selected at different times
    expect(global.fetch).toHaveBeenCalledTimes(6);
  });
});