// frontend/src/components/ChatInterface/index.js
/**
 * Chat Interface Component
 * Provides the main chat interface for interacting with AI providers
 */

class ChatInterface {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      onSendMessage: options.onSendMessage || null,
      onProviderChange: options.onProviderChange || null,
      ...options
    };

    this.chatHistory = [];
    this.currentProviderId = null;
    this.currentModelId = null;

    this.init();
  }

  async init() {
    if (!this.container) {
      console.error(`Container with ID ${this.containerId} not found`);
      return;
    }

    this.render();
    this.attachEventListeners();
  }

  render() {
    if (!this.container) {
      console.error(`Container with ID ${this.containerId} not found`);
      return;
    }

    // Clear the container
    this.container.innerHTML = '';

    // Create the main chat interface wrapper
    const chatWrapper = document.createElement('div');
    chatWrapper.className = 'chat-interface';
    chatWrapper.style.display = 'flex';
    chatWrapper.style.flexDirection = 'column';
    chatWrapper.style.height = '600px';
    chatWrapper.style.border = '1px solid #dee2e6';
    chatWrapper.style.borderRadius = '8px';
    chatWrapper.style.overflow = 'hidden';

    // Create chat history container
    const chatHistoryContainer = document.createElement('div');
    chatHistoryContainer.id = 'chat-history';
    chatHistoryContainer.className = 'chat-history';
    chatHistoryContainer.style.flex = '1';
    chatHistoryContainer.style.overflowY = 'auto';
    chatHistoryContainer.style.padding = '1rem';
    chatHistoryContainer.style.backgroundColor = '#f8f9fa';

    // Create input area
    const inputArea = document.createElement('div');
    inputArea.className = 'chat-input-area';
    inputArea.style.display = 'flex';
    inputArea.style.padding = '1rem';
    inputArea.style.backgroundColor = 'white';
    inputArea.style.borderTop = '1px solid #dee2e6';

    // Create message input
    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.id = 'message-input';
    messageInput.className = 'message-input';
    messageInput.placeholder = 'Type your message here...';
    messageInput.style.flex = '1';
    messageInput.style.padding = '0.5rem';
    messageInput.style.border = '1px solid #ced4da';
    messageInput.style.borderRadius = '4px';
    messageInput.style.marginRight = '0.5rem';

    // Create send button
    const sendButton = document.createElement('button');
    sendButton.id = 'send-button';
    sendButton.className = 'send-button';
    sendButton.textContent = 'Send';
    sendButton.style.padding = '0.5rem 1rem';
    sendButton.style.backgroundColor = '#0d6efd';
    sendButton.style.color = 'white';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '4px';
    sendButton.style.cursor = 'pointer';

    // Add input and button to input area
    inputArea.appendChild(messageInput);
    inputArea.appendChild(sendButton);

    // Add all elements to chat wrapper
    chatWrapper.appendChild(chatHistoryContainer);
    chatWrapper.appendChild(inputArea);

    // Add to container
    this.container.appendChild(chatWrapper);
  }

  attachEventListeners() {
    const messageInput = this.container.querySelector('#message-input');
    const sendButton = this.container.querySelector('#send-button');

    if (!messageInput || !sendButton) {
      console.error('Chat input elements not found');
      return;
    }

    // Send message when clicking the button
    sendButton.addEventListener('click', () => {
      this.handleSendMessage();
    });

    // Send message when pressing Enter in the input
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSendMessage();
      }
    });

    // Update send button state based on input
    messageInput.addEventListener('input', () => {
      const isEmpty = messageInput.value.trim() === '';
      sendButton.disabled = isEmpty;
    });
  }

  async handleSendMessage() {
    const messageInput = this.container.querySelector('#message-input');
    const sendButton = this.container.querySelector('#send-button');

    if (!messageInput || !sendButton) {
      console.error('Chat input elements not found');
      return;
    }

    const message = messageInput.value.trim();
    if (!message) {
      return; // Don't send empty messages
    }

    // Disable input while processing
    messageInput.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';

    try {
      // Add user message to UI
      this.addMessageToUI('user', message);

      // Clear input
      messageInput.value = '';

      // Send to backend API via callback
      if (this.options.onSendMessage) {
        // Use the current provider and model from component state if available
        const providerId = this.currentProviderId;
        const modelId = this.currentModelId;

        console.log(`Sending message using provider: ${providerId}, model: ${modelId}`);

        const response = await this.options.onSendMessage(message, providerId, modelId);

        // Add AI response to UI
        if (response) {
          this.addMessageToUI('assistant', response);
        }
      } else {
        // Fallback response if no callback provided
        this.addMessageToUI('assistant', 'AI response would appear here once connected to backend.');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message to UI
      this.addMessageToUI('assistant', `Error: ${error.message || 'Failed to send message'}`);
    } finally {
      // Re-enable input
      messageInput.disabled = false;
      sendButton.disabled = false;
      sendButton.textContent = 'Send';
    }
  }

  addMessageToUI(sender, content) {
    const chatHistoryContainer = this.container.querySelector('#chat-history');
    if (!chatHistoryContainer) {
      console.error('Chat history container not found');
      return;
    }

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    messageElement.style.marginBottom = '1rem';
    messageElement.style.padding = '0.5rem';
    messageElement.style.borderRadius = '4px';
    messageElement.style.maxWidth = '80%';

    if (sender === 'user') {
      messageElement.style.alignSelf = 'flex-end';
      messageElement.style.backgroundColor = '#0d6efd';
      messageElement.style.color = 'white';
      messageElement.style.marginLeft = 'auto';
    } else {
      messageElement.style.alignSelf = 'flex-start';
      messageElement.style.backgroundColor = '#e9ecef';
      messageElement.style.color = '#212529';
      messageElement.style.marginRight = 'auto';
    }

    // Create sender label
    const senderLabel = document.createElement('div');
    senderLabel.className = 'message-sender';
    senderLabel.style.fontWeight = 'bold';
    senderLabel.style.marginBottom = '0.25rem';
    senderLabel.textContent = sender === 'user' ? 'You' : 'AI Assistant';
    
    // Create content
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = content;

    // Add elements to message
    messageElement.appendChild(senderLabel);
    messageElement.appendChild(contentElement);

    // Add to chat history
    chatHistoryContainer.appendChild(messageElement);

    // Scroll to the bottom
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
  }

  // Method to set the current provider (called when provider changes)
  setCurrentProvider(providerId, modelId) {
    this.currentProviderId = providerId;
    if (modelId) {
      this.currentModelId = modelId;
    }

    // Optionally, notify if needed
    if (this.options.onProviderChange) {
      this.options.onProviderChange(providerId, modelId);
    }
  }

  // Method to set the current model
  setCurrentModel(modelId) {
    this.currentModelId = modelId;
  }

  // Getter for current provider
  getCurrentProvider() {
    return this.currentProviderId;
  }

  // Getter for current model
  getCurrentModel() {
    return this.currentModelId;
  }

  // Method to clear the chat history
  clearHistory() {
    const chatHistoryContainer = this.container.querySelector('#chat-history');
    if (chatHistoryContainer) {
      chatHistoryContainer.innerHTML = '';
    }
    this.chatHistory = [];
  }

  // Method to add a system message to the chat
  addSystemMessage(content) {
    this.addMessageToUI('system', content);
  }
}

export default ChatInterface;