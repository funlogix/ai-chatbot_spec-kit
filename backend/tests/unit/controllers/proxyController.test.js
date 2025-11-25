// backend/tests/unit/controllers/proxyController.test.js
const proxyController = require('../../../src/controllers/proxyController');

describe('Proxy Controller', () => {
  describe('chatCompletion', () => {
    it('should return an error when required fields are missing', async () => {
      const req = { body: {} };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };

      await proxyController.chatCompletion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'providerId, model, and messages are required' 
      });
    });

    it('should return an error when providerId is missing', async () => {
      const req = { 
        body: { 
          model: 'test-model', 
          messages: [{ role: 'user', content: 'Hello' }] 
        } 
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };

      await proxyController.chatCompletion(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'providerId, model, and messages are required' 
      });
    });
  });

  describe('proxyRequest', () => {
    it('should return an error when required fields are missing', async () => {
      const req = { body: {} };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };

      await proxyController.proxyRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'providerId and endpoint are required' 
      });
    });

    it('should return an error when providerId is missing', async () => {
      const req = { body: { endpoint: '/test' } };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn()
      };

      await proxyController.proxyRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'providerId and endpoint are required' 
      });
    });
  });
});