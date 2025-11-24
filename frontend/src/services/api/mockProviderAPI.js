/**
 * Mock Provider API
 * Simulates backend API endpoints for provider management
 * In a real implementation, these would be actual backend endpoints
 */

// Store for providers (in memory for this mock implementation)
let providers = [
  {
    providerId: 'groq:https://api.groq.com',
    providerName: 'Groq',
    endpoint: 'https://api.groq.com',
    models: [
      { modelId: 'llama3-8b-8192', modelName: 'Llama 3 8B', capabilities: ['text-generation'] },
      { modelId: 'llama3-70b-8192', modelName: 'Llama 3 70B', capabilities: ['text-generation'] },
      { modelId: 'mixtral-8x7b-32768', modelName: 'Mixtral 8x7B', capabilities: ['text-generation'] }
    ],
    rateLimit: { requestsPerMinute: 30, requestsPerDay: 1000 },
    tier: 'free',
    isActive: true,
    createdAt: '2025-11-23T10:00:00Z',
    updatedAt: '2025-11-23T10:00:00Z'
  },
  {
    providerId: 'openai:https://api.openai.com',
    providerName: 'OpenAI',
    endpoint: 'https://api.openai.com',
    models: [
      { modelId: 'gpt-4-turbo', modelName: 'GPT-4 Turbo', capabilities: ['text-generation', 'reasoning'] },
      { modelId: 'gpt-4', modelName: 'GPT-4', capabilities: ['text-generation', 'reasoning'] },
      { modelId: 'gpt-3.5-turbo', modelName: 'GPT-3.5 Turbo', capabilities: ['text-generation'] }
    ],
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 200 },
    tier: 'paid',
    isActive: true,
    createdAt: '2025-11-23T10:00:00Z',
    updatedAt: '2025-11-23T10:00:00Z'
  },
  {
    providerId: 'gemini:https://generativelanguage.googleapis.com',
    providerName: 'Gemini',
    endpoint: 'https://generativelanguage.googleapis.com',
    models: [
      { modelId: 'gemini-2.5-flash', modelName: 'Gemini 2.5 Flash', capabilities: ['text-generation', 'multimodal'] },
      { modelId: 'gemini-pro', modelName: 'Gemini Pro', capabilities: ['text-generation', 'multimodal'] }
    ],
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 250 },
    tier: 'free',
    isActive: true,
    createdAt: '2025-11-23T10:00:00Z',
    updatedAt: '2025-11-23T10:00:00Z'
  },
  {
    providerId: 'openrouter:https://openrouter.ai',
    providerName: 'OpenRouter',
    endpoint: 'https://openrouter.ai',
    models: [
      { modelId: 'z-ai/glm-4.5-air:free', modelName: 'GLM-4.5-Air (Free)', capabilities: ['text-generation'] },
      { modelId: 'x-ai/grok-4.1-fast:free', modelName: 'Grok-4.1-Fast (Free)', capabilities: ['text-generation'] }
    ],
    rateLimit: { requestsPerMinute: 20, requestsPerDay: 50 },
    tier: 'free',
    isActive: true,
    createdAt: '2025-11-23T10:00:00Z',
    updatedAt: '2025-11-23T10:00:00Z'
  }
];

// In-memory storage for user selections
let userSelections = {};

// Mock rate limiting storage
let rateLimiting = {};

/**
 * Get all available providers
 * Endpoint: GET /api/providers/available
 */
async function getAvailableProviders() {
  // Filter only active providers
  const activeProviders = providers.filter(provider => provider.isActive);
  return Promise.resolve(activeProviders);
}

/**
 * Select a provider for the current user
 * Endpoint: POST /api/provider/select
 */
