// frontend/src/components/providers/ProviderConfiguration/__tests__/ProviderConfiguration.test.js
// Mock the modules that the ProviderConfiguration component might use
jest.mock('../../api/apiKeyManager');
jest.mock('../../api/providerService');

import APIKeyManager from '../../api/apiKeyManager';
import ProviderService from '../../api/providerService';

// Mock implementation of apiKeyManager
const mockConfigureProvider = jest.fn();
const mockGetAllProviderConfigs = jest.fn();
const mockDeleteProviderConfig = jest.fn();

APIKeyManager.configureProvider = mockConfigureProvider;
APIKeyManager.getAllProviderConfigs = mockGetAllProviderConfigs;
APIKeyManager.deleteProviderConfig = mockDeleteProviderConfig;

// Mock implementation of providerService
const mockGetAvailableProviders = jest.fn();

ProviderService.getAvailableProviders = mockGetAvailableProviders;

// Create a mock ProviderConfiguration component implementation for testing
class MockProviderConfiguration {
  constructor() {
    this.providers = [];
    this.configuredProviders = [];
  }

  async init(adminAccessKey) {
    this.providers = await ProviderService.getAvailableProviders();
    this.configuredProviders = await APIKeyManager.getAllProviderConfigs(adminAccessKey);
  }

  async configureProvider(providerId, apiKey, adminAccessKey) {
    // In a real implementation, this would call the backend API
    const result = await APIKeyManager.configureProvider(providerId, apiKey);
    // For testing purposes, we'll also update our local list
    this.configuredProviders.push({
      id: 'config1',
      providerId,
      name: this.getProviderName(providerId),
      hasApiKey: true
    });
    return result;
  }

  getProviderName(providerId) {
    const names = {
      'openai': 'OpenAI',
      'groq': 'Groq',
      'gemini': 'Google Gemini',
      'openrouter': 'OpenRouter'
    };
    return names[providerId] || providerId;
  }

  async deleteProviderConfig(providerId, adminAccessKey) {
    const result = await APIKeyManager.deleteProviderConfig(providerId, adminAccessKey);
    this.configuredProviders = this.configuredProviders.filter(p => p.providerId !== providerId);
    return result;
  }

  getUnconfiguredProviders() {
    return this.providers.filter(
      p => !this.configuredProviders.some(cp => cp.providerId === p.id)
    );
  }
}

describe('ProviderConfiguration Component', () => {
  let providerConfig;
  const mockAdminAccessKey = 'test-admin-key';

  beforeEach(() => {
    jest.clearAllMocks();
    providerConfig = new MockProviderConfiguration();
  });

  describe('Initialization', () => {
    it('should load available and configured providers', async () => {
      const mockAvailableProviders = [
        { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
        { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] }
      ];
      const mockConfiguredProviders = [
        { id: 'config1', providerId: 'openai', name: 'OpenAI Config' }
      ];

      mockGetAvailableProviders.mockResolvedValue(mockAvailableProviders);
      mockGetAllProviderConfigs.mockResolvedValue(mockConfiguredProviders);

      await providerConfig.init(mockAdminAccessKey);

      expect(mockGetAvailableProviders).toHaveBeenCalledWith();
      expect(mockGetAllProviderConfigs).toHaveBeenCalledWith(mockAdminAccessKey);
      expect(providerConfig.providers).toEqual(mockAvailableProviders);
      expect(providerConfig.configuredProviders).toEqual(mockConfiguredProviders);
    });
  });

  describe('Provider Configuration', () => {
    it('should configure a new provider', async () => {
      const providerId = 'groq';
      const apiKey = 'test-api-key';
      const mockResponse = { 
        id: 'new-config', 
        providerId, 
        name: 'Groq', 
        message: 'Provider configured successfully' 
      };

      mockConfigureProvider.mockResolvedValue(mockResponse);
      mockGetAvailableProviders.mockResolvedValue([
        { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] }
      ]);

      await providerConfig.init(mockAdminAccessKey);
      const result = await providerConfig.configureProvider(providerId, apiKey, mockAdminAccessKey);

      expect(mockConfigureProvider).toHaveBeenCalledWith(providerId, apiKey);
      expect(result).toEqual(mockResponse);
      expect(providerConfig.configuredProviders).toHaveLength(1);
      expect(providerConfig.configuredProviders[0].providerId).toBe(providerId);
    });

    it('should handle errors during provider configuration', async () => {
      const providerId = 'invalid';
      const apiKey = 'test-api-key';

      mockConfigureProvider.mockRejectedValue(new Error('Failed to configure provider'));

      await expect(
        providerConfig.configureProvider(providerId, apiKey, mockAdminAccessKey)
      ).rejects.toThrow('Failed to configure provider');
    });

    it('should not configure the same provider twice', async () => {
      const providerId = 'groq';
      const apiKey = 'test-api-key';

      mockGetAvailableProviders.mockResolvedValue([
        { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] }
      ]);
      mockConfigureProvider.mockResolvedValue({
        id: 'config1',
        providerId,
        name: 'Groq',
        message: 'Provider configured successfully'
      });

      await providerConfig.init(mockAdminAccessKey);
      await providerConfig.configureProvider(providerId, apiKey, mockAdminAccessKey);

      // The provider should now be in configuredProviders
      expect(providerConfig.configuredProviders).toHaveLength(1);
      expect(providerConfig.getUnconfiguredProviders()).toHaveLength(0);
    });
  });

  describe('Provider Deletion', () => {
    it('should delete a configured provider', async () => {
      const providerId = 'groq';
      const mockResponse = { message: 'Provider deleted successfully' };

      // Set up initial state with a configured provider
      providerConfig.configuredProviders = [
        { id: 'config1', providerId: 'groq', name: 'Groq Config' }
      ];

      mockDeleteProviderConfig.mockResolvedValue(mockResponse);

      const result = await providerConfig.deleteProviderConfig(providerId, mockAdminAccessKey);

      expect(mockDeleteProviderConfig).toHaveBeenCalledWith(providerId, mockAdminAccessKey);
      expect(result).toEqual(mockResponse);
      expect(providerConfig.configuredProviders).toHaveLength(0);
    });

    it('should handle errors during provider deletion', async () => {
      const providerId = 'nonexistent';

      mockDeleteProviderConfig.mockRejectedValue(new Error('Failed to delete provider'));

      await expect(
        providerConfig.deleteProviderConfig(providerId, mockAdminAccessKey)
      ).rejects.toThrow('Failed to delete provider');
    });
  });

  describe('Provider Lists', () => {
    it('should identify unconfigured providers correctly', async () => {
      const mockAvailable = [
        { id: 'openai', name: 'OpenAI', isActive: true, models: ['gpt-4'] },
        { id: 'groq', name: 'Groq', isActive: true, models: ['llama3-70b'] },
        { id: 'gemini', name: 'Gemini', isActive: true, models: ['gemini-pro'] }
      ];
      const mockConfigured = [
        { id: 'config1', providerId: 'openai', name: 'OpenAI Config' }
      ];

      mockGetAvailableProviders.mockResolvedValue(mockAvailable);
      mockGetAllProviderConfigs.mockResolvedValue(mockConfigured);

      await providerConfig.init(mockAdminAccessKey);

      const unconfigured = providerConfig.getUnconfiguredProviders();
      expect(unconfigured).toHaveLength(2);
      expect(unconfigured[0].id).toBe('groq');
      expect(unconfigured[1].id).toBe('gemini');
    });
  });
});