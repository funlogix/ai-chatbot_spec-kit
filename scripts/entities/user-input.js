// UserInput entity - Container for text or audio data from user

class UserInput {
  constructor(content, originalMediaType) {
    if (!content) {
      throw new Error('User input content is required');
    }
    
    if (!['text', 'audio'].includes(originalMediaType)) {
      throw new Error('OriginalMediaType must be either "text" or "audio"');
    }

    this.id = this.generateId();
    this.content = content;
    this.originalMediaType = originalMediaType;
    this.processedAt = null;
    this.originalAudioBlob = null;
    this.convertedText = null;
  }

  generateId() {
    // Generate a unique identifier for the user input
    return 'input_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  markAsProcessed() {
    this.processedAt = new Date().toISOString();
  }

  setAudioBlob(blob) {
    if (this.originalMediaType !== 'audio') {
      throw new Error('Cannot set audio blob for non-audio input');
    }
    this.originalAudioBlob = blob;
  }

  setConvertedText(text) {
    this.convertedText = text;
    // Update content to the converted text
    this.content = text;
  }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserInput;
} else {
  window.UserInput = UserInput;
}