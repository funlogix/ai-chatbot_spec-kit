// API client for Groq integration

class ApiClient {
  constructor() {
    this.baseUrl = CONFIG.GROQ_API_BASE_URL;
    this.apiKey = CONFIG.GROQ_API_KEY;
    this.defaultModel = CONFIG.GROQ_DEFAULT_MODEL;
    this.retryAttempts = CONFIG.RETRY_ATTEMPTS;
    this.retryDelayBase = CONFIG.RETRY_DELAY_BASE;
  }

  // Set API key (should be called after loading from secure source)
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  // Send a text message to the Groq API
  async sendTextMessage(message, conversationId = null) {
    if (!this.apiKey) {
      throw new Error('API key not set. Please configure GROQ_API_KEY in config.js');
    }

    const body = {
      model: this.defaultModel,
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      stream: false,
      stop: null
    };

    // Add conversation context if available
    if (conversationId) {
      // In a real implementation, we'd include conversation history
      // For this simple version, we're just passing the current message
    }

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(body)
        });

        // Check for rate limit errors
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelayBase * Math.pow(2, attempt);
          
          console.warn(`Rate limit hit. Waiting ${delay}ms before retry ${attempt + 1}/${this.retryAttempts}`);
          await Utils.sleep(delay);
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        // Check if response has the expected format
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response format from API');
        }

        return {
          response: data.choices[0].message.content,
          conversationId: conversationId || Utils.generateId(),
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error.message);
        
        // If this was the last attempt, throw the error
        if (attempt === this.retryAttempts) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = this.retryDelayBase * Math.pow(2, attempt);
        console.log(`Waiting ${delay}ms before retry...`);
        await Utils.sleep(delay);
      }
    }
  }

  // Check API key validity
  async validateApiKey() {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  }

  // Get available models
  async getAvailableModels() {
    if (!this.apiKey) {
      throw new Error('API key not set. Please configure GROQ_API_KEY in config.js');
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  // Process voice to text (in a real app this would call a different API)
  // For this implementation, we'll simulate it since browsers handle speech recognition client-side
  async processVoiceToText(audioFile) {
    // This is a placeholder for the actual voice-to-text processing
    // In a real implementation, you might either:
    // 1. Use the browser's SpeechRecognition API (which is client-side)
    // 2. Send audio to a specialized service if needed
    throw new Error('Voice to text processing is handled client-side via browser APIs in this implementation');
  }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiClient;
} else {
  window.ApiClient = ApiClient;
}