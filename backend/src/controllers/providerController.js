// backend/src/controllers/providerController.js
const crypto = require('crypto');
const ProviderConfiguration = require('../models/ProviderConfiguration');
const APIKey = require('../models/APIKey');
const apiKeyController = require('./apiKeyController');

// In-memory storage for provider configurations (in production, this would be a database)
let providerConfigs = new Map();

// Generate a unique ID for providers
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

const ProviderController = {
  // Get all available providers
  async getAvailableProviders(req, res) {
    try {
      // Define the supported providers with their basic information
      const providers = [
        {
          id: 'openai',
          name: 'OpenAI',
          description: 'OpenAI provides GPT-4, GPT-3.5 and other advanced language models',
          dataPrivacyUrl: 'https://openai.com/policies/privacy-policy',
          models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
          isActive: true
        },
        {
          id: 'groq',
          name: 'Groq',
          description: 'Groq provides fast inference for Llama 3, Mixtral and other high-speed models',
          dataPrivacyUrl: 'https://www.groq.com/privacy-policy',
          models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'],
          isActive: true
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          description: 'Google\'s Gemini provides advanced multimodal AI capabilities',
          dataPrivacyUrl: 'https://policies.google.com/privacy',
          models: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
          isActive: true
        },
        {
          id: 'openrouter',
          name: 'OpenRouter',
          description: 'OpenRouter provides access to various open-source and commercial models',
          dataPrivacyUrl: 'https://openrouter.ai/privacy',
          models: ['openchat/openchat-7b', 'nousresearch/nous-hermes-llama2-13b', 'microsoft/wizardlm-2-8x22b'],
          isActive: true
        }
      ];

      res.json({ providers });
    } catch (error) {
      console.error('Error getting available providers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get provider status
  async getProviderStatus(req, res) {
    try {
      const { providerId } = req.params;
      
      // Check if the provider exists in our available providers
      const allProviders = [
        { id: 'openai', name: 'OpenAI' },
        { id: 'groq', name: 'Groq' },
        { id: 'gemini', name: 'Google Gemini' },
        { id: 'openrouter', name: 'OpenRouter' }
      ];
      
      const provider = allProviders.find(p => p.id === providerId);
      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      
      // Check if the provider has a configured API key
      const apiKey = apiKeyController.validateApiKey(providerId, null);
      const hasApiKey = !!apiKey;
      
      // In a real implementation, you would make a test request to the provider API
      // to check its actual status
      res.json({
        id: providerId,
        name: provider.name,
        status: hasApiKey ? 'available' : 'missing_api_key',
        hasApiKey,
        message: hasApiKey ? 'Provider is available to use' : 'API key needs to be configured to use this provider'
      });
    } catch (error) {
      console.error('Error getting provider status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Configure a provider with API key and settings
  async configureProvider(req, res) {
    try {
      const { 
        providerId, 
        name, 
        endpoint, 
        apiKey, 
        config 
      } = req.body;
      
      if (!providerId || !name || !endpoint || !apiKey) {
        return res.status(400).json({ 
          error: 'providerId, name, endpoint, and apiKey are required' 
        });
      }

      // Validate the provider configuration
      try {
        ProviderConfiguration.validate({ 
          providerId, 
          name, 
          endpoint, 
          config 
        });
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }

      // Create or update the API key for this provider
      const mockApiKeyRequest = {
        body: { providerId, apiKey },
        // We need to mock the response object to capture the result
      };
      const mockApiKeyResponse = {
        status: (code) => {
          mockApiKeyResponse.statusCode = code;
          return mockApiKeyResponse;
        },
        json: (data) => {
          mockApiKeyResponse.data = data;
        }
      };

      await apiKeyController.createApiKey(mockApiKeyRequest, mockApiKeyResponse);

      if (mockApiKeyResponse.statusCode !== 201) {
        return res.status(mockApiKeyResponse.statusCode).json(mockApiKeyResponse.data);
      }

      const apiKeyId = mockApiKeyResponse.data.id;

      // Generate a new ID for the provider configuration
      const id = generateId();
      const newProviderConfig = new ProviderConfiguration({
        id,
        providerId,
        name,
        endpoint,
        apiKeyId: apiKeyId,
        config: config || {},
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      providerConfigs.set(id, newProviderConfig);
      
      res.status(201).json({
        id: newProviderConfig.id,
        providerId: newProviderConfig.providerId,
        name: newProviderConfig.name,
        endpoint: newProviderConfig.endpoint,
        config: newProviderConfig.config,
        isActive: newProviderConfig.isActive,
        createdAt: newProviderConfig.createdAt,
        updatedAt: newProviderConfig.updatedAt,
        message: 'Provider configured successfully'
      });
    } catch (error) {
      console.error('Error configuring provider:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get all provider configurations
  async getAllProviderConfigs(req, res) {
    try {
      const configs = Array.from(providerConfigs.values()).map(config => ({
        id: config.id,
        providerId: config.providerId,
        name: config.name,
        endpoint: config.endpoint,
        config: config.config,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }));
      
      res.json({ providers: configs });
    } catch (error) {
      console.error('Error getting provider configurations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get a specific provider configuration
  async getProviderConfigById(req, res) {
    try {
      const { id } = req.params;
      
      const config = providerConfigs.get(id);
      if (!config) {
        return res.status(404).json({ error: 'Provider configuration not found' });
      }
      
      res.json({
        id: config.id,
        providerId: config.providerId,
        name: config.name,
        endpoint: config.endpoint,
        config: config.config,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      });
    } catch (error) {
      console.error('Error getting provider configuration by ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update a provider configuration
  async updateProviderConfig(req, res) {
    try {
      const { id } = req.params;
      const { name, endpoint, config, isActive } = req.body;
      
      const existingConfig = providerConfigs.get(id);
      if (!existingConfig) {
        return res.status(404).json({ error: 'Provider configuration not found' });
      }

      // Update the configuration
      const updatedConfig = new ProviderConfiguration({
        id: existingConfig.id,
        providerId: existingConfig.providerId,
        name: name || existingConfig.name,
        endpoint: endpoint || existingConfig.endpoint,
        apiKeyId: existingConfig.apiKeyId,
        config: config || existingConfig.config,
        isActive: isActive !== undefined ? isActive : existingConfig.isActive,
        createdAt: existingConfig.createdAt,
        updatedAt: new Date().toISOString()
      });

      providerConfigs.set(id, updatedConfig);
      
      res.json({
        id: updatedConfig.id,
        providerId: updatedConfig.providerId,
        name: updatedConfig.name,
        endpoint: updatedConfig.endpoint,
        config: updatedConfig.config,
        isActive: updatedConfig.isActive,
        createdAt: updatedConfig.createdAt,
        updatedAt: updatedConfig.updatedAt,
        message: 'Provider configuration updated successfully'
      });
    } catch (error) {
      console.error('Error updating provider configuration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete a provider configuration
  async deleteProviderConfig(req, res) {
    try {
      const { id } = req.params;
      
      if (!providerConfigs.has(id)) {
        return res.status(404).json({ error: 'Provider configuration not found' });
      }
      
      const config = providerConfigs.get(id);
      providerConfigs.delete(id);
      
      // Also remove the associated API key
      // Note: In a real implementation, you might want to be more selective about
      // whether to remove the API key if it's used by other configurations
      
      res.json({ 
        message: `Provider configuration for ${config.name} deleted successfully` 
      });
    } catch (error) {
      console.error('Error deleting provider configuration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Select a provider for use (this would update user preferences in a real implementation)
  async selectProvider(req, res) {
    try {
      const { providerId } = req.body;
      
      if (!providerId) {
        return res.status(400).json({ error: 'providerId is required' });
      }

      // In a real implementation, this would update the user's selected provider
      // in their preferences. For now, we'll just validate that the provider exists
      // and has an API key configured.
      
      // Check if the provider exists and has an API key
      let providerExists = false;
      let hasApiKey = false;
      
      for (const [id, config] of providerConfigs) {
        if (config.providerId === providerId) {
          providerExists = true;
          // Check if there's an API key for this provider
          const apiKey = apiKeyController.validateApiKey(providerId, null);
          hasApiKey = !!apiKey;
          break;
        }
      }
      
      if (!providerExists) {
        return res.status(404).json({ error: 'Provider not found' });
      }
      
      if (!hasApiKey) {
        return res.status(400).json({ error: 'API key not configured for this provider' });
      }
      
      res.json({
        providerId,
        message: `Provider ${providerId} selected successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error selecting provider:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = ProviderController;