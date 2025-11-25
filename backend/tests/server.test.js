// backend/tests/server.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Server Endpoints', () => {
  describe('Root and health check', () => {
    it('should return 404 for root path', async () => {
      const response = await request(app)
        .get('/')
        .expect(404);
        
      expect(response.body).toHaveProperty('error');
    });

    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
        
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('API versioning and routing', () => {
    it('should return 404 for non-existent API endpoints', async () => {
      const response = await request(app)
        .get('/api/invalid-endpoint')
        .expect(404);
        
      expect(response.body).toHaveProperty('error');
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/health')
        .expect(200);
        
      expect(response.status).toBe(200);
    });
  });
});