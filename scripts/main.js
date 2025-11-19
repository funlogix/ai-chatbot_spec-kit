// Main application logic

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize configuration
    // In a real application, the API key would be loaded securely
    // For this example, we'll add a placeholder
    if (!CONFIG.GROQ_API_KEY || CONFIG.GROQ_API_KEY === '') {
      console.warn('GROQ_API_KEY is not set. The chatbot will not be able to communicate with the AI service.');
      console.warn('Please set your API key in the configuration.');
      
      // Show a message to the user
      const chatHistoryElement = document.getElementById('chat-history');
      if (chatHistoryElement) {
        const warningMessage = document.createElement('div');
        warningMessage.className = 'message bot-message';
        warningMessage.innerHTML = `
          <div class="message-sender">System</div>
          <div class="message-content">
            <p><strong>API Key Required:</strong> Please configure your Groq API key in the settings.</p>
            <p>Without an API key, I can only provide simulated responses.</p>
          </div>
        `;
        chatHistoryElement.appendChild(warningMessage);
      }
    }

    // Initialize services
    const conversationService = new ConversationService();
    const apiClient = new ApiClient();
    
    // Set the API key from config (in a real app this would be more secure)
    if (CONFIG.GROQ_API_KEY) {
      apiClient.setApiKey(CONFIG.GROQ_API_KEY);
    }
    
    // Initialize UI components
    const chat = new Chat(conversationService, apiClient);
    
    // Assign to global for debugging purposes (optional)
    window.conversationService = conversationService;
    window.apiClient = apiClient;
    window.chat = chat;
    
    // Initialize voice components
    if (Utils.supportsWebSpeechAPI()) {
      const voiceInput = new VoiceInput(chat, conversationService);
      window.voiceInput = voiceInput;
    } else {
      console.info('Web Speech API not supported in this browser');
      // Disable voice input UI
      const voiceInputBtn = document.getElementById('voice-input-btn');
      if (voiceInputBtn) {
        voiceInputBtn.disabled = true;
        voiceInputBtn.title = 'Voice input not supported in this browser';
      }
    }
    
    if (Utils.supportsWebSpeechSynthesisAPI()) {
      const voiceOutput = new VoiceOutput();
      window.voiceOutput = voiceOutput;
      
      // Enhance the chat to use voice output
      const originalDisplayMessage = chat.displayMessage;
      chat.displayMessage = function(message) {
        // Call the original display function
        originalDisplayMessage.call(this, message);
        
        // If it's a bot message and voice output is enabled, speak it
        if (message.sender === 'bot' && voiceOutput.isVoiceOutputEnabled() && !voiceOutput.getIsPlaying()) {
          voiceOutput.speak(message.content);
        }
      };
    } else {
      console.info('Web Speech Synthesis API not supported in this browser');
      // Disable voice output UI
      const voiceOutputBtn = document.getElementById('voice-output-btn');
      if (voiceOutputBtn) {
        voiceOutputBtn.disabled = true;
        voiceOutputBtn.title = 'Voice output not supported in this browser';
      }
    }
    
    console.log('AI Chatbot application initialized successfully!');
    
  } catch (error) {
    console.error('Failed to initialize the application:', error);
    
    // Display error to user in the chat area if possible
    const chatHistoryElement = document.getElementById('chat-history');
    if (chatHistoryElement) {
      const errorMessage = document.createElement('div');
      errorMessage.className = 'message bot-message';
      errorMessage.innerHTML = `
        <div class="message-sender">System</div>
        <div class="message-content">
          <p><strong>Error:</strong> Failed to initialize the chatbot application.</p>
          <p>${error.message}</p>
        </div>
      `;
      chatHistoryElement.appendChild(errorMessage);
    }
  }
});

// Add error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});