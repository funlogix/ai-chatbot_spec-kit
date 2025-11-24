// backend/tests/unit/services/providerService.test.js
const providerService = require('../../../src/services/providerService');

describe('Provider Service', () => {
  describe('getAllProviders', () => {
    it('should return a list of providers', () => {
      const providers = providerService.getAllProviders();
      
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
      
      // Check that each provider has the required properties
      providers.forEach(provider => {
        expect(provider).toHaveProperty('id');
        expect(provider).toHaveProperty('providerId');
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('endpoint');
        expect(provider).toHaveProperty('config');
        expect(provider).toHaveProperty('isActive');
      });
    });
  });

  describe('getProviderById', () => {
    it('should return a provider when it exists', () => {
      const provider = providerService.getProviderById('openai');
      
      expect(provider).toHaveProperty('providerId', 'openai');
      expect(provider).toHaveProperty('name', 'OpenAI');
    });

    it('should return null when provider does not exist', () => {
      const provider = providerService.getProviderById('nonexistent-provider');
      
      expect(provider).toBeNull();
    });
  });

  describe('getProviderStatus', () => {
    it('should return status for a valid provider', async () => {
      const status = await providerService.getProviderStatus('groq');
      
      expect(status).toHaveProperty('id', 'groq');
      expect(status).toHaveProperty('name');
      expect(status).toHaveProperty('available');
    });

    it('should throw an error for a non-existent provider', async () => {
      await expect(providerService.getProviderStatus('nonexistent')).rejects.toThrow(
        'Provider with ID nonexistent not found'
      );
    });
  });

  describe('getAllProviderStatuses', () => {
    it('should return statuses for all providers', async () => {
      const statuses = await providerService.getAllProviderStatuses();
      
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
      
      // Check that each status has the required properties
      statuses.forEach(status => {
        expect(status).toHaveProperty('id');
        expect(status).toHaveProperty('name');
        expect(status).toHaveProperty('available');
      });
    });
  });
});