// Conversation entity - Represents a sequence of messages between user and chatbot

class Conversation {
  constructor() {
    this.id = this.generateId();
    this.createdAt = new Date().toISOString();
    this.lastInteraction = new Date().toISOString();
    this.isActive = true;
    this.messages = [];
  }

  generateId() {
    // Generate a unique identifier for the conversation
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  addMessage(message) {
    // Validate message before adding
    if (!message || !message.id || !message.content) {
      throw new Error('Invalid message: missing required fields');
    }

    // Ensure we don't exceed the message limit
    if (this.messages.length >= 100) {
      // Remove oldest messages to maintain limit
      this.messages = this.messages.slice(10); // Keep the 90 most recent
    }

    this.messages.push(message);
    this.lastInteraction = new Date().toISOString();
  }

  getMessages() {
    return [...this.messages]; // Return a copy to prevent external modification
  }

  getRecentMessages(limit = 10) {
    return this.messages.slice(-limit);
  }

  clear() {
    this.messages = [];
    this.lastInteraction = new Date().toISOString();
  }

  deactivate() {
    this.isActive = false;
    this.lastInteraction = new Date().toISOString();
  }

  activate() {
    this.isActive = true;
    this.lastInteraction = new Date().toISOString();
  }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Conversation;
} else {
  window.Conversation = Conversation;
}