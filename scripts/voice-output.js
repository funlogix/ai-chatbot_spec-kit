// Voice output processing using browser Web Speech API

class VoiceOutput {
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.isSupported = this.checkSupport();
    this.isPlaying = false;
    this.currentUtterance = null;
    
    // DOM elements
    this.voiceOutputButton = document.getElementById('voice-output-btn');
    
    this.init();
  }

  init() {
    if (this.isSupported) {
      // Bind event listeners
      this.voiceOutputButton.addEventListener('click', () => this.toggleVoiceOutput());
      
      // Listen for speech events
      this.speechSynthesis.addEventListener('voiceschanged', () => {
        // Update available voices if needed
        this.updateAvailableVoices();
      });
    } else {
      // Disable the button if not supported
      this.voiceOutputButton.disabled = true;
      this.voiceOutputButton.title = 'Voice output not supported in this browser';
      console.warn('Web Speech Synthesis API not supported in this browser');
    }
  }

  checkSupport() {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  toggleVoiceOutput() {
    if (!this.isSupported) {
      this.showNotSupportedMessage();
      return;
    }

    // Toggle active class on button
    this.voiceOutputButton.classList.toggle('active');
    const isActive = this.voiceOutputButton.classList.contains('active');
    
    this.voiceOutputButton.title = isActive 
      ? 'Voice output enabled - bot responses will be spoken' 
      : 'Voice output disabled - bot responses will be text only';
  }

  speak(text) {
    if (!this.isSupported || !text) {
      return;
    }

    // Check if voice output is enabled
    const isVoiceEnabled = this.voiceOutputButton.classList.contains('active');
    if (!isVoiceEnabled) {
      // If voice is disabled, just return
      return;
    }

    // Cancel any current speech
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance with default settings
    utterance.rate = CONFIG.VOICE_DEFAULT_RATE;
    utterance.pitch = CONFIG.VOICE_DEFAULT_PITCH;
    utterance.volume = CONFIG.VOICE_DEFAULT_VOLUME;
    
    // Try to set the best available voice
    const voices = this.getAvailableVoices();
    if (voices.length > 0) {
      // Try to find a voice for the default language
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(CONFIG.VOICE_DEFAULT_LANGUAGE.split('-')[0])
      ) || voices[0]; // Fallback to first voice
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }
    
    // Set up event handlers
    utterance.onstart = () => {
      this.isPlaying = true;
    };
    
    utterance.onend = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isPlaying = false;
      this.currentUtterance = null;
    };
    
    // Speak the text
    this.speechSynthesis.speak(utterance);
    this.currentUtterance = utterance;
  }

  stop() {
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
      this.isPlaying = false;
      this.currentUtterance = null;
    }
  }

  pause() {
    if (this.speechSynthesis.speaking && !this.speechSynthesis.paused) {
      this.speechSynthesis.pause();
    }
  }

  resume() {
    if (this.speechSynthesis.paused) {
      this.speechSynthesis.resume();
    }
  }

  getAvailableVoices() {
    return this.speechSynthesis.getVoices();
  }

  updateAvailableVoices() {
    // This can be used to update the UI with available voices
    // For now, we'll just log the available voices
    const voices = this.getAvailableVoices();
    console.log(`Available voices: ${voices.length}`);
  }

  setVoiceRate(rate) {
    // Note: Rate can't be changed while speaking, only for next utterance
    CONFIG.VOICE_DEFAULT_RATE = Math.max(0.1, Math.min(10, rate)); // Limit between 0.1 and 10
  }

  setVoicePitch(pitch) {
    // Note: Pitch can't be changed while speaking, only for next utterance
    CONFIG.VOICE_DEFAULT_PITCH = Math.max(0, Math.min(2, pitch)); // Limit between 0 and 2
  }

  setVoiceVolume(volume) {
    // Note: Volume can't be changed while speaking, only for next utterance
    CONFIG.VOICE_DEFAULT_VOLUME = Math.max(0, Math.min(1, volume)); // Limit between 0 and 1
  }

  // Check if voice output is enabled
  isVoiceOutputEnabled() {
    return this.voiceOutputButton.classList.contains('active');
  }

  // Check if speech is currently playing
  getIsPlaying() {
    return this.isPlaying;
  }

  showNotSupportedMessage() {
    // In this implementation, we'll log a message to the console
    // In a real application, you might want to notify the user in the UI
    console.warn("Voice output is not supported in your current browser. Please try Chrome, Edge, or Safari.");
  }

  // Implement fallback to text-only when voice fails
  setFallbackToTextOnly() {
    // Disable voice output and ensure text-only mode
    this.voiceOutputButton.classList.remove('active');
    this.voiceOutputButton.title = 'Voice output not supported. Responses will be text only.';
  }

  // Get voice output status
  getStatus() {
    return {
      isSupported: this.isSupported,
      isEnabled: this.isVoiceOutputEnabled(),
      isPlaying: this.getIsPlaying(),
      availableVoices: this.getAvailableVoices().length
    };
  }
}

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceOutput;
} else {
  window.VoiceOutput = VoiceOutput;
}