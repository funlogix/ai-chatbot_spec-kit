// frontend/src/components/providers/ProviderConfiguration/__tests__/ProviderConfiguration.unit.test.js
// Mock the modules that the ProviderConfiguration component might use
jest.mock('../../../../services/auth/apiKeyManager');
jest.mock('../../../../services/api/providerService');

import APIKeyManager from '../../../../services/auth/apiKeyManager.js';
import ProviderService from '../../../../services/api/providerService.js';
import ProviderConfiguration from '../index.js';

describe('ProviderConfiguration Component Unit Tests', () => {
  let container;
  let providerConfig;

  beforeEach(() => {
    // Create a container element for testing
    container = document.createElement('div');
    container.id = 'provider-configuration-container';
    document.body.appendChild(container);

    // Reset all mocks
    jest.clearAllMocks();

    // Initialize the component with a container ID
    providerConfig = new ProviderConfiguration('provider-configuration-container', {
      // Add any required options here
    });
  });

  afterEach(() => {
    // Clean up DOM after each test
    document.body.innerHTML = '';
  });

  test('should render the configuration UI elements correctly', () => {
    // Test the initial rendering of the component
    const configContainer = document.getElementById('provider-configuration-container');
    expect(configContainer).toBeInTheDocument();
    
    // Verify that the expected UI elements are present
    const configHeading = configContainer.querySelector('h2');
    if (configHeading) {
      expect(configHeading.textContent).toContain('Configuration');
    }
    
    // Check for provider configuration form elements
    const configForm = configContainer.querySelector('#provider-config-form');
    if (configForm) {
      expect(configForm).toBeInTheDocument();
      expect(configForm.querySelector('#provider-select')).toBeInTheDocument();
      expect(configForm.querySelector('#api-key-input')).toBeInTheDocument();
      expect(configForm.querySelector('#save-config-btn')).toBeInTheDocument();
    }
  });

  test('should handle provider configuration properly', async () => {
    // Mock successful API key configuration
    const mockConfigureResult = {
      id: 'config123',
      providerId: 'openai',
      message: 'Provider configured successfully'
    };

    jest.spyOn(APIKeyManager, 'configureProvider')
      .mockResolvedValue(mockConfigureResult);

    // Test the configuration functionality
    const result = await providerConfig.configureProvider('openai', 'test-api-key');
    
    expect(APIKeyManager.configureProvider).toHaveBeenCalledWith(
      'openai',
      'test-api-key'
    );
    expect(result).toEqual(mockConfigureResult);
  });

  test('should handle errors during provider configuration', async () => {
    // Mock an error during API key configuration
    const errorMessage = 'Failed to configure provider';
    jest.spyOn(APIKeyManager, 'configureProvider')
      .mockRejectedValue(new Error(errorMessage));

    await expect(
      providerConfig.configureProvider('invalid-provider', 'invalid-key')
    ).rejects.toThrow(errorMessage);

    expect(APIKeyManager.configureProvider).toHaveBeenCalledWith(
      'invalid-provider',
      'invalid-key'
    );
  });

  test('should validate provider ID and API key', () => {
    // Test validation of provider ID
    expect(() => {
      providerConfig.validateInput('', 'some-key');
    }).toThrow('Provider ID is required');

    expect(() => {
      providerConfig.validateInput('openai', '');
    }).toThrow('API key is required');

    expect(() => {
      providerConfig.validateInput('openai', 'short');
    }).toThrow('API key must be at least 10 characters long');

    // Valid inputs should not throw
    expect(() => {
      providerConfig.validateInput('openai', 'valid-api-key-12345');
    }).not.toThrow();
  });

  test('should handle provider deletion', async () => {
    // Mock successful provider deletion
    const mockDeleteResult = { message: 'Provider configuration deleted successfully' };
    
    jest.spyOn(APIKeyManager, 'deleteProviderConfig')
      .mockResolvedValue(mockDeleteResult);

    const result = await providerConfig.deleteProviderConfig('openai', 'admin-key');
    
    expect(APIKeyManager.deleteProviderConfig).toHaveBeenCalledWith(
      'openai',
      'admin-key'
    );
    expect(result).toEqual(mockDeleteResult);
  });

  test('should handle errors during provider deletion', async () => {
    // Mock an error during provider deletion
    const errorMessage = 'Provider configuration not found';
    
    jest.spyOn(APIKeyManager, 'deleteProviderConfig')
      .mockRejectedValue(new Error(errorMessage));

    await expect(
      providerConfig.deleteProviderConfig('nonexistent', 'admin-key')
    ).rejects.toThrow(errorMessage);

    expect(APIKeyManager.deleteProviderConfig).toHaveBeenCalledWith(
      'nonexistent',
      'admin-key'
    );
  });

  test('should get all provider configurations', async () => {
    // Mock getting all provider configurations
    const mockConfigs = [
      { id: 'config1', providerId: 'openai', name: 'OpenAI Config', isActive: true },
      { id: 'config2', providerId: 'groq', name: 'Groq Config', isActive: true }
    ];
    
    jest.spyOn(ProviderService, 'getAllProviderConfigs')
      .mockResolvedValue(mockConfigs);

    const configs = await providerConfig.getAllProviderConfigs('admin-key');
    
    expect(ProviderService.getAllProviderConfigs).toHaveBeenCalledWith('admin-key');
    expect(configs).toEqual(mockConfigs);
  });

  test('should handle errors when getting provider configurations', async () => {
    // Mock an error when getting provider configurations
    const errorMessage = 'Admin access required';
    
    jest.spyOn(ProviderService, 'getAllProviderConfigs')
      .mockRejectedValue(new Error(errorMessage));

    await expect(
      providerConfig.getAllProviderConfigs('invalid-key')
    ).rejects.toThrow(errorMessage);

    expect(ProviderService.getAllProviderConfigs).toHaveBeenCalledWith('invalid-key');
  });

  test('should render error messages appropriately', () => {
    const errorMessage = 'Test error message';
    
    // Call the method to show error
    providerConfig.showError(errorMessage);

    // Check if error message is displayed
    const errorDisplay = document.querySelector('.error-message');
    if (errorDisplay) {
      expect(errorDisplay.textContent).toContain(errorMessage);
    }
  });
});