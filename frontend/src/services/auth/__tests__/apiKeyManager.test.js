// frontend/src/services/auth/__tests__/apiKeyManager.test.js
import APIKeyManager from '../apiKeyManager';

// Since API key encryption/decryption happens on the backend, 
// the frontend's API key manager mostly handles sending/receiving keys to/from backend
// but doesn't perform the actual encryption/decryption

describe('API Key Manager Tests', () => {
  let apiKeyManager;

  beforeEach(() => {
    apiKeyManager = new APIKeyManager();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configure Provider', () => {
    it('should call backend API to configure a provider with API key', async () => {
      const providerId = 'openai';
      const apiKey = 'test-api-key-123';
      const mockResponse = {
        id: 'config123',
        providerId: 'openai',
        message: 'Provider configured successfully'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiKeyManager.configureProvider(providerId, apiKey);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/providers/configure',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Admin-Access': expect.any(String)
          }),
          body: JSON.stringify({
            providerId: 'openai',
            name: 'OpenAI',
            endpoint: 'https://api.openai.com/v1',
            apiKey: 'test-api-key-123',
            config: {}
          })
        })
      );
      expect(result).toMatchObject(mockResponse);
    });

    it('should handle errors when configuring provider', async () => {
      const providerId = 'invalid-provider';
      const apiKey = 'test-key';

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid provider ID' })
      });

      await expect(apiKeyManager.configureProvider(providerId, apiKey)).rejects.toThrow(
        'Failed to configure provider: 400 - Invalid provider ID'
      );
    });
  });

  describe('Get All Provider Configs', () => {
    it('should retrieve all provider configurations', async () => {
      const mockConfigs = [
        { id: 'config1', providerId: 'openai', name: 'OpenAI Config' },
        { id: 'config2', providerId: 'groq', name: 'Groq Config' }
      ];
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ providers: mockConfigs })
      });

      const adminAccessKey = 'test-admin-key';
      const configs = await apiKeyManager.getAllProviderConfigs(adminAccessKey);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/providers',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Admin-Access': adminAccessKey
          })
        })
      );
      expect(configs).toEqual(mockConfigs);
    });

    it('should handle errors when retrieving configurations', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      });

      await expect(apiKeyManager.getAllProviderConfigs('admin-key')).rejects.toThrow(
        'Failed to get provider configs: 500 - Server error'
      );
    });
  });

  describe('Delete Provider Config', () => {
    it('should delete a provider configuration', async () => {
      const providerId = 'openai';
      const mockResponse = { message: 'Provider configuration deleted successfully' };
      const adminAccessKey = 'admin-key';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiKeyManager.deleteProviderConfig(providerId, adminAccessKey);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/providers/openai',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Admin-Access': adminAccessKey
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when deleting provider configuration', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Provider config not found' })
      });

      await expect(
        apiKeyManager.deleteProviderConfig('nonexistent', 'admin-key')
      ).rejects.toThrow('Failed to delete provider config: 404 - Provider config not found');
    });
  });

  describe('Get Provider Status', () => {
    it('should get status for a provider', async () => {
      const providerId = 'groq';
      const mockStatus = { id: 'groq', status: 'available', hasApiKey: true };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      });

      const status = await apiKeyManager.getProviderStatus(providerId);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/providers/${providerId}/status`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(status).toEqual(mockStatus);
    });

    it('should handle errors when getting provider status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid provider ID' })
      });

      await expect(apiKeyManager.getProviderStatus('invalid')).rejects.toThrow(
        'Failed to get provider status: 400 - Invalid provider ID'
      );
    });
  });

  describe('Select Provider', () => {
    it('should select a provider for use', async () => {
      const providerId = 'openai';
      const mockResponse = { providerId, message: 'Provider selected successfully' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await apiKeyManager.selectProvider(providerId);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/providers/select',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ providerId })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when selecting a provider', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Provider not available' })
      });

      await expect(apiKeyManager.selectProvider('invalid')).rejects.toThrow(
        'Failed to select provider: 400 - Provider not available'
      );
    });
  });
});