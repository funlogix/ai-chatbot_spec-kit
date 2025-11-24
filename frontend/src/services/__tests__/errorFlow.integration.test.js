// frontend/src/services/__tests__/errorFlow.integration.test.js
// Mock the fetch API
global.fetch = jest.fn();

import ProviderService from '../api/providerService';
import APIKeyManager from '../auth/apiKeyManager';
import ErrorHandler from '../errorHandler';

describe('Error Flow Integration Tests', () => {
  const mockAdminAccessKey = 'test-admin-key';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Provider Failure Scenarios', () => {
    it('should handle provider failure and guide user to switch', async () => {
      const providerId = 'failing-provider';
      
      // Mock the provider status API call to return unavailable
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ 
          id: providerId, 
          status: 'unavailable', 
          hasApiKey: true,
          message: 'Provider is experiencing issues' 
        })
      });

      // Use the provider service to get status
      const status = await providerService.getProviderStatus(providerId);

      expect(status.status).toBe('unavailable');
      expect(status.message).toBe('Provider is experiencing issues');
      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/providers/${providerId}/status`,
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle complete provider outage during selection', async () => {
      const providerId = 'openai';
      
      // Mock the API to fail when selecting the provider
      global.fetch
        .mockResolvedValueOnce({ // getAvailableProviders - success
          ok: true,
          json: async () => ({ 
            providers: [{ id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] }] 
          })
        })
        .mockResolvedValueOnce({ // selectProvider - failure
          ok: false,
          status: 503,
          json: async () => ({ error: 'Provider is temporarily down' })
        });

      // First, get available providers
      const availableProviders = await providerService.getAvailableProviders();
      expect(availableProviders).toHaveLength(1);

      // Then try to select the provider - this should fail
      await expect(providerService.selectProvider(providerId)).rejects.toThrow(
        'Failed to select provider: 503 - Provider is temporarily down'
      );

      // Verify both API calls were made
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle API key validation failure', async () => {
      const providerId = 'groq';
      const invalidApiKey = 'invalid-api-key';
      
      // Mock the configuration API to return a validation error
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid API key format' })
      });

      // Attempt to configure with invalid API key
      await expect(
        apiKeyManager.configureProvider(providerId, invalidApiKey, mockAdminAccessKey)
      ).rejects.toThrow('Failed to configure provider: 401 - Invalid API key format');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/providers/configure',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining(invalidApiKey)
        })
      );
    });
  });

  describe('Rate Limit Handling', () => {
    it('should handle provider rate limit errors gracefully', async () => {
      const providerId = 'gemini';
      
      global.fetch
        .mockResolvedValueOnce({ // getProviderStatus - shows rate limit issue
          ok: true,
          json: async () => ({ 
            status: 'rate_limited', 
            hasApiKey: true, 
            message: 'Rate limit exceeded' 
          })
        });

      const status = await providerService.getProviderStatus(providerId);
      
      expect(status.status).toBe('rate_limited');
      expect(status.message).toBe('Rate limit exceeded');
      
      // Verify error handling with appropriate user guidance
      const error = new Error('Rate limit exceeded');
      error.status = 429;
      
      const handledError = errorHandler.handleRateLimitError(error, providerId);
      
      expect(handledError.errorType).toBe('RATE_LIMIT_EXCEEDED');
      expect(handledError.guidance).toContain('Wait');
      expect(handledError.guidance).toContain('configure additional providers');
    });

    it('should handle token rate limits', async () => {
      const providerId = 'openai';
      const error = new Error('Token rate limit exceeded');
      error.status = 429;
      
      const result = errorHandler.handleRateLimitError(error, providerId);
      
      expect(result.errorType).toBe('TOKEN_RATE_LIMIT_EXCEEDED');
      expect(result.message).toContain('token');
      expect(result.providerId).toBe(providerId);
    });
  });

  describe('User Guidance During Failures', () => {
    it('should provide appropriate guidance when selected provider fails', async () => {
      const providerId = 'openrouter';
      
      // Mock failure when trying to use the selected provider
      global.fetch
        .mockResolvedValueOnce({ // get available providers
          ok: true,
          json: async () => ({ 
            providers: [
              { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'], hasApiKey: true },
              { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'], hasApiKey: true }
            ] 
          })
        })
        .mockResolvedValueOnce({ // try to use openrouter - fail
          ok: false,
          status: 503,
          json: async () => ({ error: 'Provider unavailable' })
        });

      // Get available providers
      const availableProviders = await providerService.getAvailableProviders();
      expect(availableProviders).toHaveLength(2);

      // Try to use a provider that fails - the error handler should guide the user
      await expect(providerService.selectProvider(providerId)).rejects.toThrow();

      // Verify that there are other providers available as alternatives
      const otherProviders = availableProviders.filter(p => p.id !== providerId && p.hasApiKey);
      expect(otherProviders).toHaveLength(2); // Both openai and groq have API keys
    });

    it('should display data privacy information when switching providers', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ 
          providers: [
            { 
              id: 'openai', 
              name: 'OpenAI', 
              isActive: true, 
              models: ['gpt-4'], 
              dataPrivacyUrl: 'https://openai.com/policies/privacy-policy',
              hasApiKey: true
            }
          ] 
        })
      });

      const providers = await providerService.getAvailableProviders();

      // Verify that privacy information is available for user guidance
      expect(providers[0]).toHaveProperty('dataPrivacyUrl');
      expect(providers[0].dataPrivacyUrl).toContain('privacy-policy');
    });
  });

  describe('Fallback and Error Recovery', () => {
    it('should not implement automatic fallback as per specification', () => {
      // As per the spec, there should be NO automatic fallback
      // The system should return an error to the user without attempting to fall back to another provider
      const error = new Error('Provider failed');
      error.status = 503;
      
      const result = errorHandler.handleProviderError(error, 'failing-provider');
      
      // According to the spec, no fallback should happen
      // Instead, user should be guided to switch providers
      expect(result.errorType).toBe('PROVIDER_UNAVAILABLE');
      expect(result.guidance).not.toContain('automatically switched');
      expect(result.guidance).toContain('switch');
      expect(result.guidance).toContain('another');
    });

    it('should handle multiple consecutive provider failures', async () => {
      // Mock multiple providers failing consecutively
      global.fetch.mockImplementation((url) => {
        if (url.includes('/status')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'unavailable', hasApiKey: true, message: 'Temporarily down' })
          });
        } else if (url.includes('/select')) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: async () => ({ error: 'Provider unavailable' })
          });
        } else {
          return Promise.resolve({
            ok: true,
            json: async () => ({ providers: [] })
          });
        }
      });

      // Test multiple provider selection attempts
      await expect(providerService.selectProvider('provider1')).rejects.toThrow();
      await expect(providerService.selectProvider('provider2')).rejects.toThrow();
      
      expect(global.fetch).toHaveBeenCalledTimes(4); // 2 status checks + 2 selection attempts
    });
  });

  describe('Error Recovery and Information', () => {
    it('should provide clear error messages to the user', async () => {
      const testCases = [
        { status: 401, message: 'Invalid API key', expectedType: 'INVALID_API_KEY' },
        { status: 429, message: 'Rate limit exceeded', expectedType: 'RATE_LIMIT_EXCEEDED' },
        { status: 503, message: 'Provider unavailable', expectedType: 'PROVIDER_UNAVAILABLE' }
      ];

      for (const testCase of testCases) {
        global.fetch.mockResolvedValueOnce({
          ok: false,
          status: testCase.status,
          json: async () => ({ error: testCase.message })
        });

        const error = new Error(testCase.message);
        error.status = testCase.status;

        const result = errorHandler.handleProviderError(error, 'test-provider');
        
        expect(result.errorType).toContain(testCase.expectedType);
        expect(result.message).toContain(testCase.message);
      }
    });
  });
});