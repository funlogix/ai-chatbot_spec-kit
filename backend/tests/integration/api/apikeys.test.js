// backend/tests/integration/api/apikeys.test.js
const request = require('supertest');
const app = require('../../../src/app');

describe('API Keys API Integration', () => {
  // Note: These tests require admin authentication which is challenging to mock
  // in a test environment without setting up a full authentication system.
  // In a real implementation, you would need to either:
  // 1. Use test credentials in the headers
  // 2. Mock the authentication middleware for tests
  // 3. Skip authentication for tests

  describe('POST /api/apikeys (admin only)', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)
        .post('/api/apikeys')
        .send({
          providerId: 'openai',
          apiKey: 'test-key'
        })
        .expect(401); // Expecting unauthorized without admin credentials

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/apikeys (admin only)', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)
        .get('/api/apikeys')
        .expect(401); // Expecting unauthorized without admin credentials

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/apikeys/:id (admin only)', () => {
    it('should require admin authentication', async () => {
      const response = await request(app)
        .get('/api/apikeys/invalid-id')
        .expect(401); // Expecting unauthorized without admin credentials

      expect(response.body).toHaveProperty('error');
    });
  });

  // Test without authentication for non-admin endpoints if they exist
  describe('Non-admin endpoints', () => {
    it('should handle unauthorized requests appropriately', async () => {
      const response = await request(app)
        .post('/api/apikeys')
        .expect(401);

      expect(response.status).toBe(401);
    });
  });
});