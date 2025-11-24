// backend/src/services/providerService.js
const crypto = require('crypto');
const ProviderConfiguration = require('../models/ProviderConfiguration');
const apiKeyController = require('../controllers/apiKeyController');

// In-memory storage for providers (in production, this would be a database)
let providers = new Map();

class ProviderService {
  constructor() {
    // Initialize with some default providers
    this.initializeDefaultProviders();
  }

  // Initialize default providers
  initializeDefaultProviders() {
    const defaultProviders = [
      {
        id: 'openai',
        name: 'OpenAI',
        endpoint: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
        config: {
          models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
          defaultModel: 'gpt-4'
        }
      },
      {
        id: 'groq',
        name: 'Groq',
        endpoint: process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1',
        config: {
          models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'],
          defaultModel: 'llama3-70b-8192'
        }
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        endpoint: process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
        config: {
          models: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
          defaultModel: 'gemini-pro'
        }
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        endpoint: process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1',
        config: {
          models: ['openchat/openchat-7b', 'nousresearch/nous-hermes-llama2-13b'],
          defaultModel: 'openchat/openchat-7b'
        }
      }
    ];

    defaultProviders.forEach(provider => {
      const id = crypto.randomUUID();
      const providerConfig = new ProviderConfiguration({
        id,
        providerId: provider.id,
        name: provider.name,
        endpoint: provider.endpoint,
        config: provider.config,
        isActive: true
      });
      
      providers.set(providerConfig.id, providerConfig);
    });
  }

  // Get all available providers
  getAllProviders() {
    return Array.from(providers.values()).map(provider => ({
      id: provider.id,
      providerId: provider.providerId,
      name: provider.name,
      endpoint: provider.endpoint,
      config: provider.config,
      isActive: provider.isActive
    }));
  }

  // Get a provider by ID
  getProviderById(providerId) {
    for (const [id, provider] of providers) {
      if (provider.providerId === providerId) {
        return {
          id: provider.id,
          providerId: provider.providerId,
          name: provider.name,
          endpoint: provider.endpoint,
          config: provider.config,
          isActive: provider.isActive
        };
      }
    }
    return null;
  }

  // Check if a provider is available (has API key and is active)
  async isProviderAvailable(providerId) {
    // Check if the provider exists and is active
    const provider = this.getProviderById(providerId);
    if (!provider || !provider.isActive) {
      return { available: false, reason: 'Provider not active' };
    }

    // Check if an API key exists for this provider
    const apiKey = apiKeyController.validateApiKey(providerId, null);
    if (!apiKey) {
      return { available: false, reason: 'API key not configured' };
    }

    // In a real implementation, you might make a test request to the provider API
    // to verify it's actually accessible
    
    return { available: true, reason: 'Provider is ready to use' };
  }

  // Update provider status (active/inactive)
  async updateProviderStatus(providerId, isActive) {
    for (const [id, provider] of providers) {
      if (provider.providerId === providerId) {
        const updatedProvider = new ProviderConfiguration({
          id: provider.id,
          providerId: provider.providerId,
          name: provider.name,
          endpoint: provider.endpoint,
          apiKeyId: provider.apiKeyId,
          config: provider.config,
          isActive: isActive,
          createdAt: provider.createdAt,
          updatedAt: new Date().toISOString()
        });
        
        providers.set(id, updatedProvider);
        
        return {
          id: updatedProvider.id,
          providerId: updatedProvider.providerId,
          name: updatedProvider.name,
          endpoint: updatedProvider.endpoint,
          config: updatedProvider.config,
          isActive: updatedProvider.isActive,
          message: `Provider ${providerId} ${isActive ? 'activated' : 'deactivated'}`
        };
      }
    }
    
    throw new Error(`Provider with ID ${providerId} not found`);
  }

  // Get provider status information
  async getProviderStatus(providerId) {
    const provider = this.getProviderById(providerId);
    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found`);
    }

    const availability = await this.isProviderAvailable(providerId);
    
    return {
      id: provider.providerId,
      name: provider.name,
      endpoint: provider.endpoint,
      isActive: provider.isActive,
      available: availability.available,
      reason: availability.reason,
      config: provider.config,
      hasApiKey: apiKeyController.validateApiKey(providerId, null) !== null
    };
  }

  // Get all provider statuses
  async getAllProviderStatuses() {
    const allProviders = this.getAllProviders();
    const statuses = [];
    
    for (const provider of allProviders) {
      try {
        const status = await this.getProviderStatus(provider.providerId);
        statuses.push(status);
      } catch (error) {
        statuses.push({
          id: provider.providerId,
          name: provider.name,
          available: false,
          reason: error.message
        });
      }
    }
    
    return statuses;
  }
}

module.exports = new ProviderService();