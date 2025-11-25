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
    this.initVoice(); // Initialize voice functionality
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
    chatHistoryContainer.style.display = 'flex';
    chatHistoryContainer.style.flexDirection = 'column';

    // Create input area
    const inputArea = document.createElement('div');
    inputArea.className = 'chat-input-area';
    inputArea.style.display = 'flex';
    inputArea.style.padding = '1rem';
    inputArea.style.backgroundColor = 'white';
    inputArea.style.borderTop = '1px solid #dee2e6';

    // Create voice input button
    const voiceInputButton = document.createElement('button');
    voiceInputButton.id = 'voice-input-btn';  // Use the expected ID
    voiceInputButton.className = 'voice-input-button';
    voiceInputButton.title = 'Voice Input';
    voiceInputButton.textContent = '🎤';
    voiceInputButton.style.padding = '0.5rem';
    voiceInputButton.style.marginRight = '0.5rem';
    voiceInputButton.style.backgroundColor = '#6c757d';
    voiceInputButton.style.color = 'white';
    voiceInputButton.style.border = 'none';
    voiceInputButton.style.borderRadius = '4px';
    voiceInputButton.style.cursor = 'pointer';
    voiceInputButton.style.fontSize = '1rem';

    // Create message input
    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.id = 'message-input';
    messageInput.className = 'message-input';
    messageInput.placeholder = 'Type or speak your message here...';
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

    // Create voice output button
    const voiceOutputButton = document.createElement('button');
    voiceOutputButton.id = 'voice-output-btn';  // Use the expected ID
    voiceOutputButton.className = 'voice-output-button';
    voiceOutputButton.title = 'Voice Output';
    voiceOutputButton.textContent = '🔊';
    voiceOutputButton.style.padding = '0.5rem';
    voiceOutputButton.style.marginLeft = '0.5rem';
    voiceOutputButton.style.backgroundColor = '#28a745';
    voiceOutputButton.style.color = 'white';
    voiceOutputButton.style.border = 'none';
    voiceOutputButton.style.borderRadius = '4px';
    voiceOutputButton.style.cursor = 'pointer';
    voiceOutputButton.style.fontSize = '1rem';

    // Add elements to input area
    inputArea.appendChild(voiceInputButton);
    inputArea.appendChild(messageInput);
    inputArea.appendChild(sendButton);
    inputArea.appendChild(voiceOutputButton);

    // Add all elements to chat wrapper
    chatWrapper.appendChild(chatHistoryContainer);
    chatWrapper.appendChild(inputArea);

    // Add to container
    this.container.appendChild(chatWrapper);
  }

  attachEventListeners() {
    const messageInput = this.container.querySelector('#message-input');
    const sendButton = this.container.querySelector('#send-button');
    // Use the IDs that match the voice components expectation
    const voiceInputButton = this.container.querySelector('#voice-input-btn');
    const voiceOutputButton = this.container.querySelector('#voice-output-btn');

    if (!messageInput) {
      console.error('Message input not found');
    }
    if (!sendButton) {
      console.error('Send button not found');
    }
    if (!voiceInputButton) {
      console.error('Voice input button not found');
    }
    if (!voiceOutputButton) {
      console.error('Voice output button not found');
    }

    // Send message when clicking the button (only if element exists)
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        this.handleSendMessage();
      });
    }

    // Send message when pressing Enter in the input (only if element exists)
    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSendMessage();
        }
      });

      // Update send button state based on input
      messageInput.addEventListener('input', () => {
        if (sendButton) {
          const isEmpty = messageInput.value.trim() === '';
          sendButton.disabled = isEmpty;
        }
      });
    }

    // Voice input functionality - delegate to global voice components
    if (voiceInputButton) {
      voiceInputButton.addEventListener('click', () => {
        this.toggleVoiceInput();
      });

      // Initial button state update
      this.updateVoiceButtonState();
    }

    // Voice output functionality - use integrated voice functionality
    if (voiceOutputButton) {
      voiceOutputButton.addEventListener('click', () => {
        this.toggleVoiceOutput();
      });

      // Initial button state update
      this.updateVoiceOutputButtonState();
    }
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
    messageElement.dataset.timestamp = new Date().toISOString(); // For voice components that track timestamps

    if (sender === 'user') {
      messageElement.style.alignSelf = 'flex-end';
      messageElement.style.backgroundColor = '#0d6efd';
      messageElement.style.color = 'white';
      messageElement.style.marginLeft = 'auto';
    } else if (sender === 'assistant') {
      messageElement.style.alignSelf = 'flex-start';
      messageElement.style.backgroundColor = '#e9ecef';
      messageElement.style.color = '#212529';
      messageElement.style.marginRight = 'auto';
    } else if (sender === 'bot') {
      messageElement.style.alignSelf = 'flex-start';
      messageElement.style.backgroundColor = '#e9ecef';
      messageElement.style.color = '#212529';
      messageElement.style.marginRight = 'auto';
    } else {  // system or other
      messageElement.style.alignSelf = 'center';
      messageElement.style.backgroundColor = '#6c757d';
      messageElement.style.color = 'white';
      messageElement.style.marginLeft = 'auto';
      messageElement.style.marginRight = 'auto';
      messageElement.style.maxWidth = '100%';
    }

    // Create sender label
    const senderLabel = document.createElement('div');
    senderLabel.className = 'message-sender';
    senderLabel.style.fontWeight = 'bold';
    senderLabel.style.marginBottom = '0.25rem';

    if (sender === 'user') {
      senderLabel.textContent = 'You';
    } else if (sender === 'assistant' || sender === 'bot') {
      senderLabel.textContent = 'AI Assistant';
    } else {
      senderLabel.textContent = 'System';
    }

    // Create content
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    // Sanitize content to prevent XSS (as in legacy implementation)
    const sanitizedContent = content.replace(/[<>]/g, (tag) => {
      return tag === '<' ? '&lt;' : '&gt;';
    });
    contentElement.textContent = sanitizedContent;

    // Add elements to message
    messageElement.appendChild(senderLabel);
    messageElement.appendChild(contentElement);

    // Add to chat history
    chatHistoryContainer.appendChild(messageElement);

    // Scroll to the bottom
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;

    // If it's a bot message and voice output is enabled, speak it
    if ((sender === 'bot' || sender === 'assistant') && this.voiceOutputEnabled) {
      setTimeout(() => {
        this.speakMessage(content);
      }, 300); // Small delay to allow message to render before speaking
    }
  }

  // Method to set the current provider (called when provider changes)
  setCurrentProvider(providerId, modelId) {
    this.currentProviderId = providerId;
    // Update the model ID, allowing it to be null if provider is null
    this.currentModelId = (providerId ? modelId : null);

    // Optionally, notify if needed
    if (this.options.onProviderChange) {
      this.options.onProviderChange(providerId, this.currentModelId);
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

  // Method to initialize voice functionality
  initVoice() {
    // Initialize speech recognition (if supported)
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const messageInput = this.container.querySelector('#message-input');
        if (messageInput) {
          messageInput.value = transcript;

          // Trigger the input event to update any listeners
          messageInput.dispatchEvent(new Event('input'));

          // Automatically submit the message after transcription
          // The handleSendMessage method will add the message to the UI
          setTimeout(() => {
            this.handleSendMessage();
          }, 500); // Small delay to ensure UI updates
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        this.isListening = false;
        this.updateVoiceButtonState(); // Update button state to reflect stopped listening
        this.recognition.stop(); // Ensure we stop recognition on error
      };

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateVoiceButtonState(); // Update button state when started
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.updateVoiceButtonState(); // Update button state when stopped
      };
    } else {
      console.warn('Speech recognition not supported in this browser');
      this.recognition = null;
    }

    // Initialize speech synthesis (if supported)
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;

      // Load voices if needed
      if (this.synthesis.getVoices().length === 0) {
        // Some browsers need to wait for voices to be loaded
        this.synthesis.onvoiceschanged = () => {
          // Voices are loaded, no additional action needed here
        };
      }
    } else {
      console.warn('Speech synthesis not supported in this browser');
      this.synthesis = null;
    }

    this.isListening = false;
    this.isSpeaking = false;
    this.voiceOutputEnabled = true; // Default to enabled
  }

  // Method to update the voice button's visual state
  updateVoiceButtonState() {
    const voiceInputButton = this.container.querySelector('#voice-input-btn');
    if (voiceInputButton) {
      if (this.isListening) {
        // Update button to reflect listening state (red or pulsing)
        voiceInputButton.textContent = '🔴'; // Change to red dot when recording
        voiceInputButton.style.backgroundColor = '#dc3545'; // Red background when listening
        voiceInputButton.title = 'Click to stop listening';
      } else {
        // Back to default state
        voiceInputButton.textContent = '🎤';
        voiceInputButton.style.backgroundColor = '#6c757d'; // Default gray
        voiceInputButton.title = 'Voice Input';
      }
    }
  }

  // Method to update the voice output button's state
  updateVoiceOutputButtonState() {
    const voiceOutputButton = this.container.querySelector('#voice-output-btn');
    if (voiceOutputButton) {
      if (this.voiceOutputEnabled) {
        voiceOutputButton.style.backgroundColor = '#28a745'; // Green when enabled
        voiceOutputButton.title = 'Voice Output Enabled';
      } else {
        voiceOutputButton.style.backgroundColor = '#6c757d'; // Gray when disabled
        voiceOutputButton.title = 'Voice Output Disabled';
      }
    }
  }

  // Method to toggle voice input (speech-to-text)
  toggleVoiceInput() {
    if (!this.recognition) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    if (this.isListening) {
      // Stop listening
      this.recognition.stop();
    } else {
      // Start listening
      try {
        // Request microphone permission
        this.recognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        alert('Could not start speech recognition. Please check microphone permissions.');
      }
    }
  }

  // Method to toggle voice output (text-to-speech)
  toggleVoiceOutput() {
    if (!this.synthesis) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    // Toggle the voice output enabled state
    this.voiceOutputEnabled = !this.voiceOutputEnabled;
    this.updateVoiceOutputButtonState();

    // Provide feedback to the user
    const status = this.voiceOutputEnabled ? 'enabled' : 'disabled';
    // Don't show alert as it can be disruptive, just update the button state
  }

  // Method to speak a message using text-to-speech
  speakMessage(text) {
    if (!this.synthesis || !this.voiceOutputEnabled || !text) {
      return; // Don't speak if not supported, disabled, or no text
    }

    // Stop any currently speaking utterances
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }

    // Create and speak the message
    const utterance = new SpeechSynthesisUtterance(text);

    // Use default values with fallbacks
    const config = window.CONFIG || {};
    utterance.rate = config.VOICE_DEFAULT_RATE || 1.0;
    utterance.pitch = config.VOICE_DEFAULT_PITCH || 1.0;
    utterance.volume = config.VOICE_DEFAULT_VOLUME || 1.0;

    // Get voice based on language from config
    const voices = this.synthesis.getVoices();
    if (voices.length === 0) {
      // If no voices are loaded yet, wait a bit and try again
      setTimeout(() => {
        const updatedVoices = this.synthesis.getVoices();
        const englishVoice = updatedVoices.find(voice =>
          voice.lang.includes('en') || voice.lang.includes('us') || voice.name.includes('English')
        );

        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        this.synthesis.speak(utterance);
      }, 100);
    } else {
      const englishVoice = voices.find(voice =>
        voice.lang.includes('en') || voice.lang.includes('us') || voice.name.includes('English')
      );

      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      this.synthesis.speak(utterance);
    }
  }

  // Method to display a message (compatible with voice components)
  displayMessage(message) {
    // Convert the message object to the format expected by addMessageToUI
    // message has properties: content, sender, timestamp
    this.addMessageToUI(message.sender, message.content);

    // If it's a bot message and voice output is enabled, speak it
    if (message.sender === 'bot' && this.voiceOutputEnabled) {
      setTimeout(() => {
        this.speakMessage(message.content);
      }, 300); // Small delay to allow message to render before speaking
    }
  }

  // Method to show typing indicator (compatible with voice components)
  showTypingIndicator() {
    const chatHistoryContainer = this.container.querySelector('#chat-history');
    if (!chatHistoryContainer) return;

    // Create typing indicator
    const typingElement = document.createElement('div');
    typingElement.id = 'typing-indicator';
    typingElement.className = 'typing-indicator';
    typingElement.style.marginBottom = '1rem';
    typingElement.style.padding = '0.5rem';
    typingElement.style.borderRadius = '4px';
    typingElement.style.backgroundColor = '#e9ecef';
    typingElement.style.color = '#212529';
    typingElement.style.textAlign = 'left';
    typingElement.innerHTML = `
      <div class="message-sender">AI Assistant</div>
      <div class="message-content">
        <span>Assistant is typing</span>
        <span class="typing-dots">
          <span class="typing-dot">.</span>
          <span class="typing-dot">.</span>
          <span class="typing-dot">.</span>
        </span>
      </div>
    `;

    chatHistoryContainer.appendChild(typingElement);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
  }

  // Method to hide typing indicator (compatible with voice components)
  hideTypingIndicator() {
    const typingElement = this.container.querySelector('#typing-indicator');
    if (typingElement) {
      typingElement.remove();
    }
  }

}

export default ChatInterface;