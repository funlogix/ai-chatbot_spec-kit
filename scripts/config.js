// Configuration constants for the application

const CONFIG = {
  // Groq API settings
  GROQ_API_BASE_URL: 'https://api.groq.com/openai/v1',
  GROQ_API_KEY: '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', // This should be set by the user in a secure way
  GROQ_DEFAULT_MODEL: 'openai/gpt-oss-120b',  // Default model for chat functionality
  
  // API Limits and Settings
  GROQ_RATE_LIMIT_RPM: 30,    // Requests per minute
  GROQ_RATE_LIMIT_RPD: 1000,  // Requests per day
  GROQ_TOKEN_LIMIT_TPM: 8000, // Tokens per minute
  GROQ_TOKEN_LIMIT_TPD: 200000, // Tokens per day
  
  // Voice processing limits
  VOICE_RATE_LIMIT_RPM: 20,    // Requests per minute for voice
  VOICE_RATE_LIMIT_RPD: 2000,  // Requests per day for voice
  VOICE_AUDIO_LIMIT_ASH: 7200, // Audio seconds per hour
  VOICE_AUDIO_LIMIT_ASD: 28800, // Audio seconds per day
  
  // Performance goals
  TEXT_RESPONSE_TIMEOUT: 5000,  // 5 seconds for text responses
  VOICE_RESPONSE_TIMEOUT: 3000, // 3 seconds for voice responses
  VOICE_ACCURACY_THRESHOLD: 0.85, // 85% accuracy threshold for voice input
  
  // UI Settings
  MAX_MESSAGE_LENGTH: 2000,    // Maximum length of messages
  MAX_CONVERSATION_MESSAGES: 100, // Maximum messages in conversation
  MESSAGE_AUTO_SCROLL: true,   // Auto-scroll to new messages
  
  // Accessibility
  WCAG_LEVEL: 'AA',            // Target WCAG compliance level
  
  // Voice settings
  VOICE_DEFAULT_RATE: 1.0,
  VOICE_DEFAULT_PITCH: 1.0,
  VOICE_DEFAULT_VOLUME: 1.0,
  VOICE_DEFAULT_LANGUAGE: 'en-US',
  
  // Error handling
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000,      // Base delay in ms for retries
};

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}