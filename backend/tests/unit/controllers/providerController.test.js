// backend/tests/unit/controllers/providerController.test.js
const providerController = require('../../../src/controllers/providerController');
const ProviderConfiguration = require('../../../src/models/ProviderConfiguration');

describe('Provider Controller', () => {
  describe('getAvailableProviders', () => {
    it('should return a list of available providers', async () => {
      const req = {};
      const res = {
        json: jest.fn()
      };

      await providerController.getAvailableProviders(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        providers: expect.arrayContaining([
          expect.objectContaining({
            id: 'openai',
            name: 'OpenAI'
          })
        ])
      }));
    });
  });

  describe('getProviderStatus', () => {
    it('should return an error for non-existent provider', async () => {
      const req = { params: { providerId: 'nonexistent-provider' } };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };

      await providerController.getProviderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Provider not found' });
    });

    it('should return status for a valid provider', async () => {
      const req = { params: { providerId: 'openai' } };
      const res = {
        json: jest.fn()
      };

      await providerController.getProviderStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 'openai',
        name: 'OpenAI'
      }));
    });
  });

  describe('selectProvider', () => {
    it('should return an error when providerId is not provided', async () => {
      const req = { body: {} };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };

      await providerController.selectProvider(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'providerId is required' });
    });
  });

  describe('ProviderConfiguration model validation', () => {
    it('should validate required fields', () => {
      expect(() => {
        ProviderConfiguration.validate({});
      }).toThrow('Missing required field: providerId');

      expect(() => {
        ProviderConfiguration.validate({ providerId: 'test' });
      }).toThrow('Missing required field: name');

      expect(() => {
        ProviderConfiguration.validate({ 
          providerId: 'test', 
          name: 'Test Provider' 
        });
      }).toThrow('Missing required field: endpoint');
    });

    it('should validate field types and constraints', () => {
      expect(() => {
        ProviderConfiguration.validate({ 
          providerId: '', 
          name: 'Test Provider', 
          endpoint: 'https://api.example.com' 
        });
      }).toThrow('providerId must be a non-empty string');

      expect(() => {
        ProviderConfiguration.validate({ 
          providerId: 'test', 
          name: '', 
          endpoint: 'https://api.example.com' 
        });
      }).toThrow('name must be a non-empty string');

      expect(() => {
        ProviderConfiguration.validate({ 
          providerId: 'test', 
          name: 'Test Provider', 
          endpoint: 'invalid-url' 
        });
      }).toThrow('endpoint must be a valid URL string');
    });
  });
});