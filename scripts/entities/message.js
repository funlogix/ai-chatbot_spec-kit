// Message entity - Individual unit of communication

class Message {
  constructor(content, sender, mediaType = 'text') {
    if (!content) {
      throw new Error('Message content is required');
    }
    
    if (!['user', 'bot'].includes(sender)) {
      throw new Error('Sender must be either "user" or "bot"');
    }
    
    if (!['text', 'audio'].includes(mediaType)) {
      throw new Error('MediaType must be either "text" or "audio"');
    }

    this.id = this.generateId();
    this.content = content;
    this.timestamp = new Date().toISOString();
    this.sender = sender;
    this.mediaType = mediaType;
    this.isProcessed = false;
    this.audioUrl = null;
  }

  generateId() {
    // Generate a unique identifier for the message
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  markAsProcessed() {
    this.isProcessed = true;
  }

  setAudioUrl(url) {
    if (this.mediaType !== 'audio') {
      throw new Error('Cannot set audio URL for non-audio message');
    }
    this.audioUrl = url;
  }

  updateContent(newContent) {
    if (!newContent) {
      throw new Error('Message content cannot be empty');
    }
    this.content = newContent;
    // Update timestamp when content is updated
    this.timestamp = new Date().toISOString();
  }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Message;
} else {
  window.Message = Message;
}