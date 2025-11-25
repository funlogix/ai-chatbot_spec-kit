// backend/tests/integration/api/providers.test.js
const request = require('supertest');
const app = require('../../../src/app');

describe('Providers API Integration', () => {
  describe('GET /api/providers/available', () => {
    it('should return a list of available providers', async () => {
      const response = await request(app)
        .get('/api/providers/available')
        .expect(200);

      expect(response.body).toHaveProperty('providers');
      expect(Array.isArray(response.body.providers)).toBe(true);
      expect(response.body.providers.length).toBeGreaterThan(0);

      // Check that the providers have required properties
      const firstProvider = response.body.providers[0];
      expect(firstProvider).toHaveProperty('id');
      expect(firstProvider).toHaveProperty('name');
      expect(firstProvider).toHaveProperty('description');
      expect(firstProvider).toHaveProperty('isActive');
    });
  });

  describe('GET /api/providers/:providerId/status', () => {
    it('should return status for a valid provider', async () => {
      const response = await request(app)
        .get('/api/providers/openai/status')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'openai');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('hasApiKey');
    });

    it('should return 404 for an invalid provider', async () => {
      const response = await request(app)
        .get('/api/providers/nonexistent/status')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/providers/select', () => {
    it('should return an error when providerId is not provided', async () => {
      const response = await request(app)
        .post('/api/providers/select')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'providerId is required');
    });

    it('should return an error when provider does not exist', async () => {
      const response = await request(app)
        .post('/api/providers/select')
        .send({ providerId: 'nonexistent' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Health check endpoint', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});