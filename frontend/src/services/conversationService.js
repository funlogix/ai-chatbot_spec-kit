// frontend/src/services/conversationService.js
/**
 * Conversation Service
 * Manages the conversation history and state
 */

class ConversationService {
  constructor() {
    this.conversations = new Map(); // Store conversations by ID
    this.currentConversationId = null;
  }

  /**
   * Create a new conversation
   * @param {string} conversationId - Unique identifier for the conversation
   * @param {Object} options - Options for the conversation
   * @returns {Object} The newly created conversation object
   */
  createConversation(conversationId = null, options = {}) {
    const id = conversationId || this.generateId();
    const conversation = {
      id,
      createdAt: new Date().toISOString(),
      messages: [],
      metadata: { ...options },
      lastModified: new Date().toISOString()
    };

    this.conversations.set(id, conversation);
    this.currentConversationId = id;

    return conversation;
  }

  /**
   * Get a conversation by ID
   * @param {string} conversationId - ID of the conversation to retrieve
   * @returns {Object|undefined} The conversation object or undefined if not found
   */
  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  /**
   * Get the current conversation
   * @returns {Object|undefined} The current conversation object or undefined if none exists
   */
  getCurrentConversation() {
    return this.conversations.get(this.currentConversationId);
  }

  /**
   * Add a message to a conversation
   * @param {string} conversationId - ID of the conversation to add to
   * @param {Object} message - The message to add
   * @returns {Object} The updated conversation object
   */
  addMessage(conversationId, message) {
    const conversation = this.getConversation(conversationId);
    if (!conversation) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }

    // Validate the message
    if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
      throw new Error('Message must have a valid role: user, assistant, or system');
    }

    if (!message.content) {
      throw new Error('Message must have content');
    }

    // Add timestamp to the message
    const messageWithTimestamp = {
      ...message,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    conversation.messages.push(messageWithTimestamp);
    conversation.lastModified = new Date().toISOString();

    // Update the conversation in the map
    this.conversations.set(conversationId, conversation);

    // If this is the current conversation, update our reference
    if (conversationId === this.currentConversationId) {
      this.currentConversation = conversation;
    }

    return conversation;
  }

  /**
   * Add a user message to the current conversation
   * @param {string} content - The content of the user message
   * @returns {Object} The updated conversation object
   */
  addUserMessage(content) {
    if (!this.currentConversationId) {
      this.createConversation();
    }

    return this.addMessage(this.currentConversationId, {
      role: 'user',
      content
    });
  }

  /**
   * Add an assistant message to the current conversation
   * @param {string} content - The content of the assistant message
   * @returns {Object} The updated conversation object
   */
  addAssistantMessage(content) {
    if (!this.currentConversationId) {
      this.createConversation();
    }

    return this.addMessage(this.currentConversationId, {
      role: 'assistant',
      content
    });
  }

  /**
   * Get all messages in a conversation
   * @param {string} conversationId - ID of the conversation
   * @returns {Array} Array of messages in the conversation
   */
  getMessages(conversationId) {
    const conversation = this.getConversation(conversationId);
    return conversation ? [...conversation.messages] : [];
  }

  /**
   * Get all messages in the current conversation
   * @returns {Array} Array of messages in the current conversation
   */
  getCurrentMessages() {
    if (!this.currentConversationId) {
      return [];
    }
    return this.getMessages(this.currentConversationId);
  }

  /**
   * Clear all messages in a conversation
   * @param {string} conversationId - ID of the conversation to clear
   * @returns {Object} The cleared conversation object
   */
  clearMessages(conversationId) {
    const conversation = this.getConversation(conversationId);
    if (conversation) {
      conversation.messages = [];
      conversation.lastModified = new Date().toISOString();
      this.conversations.set(conversationId, conversation);
    }
    return conversation;
  }

  /**
   * Delete a conversation
   * @param {string} conversationId - ID of the conversation to delete
   * @returns {boolean} True if the conversation was deleted, false otherwise
   */
  deleteConversation(conversationId) {
    const wasDeleted = this.conversations.delete(conversationId);

    // If we deleted the current conversation, reset the current conversation ID
    if (conversationId === this.currentConversationId) {
      this.currentConversationId = null;
    }

    return wasDeleted;
  }

  /**
   * Get all conversation IDs
   * @returns {Array} Array of conversation IDs
   */
  getConversationIds() {
    return Array.from(this.conversations.keys());
  }

  /**
   * Set the current conversation
   * @param {string} conversationId - ID of the conversation to set as current
   */
  setCurrentConversation(conversationId) {
    if (this.conversations.has(conversationId)) {
      this.currentConversationId = conversationId;
    } else {
      throw new Error(`Conversation with ID ${conversationId} does not exist`);
    }
  }

  /**
   * Generate a unique ID
   * @returns {string} A unique identifier
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * Get conversation statistics
   * @param {string} conversationId - ID of the conversation
   * @returns {Object} Statistics about the conversation
   */
  getStats(conversationId) {
    const conversation = this.getConversation(conversationId);
    if (!conversation) {
      return null;
    }

    return {
      id: conversation.id,
      messageCount: conversation.messages.length,
      tokenCount: conversation.messages.reduce((total, msg) => {
        // Simple estimation of tokens (1 token ~ 4 chars or 1 word)
        return total + Math.ceil((msg.content || '').length / 4);
      }, 0),
      createdAt: conversation.createdAt,
      lastModified: conversation.lastModified
    };
  }
}

// Export a singleton instance
const conversationService = new ConversationService();
export default conversationService;