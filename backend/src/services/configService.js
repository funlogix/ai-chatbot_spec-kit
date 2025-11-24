// backend/src/services/configService.js
const fs = require('fs').promises;
const path = require('path');

class ConfigService {
  constructor() {
    this.config = {
      // Server configuration
      port: process.env.PORT || 3000,
      environment: process.env.NODE_ENV || 'development',
      
      // Provider endpoints
      providers: {
        openai: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
        groq: process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1',
        gemini: process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
        openrouter: process.env.OPENROUTER_API_BASE_URL || 'https://openrouter.ai/api/v1',
      },
      
      // Security
      jwtSecret: process.env.JWT_SECRET || 'fallback_jwt_secret_for_dev',
      encryptionKey: process.env.ENCRYPTION_KEY || 'fallback_encryption_key_for_dev',
      
      // Rate limiting
      requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000, // 30 seconds
      maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 100,
      
      // Logging
      logLevel: process.env.LOG_LEVEL || 'info',
      enableMetrics: process.env.ENABLE_METRICS === 'true' || false,
    };
  }

  get(key) {
    return this.config[key];
  }

  getAll() {
    return { ...this.config };
  }

  update(key, value) {
    this.config[key] = value;
    return this.config[key];
  }

  async saveConfigToFile(filePath = './config.json') {
    try {
      const configPath = path.resolve(filePath);
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
      return { success: true, message: `Configuration saved to ${filePath}` };
    } catch (error) {
      console.error('Error saving config to file:', error);
      return { success: false, error: error.message };
    }
  }

  async loadConfigFromFile(filePath = './config.json') {
    try {
      const configPath = path.resolve(filePath);
      const fileContent = await fs.readFile(configPath, 'utf8');
      const loadedConfig = JSON.parse(fileContent);
      this.config = { ...this.config, ...loadedConfig };
      return { success: true, config: this.config };
    } catch (error) {
      console.error('Error loading config from file:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ConfigService();