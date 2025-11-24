// frontend/src/services/__tests__/errorHandler.test.js
import ErrorHandler from '../errorHandler';

describe('Error Handler Service', () => {
  let errorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Handle Provider Unavailability', () => {
    it('should handle provider unavailability with appropriate error message', () => {
      const error = new Error('Provider unavailable');
      error.status = 503;
      
      const result = errorHandler.handleProviderError(error, 'openai');
      
      expect(result).toEqual({
        errorType: 'PROVIDER_UNAVAILABLE',
        message: 'OpenAI provider is currently unavailable. Please try again later or select another provider.',
        providerId: 'openai',
        guidance: 'Switch to another available provider from the provider selection menu'
      });
    });

    it('should handle invalid API key errors', () => {
      const error = new Error('Invalid API key');
      error.status = 401;
      
      const result = errorHandler.handleProviderError(error, 'groq');
      
      expect(result).toEqual({
        errorType: 'INVALID_API_KEY',
        message: 'The API key for Groq is invalid. Please check your configuration.',
        providerId: 'groq',
        guidance: 'Go to provider configuration and update your Groq API key'
      });
    });

    it('should handle rate limit exceeded errors', () => {
      const error = new Error('Rate limit exceeded');
      error.status = 429;
      
      const result = errorHandler.handleProviderError(error, 'gemini');
      
      expect(result).toEqual({
        errorType: 'RATE_LIMIT_EXCEEDED',
        message: 'Google Gemini provider rate limit exceeded. Too many requests.',
        providerId: 'gemini',
        guidance: 'Wait for the rate limit to reset or configure additional providers for load distribution'
      });
    });

    it('should handle request timeout errors', () => {
      const error = new Error('Network request timed out');
      error.status = 0; // Network errors often have status 0
      
      const result = errorHandler.handleProviderError(error, 'openrouter');
      
      expect(result).toEqual({
        errorType: 'REQUEST_TIMEOUT',
        message: 'Request to OpenRouter provider timed out. The provider might be slow to respond.',
        providerId: 'openrouter',
        guidance: 'Try again, or select another provider if the issue persists'
      });
    });

    it('should handle generic provider errors', () => {
      const error = new Error('Generic provider error');
      error.status = 500;
      
      const result = errorHandler.handleProviderError(error, 'unknown-provider');
      
      expect(result).toEqual({
        errorType: 'PROVIDER_ERROR',
        message: 'An error occurred with the unknown-provider provider: Generic provider error',
        providerId: 'unknown-provider',
        guidance: 'Try selecting a different provider or check your connection'
      });
    });
  });

  describe('Handle Model Unavailability', () => {
    it('should handle unavailable model errors', () => {
      const error = new Error('Model not found');
      error.status = 404;
      
      const result = errorHandler.handleModelError(error, 'gpt-99x-mega');
      
      expect(result).toEqual({
        errorType: 'MODEL_UNAVAILABLE',
        message: 'The requested model gpt-99x-mega is not available. Please select a different model.',
        modelId: 'gpt-99x-mega',
        guidance: 'Choose a different model from the model selection dropdown or try a different provider'
      });
    });

    it('should handle insufficient model permissions', () => {
      const error = new Error('Insufficient permissions for model');
      error.status = 403;
      
      const result = errorHandler.handleModelError(error, 'premium-model');
      
      expect(result).toEqual({
        errorType: 'MODEL_PERMISSION_DENIED',
        message: 'You do not have permission to use the premium-model. Upgrade your subscription or select a different model.',
        modelId: 'premium-model',
        guidance: 'Select a different model that matches your current access level'
      });
    });
  });

  describe('Handle Network Errors', () => {
    it('should handle network connectivity issues', () => {
      const error = new Error('Network is offline');
      error.status = 0;
      error.type = 'not-allowed';
      
      const result = errorHandler.handleNetworkError(error);
      
      expect(result).toEqual({
        errorType: 'NETWORK_ERROR',
        message: 'Unable to connect to the service. Please check your internet connection.',
        guidance: 'Check your network connection and try again'
      });
    });

    it('should handle CORS errors', () => {
      const error = new Error('CORS error');
      error.status = 0;
      error.type = 'cors-error';
      
      const result = errorHandler.handleNetworkError(error);
      
      expect(result).toEqual({
        errorType: 'CORS_ERROR',
        message: 'Cross-origin request blocked. This may be a configuration issue with the backend.',
        guidance: 'Contact your system administrator to check backend API configuration'
      });
    });
  });

  describe('Handle Rate Limit Errors', () => {
    it('should handle requests per minute rate limits', () => {
      const error = new Error('Rate limit exceeded');
      error.status = 429;
      
      const result = errorHandler.handleRateLimitError(error, 'openai');
      
      expect(result).toEqual({
        errorType: 'RATE_LIMIT_EXCEEDED',
        message: 'OpenAI provider rate limit exceeded (requests per minute).',
        providerId: 'openai',
        guidance: 'Wait before making more requests to OpenAI or configure additional providers for load distribution'
      });
    });

    it('should handle tokens per minute rate limits', () => {
      const error = new Error('Token rate limit exceeded');
      error.status = 429;
      
      const result = errorHandler.handleRateLimitError(error, 'groq');
      
      expect(result).toEqual({
        errorType: 'TOKEN_RATE_LIMIT_EXCEEDED',
        message: 'Groq provider rate limit exceeded (tokens per minute).',
        providerId: 'groq',
        guidance: 'Reduce the number of tokens in your requests or wait before making more requests'
      });
    });
  });

  describe('User Guidance', () => {
    it('should provide specific guidance when a provider fails', () => {
      const error = new Error('Provider failed');
      error.status = 503;
      
      const result = errorHandler.handleProviderError(error, 'openai');
      
      // Verify the guidance message is helpful
      expect(result.guidance).toContain('Switch to another available provider');
      expect(result.errorType).toBe('PROVIDER_UNAVAILABLE');
    });

    it('should provide guidance when API key is missing', () => {
      const error = new Error('No API key provided');
      error.status = 401;
      
      const result = errorHandler.handleProviderError(error, 'gemini');
      
      expect(result.errorType).toBe('INVALID_API_KEY');
      expect(result.guidance).toContain('Go to provider configuration');
      expect(result.guidance).toContain('update your');
    });

    it('should suggest switching providers when one is unavailable', () => {
      const error = new Error('Provider down');
      error.status = 503;
      
      const result = errorHandler.handleProviderError(error, 'openrouter');
      
      expect(result.guidance.toLowerCase()).toContain('switch');
      expect(result.guidance.toLowerCase()).toContain('provider');
    });
  });

  describe('Error Classification', () => {
    it('should classify authentication errors', () => {
      const errorTypes = [
        { status: 401, expected: 'INVALID_API_KEY' },
        { status: 403, expected: 'MODEL_PERMISSION_DENIED' },
        { status: 404, expected: 'MODEL_UNAVAILABLE' },
        { status: 429, expected: 'RATE_LIMIT_EXCEEDED' },
        { status: 503, expected: 'PROVIDER_UNAVAILABLE' }
      ];
      
      errorTypes.forEach(({ status, expected }) => {
        const error = new Error('Test error');
        error.status = status;
        
        const result = errorHandler.classifyError(error, 'test-provider');
        
        // For status codes that map to provider errors, check the classification
        if ([401, 403, 404].includes(status)) {
          expect(result.errorType).toMatch(/(INVALID_API_KEY|MODEL_PERMISSION_DENIED|MODEL_UNAVAILABLE)/);
        } else if (status === 429) {
          expect(result.errorType).toBe('RATE_LIMIT_EXCEEDED');
        } else if (status === 503) {
          expect(result.errorType).toBe('PROVIDER_UNAVAILABLE');
        }
      });
    });

    it('should handle non-standard errors', () => {
      const error = new Error('Custom error with no status');
      // No status property
      
      const result = errorHandler.handleProviderError(error, 'test-provider');
      
      expect(result.errorType).toBe('PROVIDER_ERROR');
      expect(result.message).toContain('Custom error with no status');
    });
  });
});