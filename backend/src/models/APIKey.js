// backend/src/models/APIKey.js
class APIKey {
  constructor({ id, providerId, encryptedKey, createdAt, updatedAt, lastUsedAt }) {
    this.id = id;
    this.providerId = providerId;
    this.encryptedKey = encryptedKey;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
    this.lastUsedAt = lastUsedAt || null;
  }

  static validate(data) {
    const required = ['providerId', 'encryptedKey'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (typeof data.providerId !== 'string' || data.providerId.trim().length === 0) {
      throw new Error('providerId must be a non-empty string');
    }
    
    if (typeof data.encryptedKey !== 'string' || data.encryptedKey.length < 10) {
      throw new Error('encryptedKey must be a string with minimum length of 10 characters');
    }

    return true;
  }
}

module.exports = APIKey;