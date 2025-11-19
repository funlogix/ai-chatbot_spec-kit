// Utility functions for common operations

const Utils = {
  // Generate a random ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // Format timestamp for display
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  // Format date for display
  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  },

  // Check if the current time is within the same day as the provided timestamp
  isToday(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  },

  // Format timestamp relative to now (e.g., "2 minutes ago")
  formatRelativeTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  },

  // Sanitize HTML to prevent XSS (basic implementation)
  sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  },

  // Validate if a string is a valid URL
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },

  // Debounce function to limit function calls
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function to limit function calls
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  },

  // Deep clone an object
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Check if device supports Web Speech API
  supportsWebSpeechAPI() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window ||
           'SpeechGrammarList' in window || 'webkitSpeechGrammarList' in window;
  },

  // Check if device supports Web Speech Synthesis API
  supportsWebSpeechSynthesisAPI() {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  },

  // Format file size in human readable format
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Validate email format
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Sleep/delay function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Extract text from HTML
  extractTextFromHTML(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  },

  // Check if string contains profanity (simple implementation)
  containsProfanity(text) {
    // This is a simplified implementation - in a real app, you'd want a more robust solution
    const profanityList = ['badword1', 'badword2']; // This would be a much larger list in reality
    const lowerText = text.toLowerCase();
    return profanityList.some(word => lowerText.includes(word));
  }
};

// Export for use in other modules (if using modules) or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
} else {
  window.Utils = Utils;
}