async function selectProvider(requestData) {
  const { providerId, modelId } = requestData;
  
  if (!providerId) {
    throw new Error('Provider ID is required');
  }
  
  // Verify the provider exists and is active
  const provider = providers.find(p => p.providerId === providerId);
  if (!provider || !provider.isActive) {
    throw new Error(`Provider with ID ${providerId} not found or inactive`);
  }
  
  // Check if a model ID is provided and validate it
  if (modelId) {
    const model = provider.models.find(m => m.modelId === modelId);
    if (!model) {
      throw new Error(`Model with ID ${modelId} not available for provider ${providerId}`);
    }
  }
  
  // Store user's selection
  // In this mock, we'll use a placeholder user ID
  const userId = getMockUserId(); // In real app, this would come from auth
  userSelections[userId] = { providerId, modelId, timestamp: new Date().toISOString() };
  
  return Promise.resolve({
    success: true,
    providerId,
    modelId,
    message: 'Provider selected successfully'
  });
}

/**
 * Get provider status
 * Endpoint: GET /api/provider/{providerId}/status
 */
async function getProviderStatus(providerId) {
  if (!providerId) {
    throw new Error('Provider ID is required');
  }
  
  const provider = providers.find(p => p.providerId === providerId);
  
  if (!provider) {
    throw new Error(`Provider with ID ${providerId} not found`);
  }
  
  // Simulate checking if the provider is accessible
  // In a real implementation, this might make an actual API call to verify
  const canConnect = Math.random() > 0.1; // 90% chance of being connectable
  
  return Promise.resolve({
    providerId,
    isActive: provider.isActive,
    canConnect,
    lastChecked: new Date().toISOString()
  });
}

/**
 * Get rate limits for all providers
 * Endpoint: GET /api/providers/rate-limits
 */
async function getRateLimits() {
  const result = {};
  
  for (const provider of providers) {
    // Retrieve or initialize rate limit data for this provider
    if (!rateLimiting[provider.providerId]) {
      rateLimiting[provider.providerId] = {
        currentRequestsPerMinute: 0,
        currentRequestsPerDay: 0,
        lastResetMinute: new Date(),
        lastResetDay: new Date()
      };
    }
    
    const tracking = rateLimiting[provider.providerId];
    
    // Calculate remaining requests
    const remainingPerMinute = provider.rateLimit.requestsPerMinute - tracking.currentRequestsPerMinute;
    const remainingPerDay = provider.rateLimit.requestsPerDay - tracking.currentRequestsPerDay;
    
    result[provider.providerId] = {
      providerId: provider.providerId,
      currentRequestsPerMinute: tracking.currentRequestsPerMinute,
      currentRequestsPerDay: tracking.currentRequestsPerDay,
      remainingRequestsPerMinute: Math.max(0, remainingPerMinute),
      remainingRequestsPerDay: Math.max(0, remainingPerDay),
      resetTime: new Date(tracking.lastResetMinute.getTime() + 60000).toISOString() // Next minute
    };
  }
  
  return Promise.resolve(result);
}

/**
 * Helper function to get a mock user ID
 * In a real app, this would come from the authentication system
 */
function getMockUserId() {
  // In a real implementation, this would come from an authentication token
  return localStorage.getItem('mockUserId') || 'user-123';
}

/**
 * Record an API request for rate limiting
 * Simulates what would happen in the backend
 */
async function recordAPIRequest(providerId) {
  if (!rateLimiting[providerId]) {
    rateLimiting[providerId] = {
      currentRequestsPerMinute: 0,
      currentRequestsPerDay: 0,
      lastResetMinute: new Date(),
      lastResetDay: new Date()
    };
  }
  
  const tracking = rateLimiting[providerId];
  const now = new Date();
  
  // Update request counts
  tracking.currentRequestsPerMinute++;
  tracking.currentRequestsPerDay++;
  
  return Promise.resolve();
}

// Export the mock API functions
export {
  getAvailableProviders,
  selectProvider,
  getProviderStatus,
  getRateLimits,
  recordAPIRequest
};

// Export the main object as default with all functions
export default {
  getAvailableProviders,
  selectProvider,
  getProviderStatus,
  getRateLimits,
  recordAPIRequest
};