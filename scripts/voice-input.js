// Voice input processing using browser Web Speech API

class VoiceInput {
  constructor(chat, conversationService) {
    this.chat = chat;
    this.conversationService = conversationService;
    this.recognition = null;
    this.isListening = false;
    this.isSupported = this.checkSupport();
    
    // DOM elements
    this.voiceInputButton = document.getElementById('voice-input-btn');
    
    this.init();
  }

  init() {
    if (this.isSupported) {
      // Initialize the speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configure recognition
      this.recognition.continuous = false; // Stop automatically after pause
      this.recognition.interimResults = true; // Show interim results
      this.recognition.lang = CONFIG.VOICE_DEFAULT_LANGUAGE;
      
      // Bind event listeners
      this.voiceInputButton.addEventListener('click', () => this.toggleListening());
      
      // Event handlers for recognition
      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        
        if (transcript) {
          this.handleFinalTranscript(transcript);
        }
      };
      
      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.handleRecognitionError(event.error);
      };
      
      this.recognition.onend = () => {
        this.isListening = false;
        this.updateButtonState();
      };
    } else {
      // Disable the button if not supported
      this.voiceInputButton.disabled = true;
      this.voiceInputButton.title = 'Voice input not supported in this browser';
      console.warn('Web Speech API not supported in this browser');
    }
  }

  checkSupport() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  toggleListening() {
    if (!this.isSupported) {
      this.showNotSupportedMessage();
      return;
    }

    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  async startListening() {
    try {
      // Request microphone permission
      await this.requestMicrophonePermission();
      
      // Start recognition
      this.recognition.start();
      this.isListening = true;
      this.updateButtonState();
    } catch (error) {
      console.error('Error starting voice input:', error);
      this.handleRecognitionError(error.message || 'Unknown error');
    }
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
      this.updateButtonState();
    }
  }

  async requestMicrophonePermission() {
    try {
      // Try to access the microphone to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately since we'll let the SpeechRecognition API handle it
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        // User denied permission
        this.handlePermissionDenied();
        throw error;
      } else if (error.name === 'NotFoundError') {
        // No microphone found
        this.handleNoMicrophone();
        throw error;
      }
      throw error;
    }
  }

  handleFinalTranscript(transcript) {
    // Stop listening
    this.stopListening();
    
    // Create user input entity
    const userInput = new UserInput(transcript, 'audio');
    userInput.setConvertedText(transcript);
    userInput.markAsProcessed();
    
    // Display the transcript as a message
    const message = new Message(transcript, 'user', 'text'); // We convert audio input to text message
    this.chat.displayMessage(message);
    
    // Add to conversation
    this.conversationService.addMessageToConversation(message);
    
    // Process with AI
    this.processVoiceMessage(transcript);
  }

  async processVoiceMessage(transcript) {
    try {
      // Show typing indicator
      this.chat.showTypingIndicator();
      
      // Get response from API
      const response = await this.chat.apiClient.sendTextMessage(transcript);
      
      // Hide typing indicator
      this.chat.hideTypingIndicator();
      
      // Create and display bot message
      const botMessage = new Message(response.response, 'bot');
      this.chat.displayMessage(botMessage);
      
      // Add to conversation
      this.conversationService.addMessageToConversation(botMessage);
      
    } catch (error) {
      console.error('Error processing voice message:', error);
      
      // Hide typing indicator
      this.chat.hideTypingIndicator();
      
      // Show error message
      const errorMessage = new Message(
        `Sorry, I encountered an error: ${error.message || 'Unable to process your voice message'}`, 
        'bot'
      );
      this.chat.displayMessage(errorMessage);
    }
  }

  handleRecognitionError(error) {
    this.stopListening();
    
    let errorMessage = 'Sorry, I couldn\'t understand that.';
    
    switch (error) {
      case 'no-speech':
        errorMessage = 'No speech detected. Please try again.';
        break;
      case 'audio-capture':
        errorMessage = 'No microphone was found.';
        break;
      case 'not-allowed':
      case 'service-not-allowed':
        this.handlePermissionDenied();
        return;
      case 'network':
        errorMessage = 'Network error occurred. Please check your connection.';
        break;
      case 'aborted':
        // This happens when we manually stop the recognition, which is normal
        return;
      default:
        console.error('Speech recognition error:', error);
    }
    
    // Display error message to user
    const errorBotMessage = new Message(errorMessage, 'bot');
    this.chat.displayMessage(errorBotMessage);
  }

  handlePermissionDenied() {
    // Show an explanation to the user about why microphone access is needed
    const permissionMessage = new Message(
      "Microphone access is needed for voice input. Please enable it in your browser settings and try again.", 
      'bot'
    );
    this.chat.displayMessage(permissionMessage);
  }

  handleNoMicrophone() {
    const noMicMessage = new Message(
      "No microphone was found on your device. Please connect one and try again.", 
      'bot'
    );
    this.chat.displayMessage(noMicMessage);
  }

  showNotSupportedMessage() {
    const notSupportedMessage = new Message(
      "Voice input is not supported in your current browser. Please try Chrome, Edge, or Safari.", 
      'bot'
    );
    this.chat.displayMessage(notSupportedMessage);
  }

  updateButtonState() {
    if (this.isListening) {
      this.voiceInputButton.classList.add('listening');
      this.voiceInputButton.title = 'Click to stop listening';
    } else {
      this.voiceInputButton.classList.remove('listening');
      this.voiceInputButton.title = 'Click to start voice input';
    }
  }

  // Implement fallback to text input when voice fails
  fallbackToTextInput() {
    // This would switch the interface to rely solely on text input
    // For this implementation, we'll just ensure the text input remains available
    this.voiceInputButton.title = 'Voice input unavailable. Use text input instead.';
  }

  // Check if voice input is currently active
  getIsListening() {
    return this.isListening;
  }

  // Get supported languages
  getSupportedLanguages() {
    // Note: This is a simplified approach. In a real application, 
    // you might query the actual supported languages
    return [CONFIG.VOICE_DEFAULT_LANGUAGE, 'en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE'];
  }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceInput;
} else {
  window.VoiceInput = VoiceInput;
}