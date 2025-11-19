// Chat interface logic

class Chat {
  constructor(conversationService, apiClient) {
    this.conversationService = conversationService;
    this.apiClient = apiClient;
    this.chatHistoryElement = document.getElementById('chat-history');
    this.messageInputElement = document.getElementById('message-input');
    this.sendButtonElement = document.getElementById('send-btn');
    this.typingIndicator = null;
    
    this.init();
  }

  init() {
    // Bind event listeners
    this.sendButtonElement.addEventListener('click', () => this.handleSendMessage());
    this.messageInputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSendMessage();
      }
    });
    
    // Initialize with welcome message
    this.addWelcomeMessage();
  }

  addWelcomeMessage() {
    const welcomeMessage = new Message(
      "Hello! I'm your AI assistant. You can chat with me using text or voice. How can I help you today?",
      "bot"
    );
    this.displayMessage(welcomeMessage);
  }

  async handleSendMessage() {
    const messageText = this.messageInputElement.value.trim();
    
    if (!messageText) {
      return; // Don't send empty messages
    }

    // Clear input
    this.messageInputElement.value = '';
    
    // Create and display user message
    const userMessage = new Message(messageText, 'user');
    this.displayMessage(userMessage);
    
    // Add to conversation
    this.conversationService.addMessageToConversation(userMessage);
    
    try {
      // Show typing indicator
      this.showTypingIndicator();
      
      // Get response from API
      const response = await this.apiClient.sendTextMessage(messageText);
      
      // Hide typing indicator
      this.hideTypingIndicator();
      
      // Create and display bot message
      const botMessage = new Message(response.response, 'bot');
      this.displayMessage(botMessage);
      
      // Add to conversation
      this.conversationService.addMessageToConversation(botMessage);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Hide typing indicator
      this.hideTypingIndicator();
      
      // Show error message
      const errorMessage = new Message(
        `Sorry, I encountered an error: ${error.message || 'Unable to process your message'}`, 
        'bot'
      );
      this.displayMessage(errorMessage);
    }
  }

  displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.sender}-message`;
    messageElement.setAttribute('data-message-id', message.id);
    
    // Sanitize content to prevent XSS
    const sanitizedContent = Utils.sanitizeHTML(message.content);
    
    messageElement.innerHTML = `
      <div class="message-sender">${message.sender === 'user' ? 'You' : 'Assistant'}</div>
      <div class="message-content">${sanitizedContent}</div>
      <div class="message-timestamp">${Utils.formatTimestamp(message.timestamp)}</div>
    `;
    
    this.chatHistoryElement.appendChild(messageElement);
    
    // Add animation class
    messageElement.classList.add('new');
    
    // Scroll to bottom
    if (CONFIG.MESSAGE_AUTO_SCROLL) {
      this.scrollToBottom();
    }
  }

  showTypingIndicator() {
    // Remove any existing typing indicator
    if (this.typingIndicator) {
      this.typingIndicator.remove();
    }
    
    this.typingIndicator = document.createElement('div');
    this.typingIndicator.className = 'typing-indicator';
    this.typingIndicator.innerHTML = `
      <span>Assistant is typing</span>
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    
    this.chatHistoryElement.appendChild(this.typingIndicator);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    if (this.typingIndicator) {
      this.typingIndicator.remove();
      this.typingIndicator = null;
    }
  }

  scrollToBottom() {
    this.chatHistoryElement.scrollTop = this.chatHistoryElement.scrollHeight;
  }

  // Add conversation history management
  addConversationHistoryManagement() {
    // This method would implement logic to manage large conversation histories
    // For example, limiting the number of displayed messages or implementing pagination
    const messages = this.chatHistoryElement.querySelectorAll('.message');
    
    // Only keep the last 50 messages to prevent performance issues
    if (messages.length > 50) {
      for (let i = 0; i < messages.length - 50; i++) {
        messages[i].remove();
      }
    }
  }

  // Clear chat history
  clearChat() {
    while (this.chatHistoryElement.firstChild) {
      this.chatHistoryElement.removeChild(this.chatHistoryElement.firstChild);
    }
    this.conversationService.clearConversation();
    this.addWelcomeMessage();
  }

  // Load conversation history (if needed)
  loadConversationHistory(conversationId = null) {
    const messages = this.conversationService.getConversationHistory(conversationId);
    
    // Clear current chat display
    while (this.chatHistoryElement.firstChild) {
      this.chatHistoryElement.removeChild(this.chatHistoryElement.firstChild);
    }
    
    // Display all messages in the conversation
    messages.forEach(message => {
      this.displayMessage(message);
    });
    
    // Scroll to bottom
    this.scrollToBottom();
  }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Chat;
} else {
  window.Chat = Chat;
}