// Configuration constants for the frontend application

const CONFIG = {
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

  // Response timeouts
  TEXT_RESPONSE_TIMEOUT: 5000,  // 5 seconds for text responses
  VOICE_RESPONSE_TIMEOUT: 3000, // 3 seconds for voice responses
  VOICE_ACCURACY_THRESHOLD: 0.85, // 85% accuracy threshold for voice input

  // Limits (frontend-only estimates, backend enforces actual limits)
  VOICE_RATE_LIMIT_RPM: 20,    // Requests per minute for voice
  VOICE_RATE_LIMIT_RPD: 2000,  // Requests per day for voice
  VOICE_AUDIO_LIMIT_ASH: 7200, // Audio seconds per hour
  VOICE_AUDIO_LIMIT_ASD: 28800, // Audio seconds per day
};

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}