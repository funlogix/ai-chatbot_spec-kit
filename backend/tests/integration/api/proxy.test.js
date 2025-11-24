// backend/tests/integration/api/proxy.test.js
const request = require('supertest');
const app = require('../../../src/app');

describe('Proxy API Integration', () => {
  describe('POST /api/proxy/chat/completions', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/proxy/chat/completions')
        .send({
          providerId: 'openai',
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }]
        })
        .expect(401); // Expecting unauthorized without authentication

      expect(response.body).toHaveProperty('error');
    });

    it('should return an error when required fields are missing', async () => {
      // This test bypasses auth for testing the validation logic
      // In a real scenario, auth would happen first
      const response = await request(app)
        .post('/api/proxy/chat/completions')
        .send({})
        .set('Authorization', 'Bearer valid-token') // Assuming this bypasses auth in tests
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/proxy (generic)', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/proxy')
        .send({
          providerId: 'openai',
          endpoint: '/test',
          data: {}
        })
        .expect(401); // Expecting unauthorized without authentication

      expect(response.body).toHaveProperty('error');
    });

    it('should return an error when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/proxy')
        .send({})
        .set('Authorization', 'Bearer valid-token') // Assuming this bypasses auth in tests
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Invalid routes', () => {
    it('should return 404 for invalid routes', async () => {
      const response = await request(app)
        .get('/invalid/route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});