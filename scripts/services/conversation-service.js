// Conversation context management service

class ConversationService {
  constructor() {
    this.currentConversation = null;
    this.conversations = new Map(); // Store multiple conversations if needed
    this.maxConversations = 10; // Limit number of stored conversations
  }

  // Create a new conversation
  createConversation() {
    const conversation = new Conversation();
    this.currentConversation = conversation;
    this.conversations.set(conversation.id, conversation);
    
    // Limit the number of stored conversations
    if (this.conversations.size > this.maxConversations) {
      // Remove the oldest conversation
      const oldestKey = this.conversations.keys().next().value;
      this.conversations.delete(oldestKey);
    }
    
    return conversation;
  }

  // Get the current active conversation
  getCurrentConversation() {
    if (!this.currentConversation) {
      this.createConversation(); // Create one if none exists
    }
    return this.currentConversation;
  }

  // Add a message to the current conversation
  addMessageToConversation(message) {
    const conversation = this.getCurrentConversation();
    conversation.addMessage(message);
    return conversation;
  }

  // Get conversation history
  getConversationHistory(conversationId = null) {
    const conversation = conversationId 
      ? this.conversations.get(conversationId) 
      : this.getCurrentConversation();
    
    return conversation ? conversation.getMessages() : [];
  }

  // Clear the current conversation
  clearConversation(conversationId = null) {
    const conversation = conversationId 
      ? this.conversations.get(conversationId) 
      : this.getCurrentConversation();
    
    if (conversation) {
      conversation.clear();
    }
  }

  // Deactivate the current conversation
  deactivateConversation(conversationId = null) {
    const conversation = conversationId 
      ? this.conversations.get(conversationId) 
      : this.getCurrentConversation();
    
    if (conversation) {
      conversation.deactivate();
    }
  }

  // Activate a conversation
  activateConversation(conversationId = null) {
    const conversation = conversationId 
      ? this.conversations.get(conversationId) 
      : this.getCurrentConversation();
    
    if (conversation) {
      conversation.activate();
    }
  }

  // Get all conversations
  getAllConversations() {
    return Array.from(this.conversations.values());
  }

  // Switch to a different conversation
  switchConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      this.currentConversation = conversation;
      return conversation;
    }
    return null;
  }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConversationService;
} else {
  window.ConversationService = ConversationService;
}