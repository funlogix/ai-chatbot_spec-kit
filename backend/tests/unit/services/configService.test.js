// backend/tests/unit/services/configService.test.js
const configService = require('../../../src/services/configService');

describe('Config Service', () => {
  describe('get and getAll', () => {
    it('should retrieve a specific configuration value', () => {
      const port = configService.get('port');
      expect(port).toBeDefined();
      expect(typeof port).toBe('number');
    });

    it('should retrieve all configuration values', () => {
      const allConfig = configService.getAll();
      expect(allConfig).toHaveProperty('port');
      expect(allConfig).toHaveProperty('environment');
      expect(allConfig).toHaveProperty('providers');
      expect(allConfig).toHaveProperty('jwtSecret');
      expect(allConfig).toHaveProperty('requestTimeout');
    });
  });

  describe('update', () => {
    it('should update a configuration value', () => {
      const originalValue = configService.get('testValue');
      expect(originalValue).toBeUndefined();
      
      const newValue = 'test';
      const updatedValue = configService.update('testValue', newValue);
      expect(updatedValue).toBe(newValue);
    });
  });

  describe('providers configuration', () => {
    it('should have configuration for all supported providers', () => {
      const allConfig = configService.getAll();
      const providers = allConfig.providers;
      
      expect(providers).toHaveProperty('openai');
      expect(providers).toHaveProperty('groq');
      expect(providers).toHaveProperty('gemini');
      expect(providers).toHaveProperty('openrouter');
    });
  });
});