// frontend/src/services/api/__tests__/providerService.test.js
// Mock the fetch API
global.fetch = jest.fn();

// Import the provider service
import ProviderService from '../providerService';

describe('Provider Service API Calls', () => {
  let providerService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    providerService = new ProviderService();
  });

  describe('getAvailableProviders', () => {
    it('should fetch available providers from the backend', async () => {
      const mockProviders = [
        { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
        { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] }
      ];
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ providers: mockProviders })
      });

      const result = await providerService.getAvailableProviders();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/providers/available',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      expect(result).toEqual(mockProviders);
    });

    it('should throw an error when the API call fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' })
      });

      await expect(providerService.getAvailableProviders()).rejects.toThrow(
        'Failed to get available providers: 500 - Server error'
      );
    });
  });

  describe('getProviderStatus', () => {
    it('should fetch provider status from the backend', async () => {
      const providerId = 'openai';
      const mockStatus = { id: 'openai', status: 'available', hasApiKey: true };
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockStatus
      });

      const result = await providerService.getProviderStatus(providerId);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/providers/openai/status',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      expect(result).toEqual(mockStatus);
    });

    it('should throw an error when getting provider status fails', async () => {
      const providerId = 'nonexistent';
      
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Provider not found' })
      });

      await expect(providerService.getProviderStatus(providerId)).rejects.toThrow(
        'Failed to get provider status: 404 - Provider not found'
      );
    });
  });

  describe('selectProvider', () => {
    it('should select a provider via the backend API', async () => {
      const providerId = 'groq';
      const mockResponse = { providerId, message: 'Provider selected successfully' };
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await providerService.selectProvider(providerId);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/providers/select',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerId })
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when selecting provider fails', async () => {
      const providerId = 'invalid';
      
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid provider' })
      });

      await expect(providerService.selectProvider(providerId)).rejects.toThrow(
        'Failed to select provider: 400 - Invalid provider'
      );
    });
  });

  describe('healthCheck', () => {
    it('should perform a health check for a provider', async () => {
      const providerId = 'openai';
      const mockStatus = { status: 'available', hasApiKey: true };
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockStatus
      });

      const result = await providerService.healthCheck(providerId);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/providers/openai/status',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      expect(result.providerId).toBe(providerId);
      expect(result.isHealthy).toBe(true);
    });

    it('should return unhealthy status when health check fails', async () => {
      const providerId = 'invalid';
      
      global.fetch.mockRejectedValue(new Error('Network error'));

      const result = await providerService.healthCheck(providerId);

      expect(result.providerId).toBe(providerId);
      expect(result.isHealthy).toBe(false);
      expect(result.details.error).toBe('Network error');
    });
  });

  describe('admin functions', () => {
    const adminAccessKey = 'test-admin-key';

    it('should get provider configurations with admin access', async () => {
      const mockConfigs = [
        { id: 'config1', providerId: 'openai', name: 'OpenAI Config' }
      ];
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ providers: mockConfigs })
      });

      const result = await providerService.getAllProviderConfigs(adminAccessKey);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/providers',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Access': adminAccessKey
          }
        }
      );
      expect(result).toEqual(mockConfigs);
    });

    it('should configure a provider with admin access', async () => {
      const config = { providerId: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1' };
      const mockResponse = { id: 'new-config', ...config, message: 'Provider configured successfully' };
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await providerService.configureProvider(config, adminAccessKey);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/providers/configure',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Access': adminAccessKey
          },
          body: JSON.stringify(config)
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});