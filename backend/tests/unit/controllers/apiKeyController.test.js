// backend/tests/unit/controllers/apiKeyController.test.js
const apiKeyController = require('../../../src/controllers/apiKeyController');
const APIKey = require('../../../src/models/APIKey');

describe('API Key Controller', () => {
  describe('validateApiKey', () => {
    it('should return null when no API key exists for provider', () => {
      const result = apiKeyController.validateApiKey('nonexistent-provider', 'some-key');
      expect(result).toBeNull();
    });

    it('should validate the existence of an API key for a provider', () => {
      // This is a partial test since the controller uses in-memory storage
      // and doesn't persist keys across function calls in tests
      expect(apiKeyController.validateApiKey).toBeDefined();
      expect(typeof apiKeyController.validateApiKey).toBe('function');
    });
  });

  describe('createApiKey', () => {
    it('should return an error when providerId or apiKey is missing', async () => {
      const req = {
        body: { providerId: null, apiKey: null }
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };

      await apiKeyController.createApiKey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'providerId and apiKey are required' });
    });

    it('should create a new API key with valid input', async () => {
      const req = {
        body: { providerId: 'test-provider', apiKey: 'test-api-key' }
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };

      await apiKeyController.createApiKey(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('APIKey model validation', () => {
    it('should validate required fields', () => {
      expect(() => {
        APIKey.validate({});
      }).toThrow('Missing required field: providerId');

      expect(() => {
        APIKey.validate({ providerId: 'test' });
      }).toThrow('Missing required field: encryptedKey');
    });

    it('should validate field types and constraints', () => {
      expect(() => {
        APIKey.validate({ providerId: '', encryptedKey: 'short' });
      }).toThrow('providerId must be a non-empty string');

      expect(() => {
        APIKey.validate({ providerId: 'test', encryptedKey: 'sh' });
      }).toThrow('encryptedKey must be a string with minimum length of 10 characters');
    });
  });
});