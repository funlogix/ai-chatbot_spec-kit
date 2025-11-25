// backend/src/controllers/apiKeyController.js
const crypto = require('crypto');
const APIKey = require('../models/APIKey');

// In-memory storage for API keys (in production, this would be a database)
let apiKeys = new Map();

// Generate a unique ID for API keys
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

// Import the encryption functions from the utility
const { encryptApiKey: utilEncryptApiKey, decryptApiKey: utilDecryptApiKey } = require('../utils/encryptionUtil');

// Wrapper functions for compatibility
function encryptApiKey(apiKey, encryptionKey) {
  return utilEncryptApiKey(apiKey, encryptionKey);
}

function decryptApiKey(encryptedApiKey, iv, encryptionKey) {
  return utilDecryptApiKey(encryptedApiKey, iv, encryptionKey);
}

const APIKeyController = {
  // Create or update an API key
  async createApiKey(req, res) {
    try {
      const { providerId, apiKey } = req.body;

      if (!providerId || !apiKey) {
        return res.status(400).json({ error: 'providerId and apiKey are required' });
      }

      // Validate the input
      try {
        APIKey.validate({ providerId, encryptedKey: apiKey });
      } catch (validationError) {
        return res.status(400).json({ error: validationError.message });
      }

      // Encrypt the API key before storing
      const encryptionKey = process.env.ENCRYPTION_KEY || '32_character_encryption_key_here'; // Use the same key as in .env
      if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === '32_character_encryption_key_here') {
        return res.status(500).json({
          error: 'Encryption key not properly configured. Set ENCRYPTION_KEY in your environment variables.'
        });
      }

      try {
        const { encrypted, iv } = encryptApiKey(apiKey, encryptionKey);

        const id = generateId();
        const newApiKey = new APIKey({
          id,
          providerId,
          encryptedKey: JSON.stringify({ encrypted, iv }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        apiKeys.set(id, newApiKey);

        // Return success response without exposing the actual API key
        res.status(201).json({
          id: newApiKey.id,
          providerId: newApiKey.providerId,
          createdAt: newApiKey.createdAt,
          updatedAt: newApiKey.updatedAt,
          message: 'API key configured successfully'
        });
      } catch (encryptError) {
        console.error('Encryption error:', encryptError);
        return res.status(500).json({ error: 'Error encrypting API key' });
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  },

  // Get all API keys (without the actual keys for security)
  async getAllApiKeys(req, res) {
    try {
      const keys = Array.from(apiKeys.values()).map(key => ({
        id: key.id,
        providerId: key.providerId,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
        lastUsedAt: key.lastUsedAt
      }));
      
      res.json({ apiKeys: keys });
    } catch (error) {
      console.error('Error getting API keys:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Get a specific API key by ID (without the actual key for security)
  async getApiKeyById(req, res) {
    try {
      const { id } = req.params;
      
      const apiKey = apiKeys.get(id);
      if (!apiKey) {
        return res.status(404).json({ error: 'API key not found' });
      }
      
      res.json({
        id: apiKey.id,
        providerId: apiKey.providerId,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        lastUsedAt: apiKey.lastUsedAt
      });
    } catch (error) {
      console.error('Error getting API key by ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Update an API key
  async updateApiKey(req, res) {
    try {
      const { id } = req.params;
      const { providerId, apiKey } = req.body;
      
      const existingKey = apiKeys.get(id);
      if (!existingKey) {
        return res.status(404).json({ error: 'API key not found' });
      }

      // If a new API key is provided, encrypt it
      let encryptedKey = existingKey.encryptedKey;
      if (apiKey) {
        const encryptionKey = process.env.ENCRYPTION_KEY || 'fallback_encryption_key';
        const { encrypted, iv } = encryptApiKey(apiKey, encryptionKey);
        encryptedKey = JSON.stringify({ encrypted, iv });
      }

      // Update the key
      const updatedKey = new APIKey({
        id: existingKey.id,
        providerId: providerId || existingKey.providerId,
        encryptedKey,
        createdAt: existingKey.createdAt,
        updatedAt: new Date().toISOString()
      });

      apiKeys.set(id, updatedKey);
      
      res.json({
        id: updatedKey.id,
        providerId: updatedKey.providerId,
        createdAt: updatedKey.createdAt,
        updatedAt: updatedKey.updatedAt,
        message: 'API key updated successfully'
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete an API key
  async deleteApiKey(req, res) {
    try {
      const { id } = req.params;
      
      if (!apiKeys.has(id)) {
        return res.status(404).json({ error: 'API key not found' });
      }
      
      apiKeys.delete(id);
      res.json({ message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Error deleting API key:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Validate an API key (for internal use)
  validateApiKey: (providerId, apiKey) => {
    for (const [id, key] of apiKeys) {
      if (key.providerId === providerId) {
        // In a real implementation, we would decrypt and verify the key
        // For now, we just return the key ID if one exists for the provider
        return key;
      }
    }
    return null;
  }
};

module.exports = APIKeyController;