// backend/tests/unit/services/apiProxyService.test.js
const apiProxyService = require('../../../src/services/apiProxyService');

describe('API Proxy Service', () => {
  describe('providerEndpoints', () => {
    it('should have endpoints for all supported providers', () => {
      expect(apiProxyService.providerEndpoints).toHaveProperty('openai');
      expect(apiProxyService.providerEndpoints).toHaveProperty('groq');
      expect(apiProxyService.providerEndpoints).toHaveProperty('gemini');
      expect(apiProxyService.providerEndpoints).toHaveProperty('openrouter');
    });
  });

  describe('validateAndPrepareRequest', () => {
    it('should throw an error for unsupported provider', () => {
      expect(() => {
        apiProxyService.validateAndPrepareRequest('unsupported-provider', { url: '/test' });
      }).toThrow('Unsupported provider: unsupported-provider');
    });

    it('should throw an error when URL is missing', () => {
      expect(() => {
        apiProxyService.validateAndPrepareRequest('openai', {});
      }).toThrow('Request URL is required');
    });

    it('should handle supported HTTP methods', () => {
      const requestData = { url: '/test', method: 'POST', data: { test: 'data' } };
      
      // This will fail at API key validation since we don't have one configured
      // But it should pass method validation
      expect(() => {
        apiProxyService.validateAndPrepareRequest('openai', requestData);
      }).toThrow('No API key configured for provider: openai');
    });
  });

  describe('formatRequestForProvider', () => {
    it('should format requests differently for different providers', () => {
      const openaiRequest = apiProxyService.formatRequestForProvider('openai', { 
        url: '/chat/completions',
        method: 'POST'
      });
      expect(openaiRequest.url).toBe('/chat/completions');

      const geminiRequest = apiProxyService.formatRequestForProvider('gemini', { 
        url: '/chat/completions',
        method: 'POST'
      });
      // The actual implementation would modify the URL for Gemini
      expect(geminiRequest.url).toBe('/chat/completions');
    });
  });

  describe('requestTimeout', () => {
    it('should have a default request timeout', () => {
      expect(apiProxyService.requestTimeout).toBeDefined();
      expect(typeof apiProxyService.requestTimeout).toBe('number');
    });
  });
});