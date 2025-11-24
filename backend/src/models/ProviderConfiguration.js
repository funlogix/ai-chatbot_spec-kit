// backend/src/models/ProviderConfiguration.js
class ProviderConfiguration {
  constructor({
    id,
    providerId,
    name,
    endpoint,
    apiKeyId,
    config,
    isActive,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.providerId = providerId;
    this.name = name;
    this.endpoint = endpoint;
    this.apiKeyId = apiKeyId;
    this.config = config || {};
    this.isActive = isActive !== undefined ? isActive : true;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  static validate(data) {
    const required = ['providerId', 'name', 'endpoint'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (typeof data.providerId !== 'string' || data.providerId.trim().length === 0) {
      throw new Error('providerId must be a non-empty string');
    }
    
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new Error('name must be a non-empty string');
    }
    
    if (typeof data.endpoint !== 'string' || !data.endpoint.startsWith('http')) {
      throw new Error('endpoint must be a valid URL string');
    }

    return true;
  }
}

module.exports = ProviderConfiguration;