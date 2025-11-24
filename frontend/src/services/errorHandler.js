/**
 * Error Handler Service
 * Handles errors and provides appropriate user guidance for different error types
 */
class ErrorHandler {
  constructor() {
    // Define error types and their handling strategies
    this.errorTypes = {
      PROVIDER_UNAVAILABLE: 'PROVIDER_UNAVAILABLE',
      RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
      INVALID_API_KEY: 'INVALID_API_KEY',
      NETWORK_ERROR: 'NETWORK_ERROR',
      REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
      QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
      MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
      MALFORMED_REQUEST: 'MALFORMED_REQUEST'
    };
  }

  /**
   * Determine the error type based on error properties or message
   * @param {Error|Object} error - The error object
   * @returns {string} Error type
   */
  determineErrorType(error) {
    if (!error) return null;
    
    // Check for specific error properties
    if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
      return this.errorTypes.RATE_LIMIT_EXCEEDED;
    }
    
    if (error.status === 401 || error.status === 403 || error.message.toLowerCase().includes('invalid api')) {
      return this.errorTypes.INVALID_API_KEY;
    }
    
    if (error.status === 404 || error.message.toLowerCase().includes('model')) {
      return this.errorTypes.MODEL_UNAVAILABLE;
    }
    
    if (error.status === 408 || error.message.toLowerCase().includes('timeout')) {
      return this.errorTypes.REQUEST_TIMEOUT;
    }
    
    if (error.status === 400 || error.message.toLowerCase().includes('malformed')) {
      return this.errorTypes.MALFORMED_REQUEST;
    }
    
    if (error.status >= 500 || error.message.toLowerCase().includes('server error')) {
      return this.errorTypes.PROVIDER_UNAVAILABLE;
    }
    
    if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('fetch')) {
      return this.errorTypes.NETWORK_ERROR;
    }
    
    if (error.message.toLowerCase().includes('quota')) {
      return this.errorTypes.QUOTA_EXCEEDED;
    }
    
    // Default to provider unavailable for other errors
    return this.errorTypes.PROVIDER_UNAVAILABLE;
  }

  /**
   * Generate user guidance for a specific error type
   * @param {string} errorType - The error type
   * @param {Object} context - Additional context for the error
   * @returns {Object} Guidance object with message and action recommendations
   */
  getUserGuidance(errorType, context = {}) {
    const guidance = {
      errorType,
      title: '',
      message: '',
      userAction: '',
      technicalDetails: context.originalError?.message || '',
      suggestions: [],
      nextSteps: []
    };

    switch (errorType) {
      case this.errorTypes.PROVIDER_UNAVAILABLE:
        guidance.title = 'Provider Unavailable';
        guidance.message = `The selected AI provider is currently unavailable. The service may be experiencing issues or undergoing maintenance.`;
        guidance.userAction = 'Please try again later or switch to a different provider.';
        guidance.suggestions = [
          'Try switching to a different provider from the dropdown menu',
          'Check your internet connection',
          'Try again in a few minutes'
        ];
        guidance.nextSteps = [
          'Navigate to provider settings to select a different AI provider',
          'Verify your connection and retry the request'
        ];
        break;

      case this.errorTypes.RATE_LIMIT_EXCEEDED:
        guidance.title = 'Rate Limit Exceeded';
        guidance.message = `You've exceeded the rate limit for the selected provider. This is based on the provider's specific rate limits (requests per minute, requests per day, etc.).`;
        guidance.userAction = 'Please wait before making more requests or switch to a different provider.';
        if (context.timeToReset) {
          const minutes = Math.ceil(context.timeToReset / 60);
          guidance.userAction = `Please wait ${minutes} minute(s) before making more requests or switch to a different provider.`;
        }
        guidance.suggestions = [
          'Wait for the rate limit to reset',
          'Switch to a different provider',
          'Reduce the frequency of your requests',
          'Consider upgrading to a paid tier if available'
        ];
        guidance.nextSteps = [
          'Wait for the specified time and retry',
          'Select another provider from the settings',
          'Check provider-specific rate limits in documentation'
        ];
        break;

      case this.errorTypes.INVALID_API_KEY:
        guidance.title = 'Invalid API Key';
        guidance.message = `The API key for the selected provider is invalid or has expired.`;
        guidance.userAction = 'Please verify your API key in the configuration settings.';
        guidance.suggestions = [
          'Double-check the API key in provider settings',
          'Regenerate the API key from the provider dashboard',
          'Ensure no extra spaces or characters were added',
          'Contact your system administrator if using a shared key'
        ];
        guidance.nextSteps = [
          'Navigate to provider configuration',
          'Update the API key with the correct value',
          'Test the connection'
        ];
        break;

      case this.errorTypes.NETWORK_ERROR:
        guidance.title = 'Network Error';
        guidance.message = `There was an issue connecting to the AI provider. This may be due to network connectivity problems.`;
        guidance.userAction = 'Please check your internet connection and try again.';
        guidance.suggestions = [
          'Verify your internet connection',
          'Check your firewall or proxy settings',
          'Try accessing other websites to confirm connectivity',
          'Restart your network connection'
        ];
        guidance.nextSteps = [
          'Check your network settings',
          'Retry the request after confirming connectivity',
          'Try using a different network if possible'
        ];
        break;

      case this.errorTypes.REQUEST_TIMEOUT:
        guidance.title = 'Request Timeout';
        guidance.message = `The request to the AI provider took too long to complete.`;
        guidance.userAction = 'Please try again, possibly with a shorter input.';
        guidance.suggestions = [
          'Reduce the length of your input text',
          'Try a simpler query',
          'Check your network connection',
          'Try again during off-peak hours'
        ];
        guidance.nextSteps = [
          'Modify your request to be shorter or simpler',
          'Retry the request',
          'Consider using a different provider'
        ];
        break;

      case this.errorTypes.QUOTA_EXCEEDED:
        guidance.title = 'Usage Quota Exceeded';
        guidance.message = `You've exceeded your usage quota for the selected provider. This could be a daily, monthly, or overall limit.`;
        guidance.userAction = 'Please check your usage limits or switch to a different provider.';
        guidance.suggestions = [
          'Check your provider account for usage limits',
          'Consider upgrading to a higher tier',
          'Wait until the quota resets (often daily or monthly)',
          'Switch to a different provider for now'
        ];
        guidance.nextSteps = [
          'Review your provider account settings',
          'Consider switching to a provider with a higher limit',
          'Plan your API usage more efficiently'
        ];
        break;

      case this.errorTypes.MODEL_UNAVAILABLE:
        guidance.title = 'Model Unavailable';
        guidance.message = `The selected model is currently unavailable from the provider.`;
        guidance.userAction = 'Please select a different model from the same provider or switch providers.';
        guidance.suggestions = [
          'Choose a different model from the provider',
          'Try again later when the model might be available',
          'Use a similar model from another provider',
          'Check provider status for any known issues'
        ];
        guidance.nextSteps = [
          'Select another model in the settings',
          'Try a different provider',
          'Check the provider status dashboard'
        ];
        break;

      case this.errorTypes.MALFORMED_REQUEST:
        guidance.title = 'Invalid Request';
        guidance.message = 'The request sent to the provider was malformed or contained invalid parameters.';
        guidance.userAction = 'The application may need to be updated or the input corrected.';
        guidance.suggestions = [
          'Try rephrasing your query',
          'Make sure your input is in the expected format',
          'Report this issue to the application developers'
        ];
        guidance.nextSteps = [
          'Try a simpler request',
          'Contact support if the problem persists',
          'Check application logs for more details'
        ];
        break;

      default:
        // Default case for unknown errors
        guidance.title = 'An Error Occurred';
        guidance.message = 'An unexpected error occurred while processing your request.';
        guidance.userAction = 'Please try again later.';
        guidance.suggestions = [
          'Refresh the page',
          'Try again after a few minutes',
          'Switch to a different provider',
          'Contact support if the issue persists'
        ];
        guidance.nextSteps = [
          'Retry the request',
          'Try a different provider',
          'Contact technical support'
        ];
        break;
    }

    return guidance;
  }

  /**
   * Format an error message for display to the user
   * @param {Error|Object} error - The error object
   * @param {Object} context - Additional context for the error
   * @returns {Object} Formatted error object with user-friendly information
   */
  formatUserError(error, context = {}) {
    const errorType = this.determineErrorType(error);
    const guidance = this.getUserGuidance(errorType, { 
      ...context, 
      originalError: error 
    });

    return {
      success: false,
      errorType,
      title: guidance.title,
      message: guidance.message,
      userAction: guidance.userAction,
      suggestions: guidance.suggestions,
      nextSteps: guidance.nextSteps,
      technicalDetails: error.message || error.toString()
    };
  }

  /**
   * Handle an error by generating appropriate user feedback
   * @param {Error|Object} error - The error object
   * @param {Object} context - Additional context for the error
   * @returns {Object} Error handling result
   */
  handleError(error, context = {}) {
    console.error('Error handled by ErrorHandler:', error);
    
    // Create a user-friendly error message
    const formattedError = this.formatUserError(error, context);
    
    // Log error for debugging purposes
    this.logError(error, context);
    
    return formattedError;
  }

  /**
   * Log the error for debugging and monitoring
   * @param {Error|Object} error - The error object
   * @param {Object} context - Additional context for the error
   * @returns {void}
   */
  logError(error, context = {}) {
    // In a real application, this would send to a logging service
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: error.message || error.toString(),
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('Error Log:', logEntry);
    
    // Store in localStorage for debugging (in real app, use a remote logging service)
    try {
      let errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      errorLogs.push(logEntry);
      
      // Keep only the last 100 log entries
      if (errorLogs.length > 100) {
        errorLogs = errorLogs.slice(-100);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
    } catch (e) {
      // If we can't log to localStorage, that's okay
      console.warn('Could not store error log in localStorage:', e);
    }
  }

  /**
   * Display an error message to the user using the UI
   * @param {Object} errorData - Formatted error data from formatUserError
   * @param {string} containerId - ID of the container element to display the error in
   * @returns {void}
   */
  displayError(errorData, containerId) {
    if (!containerId) {
      console.warn('No container ID provided for error display');
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container with ID ${containerId} not found for error display`);
      return;
    }

    // Create error display element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.backgroundColor = 'var(--danger-color)';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '1rem';
    errorDiv.style.borderRadius = 'var(--border-radius)';
    errorDiv.style.marginBottom = '1rem';
    errorDiv.style.borderLeft = '4px solid #fff';

    // Construct the error message
    let errorMessage = `<strong>${errorData.title}</strong><br>`;
    errorMessage += `${errorData.message}<br><br>`;
    
    if (errorData.userAction) {
      errorMessage += `<em>${errorData.userAction}</em><br><br>`;
    }

    if (errorData.suggestions && errorData.suggestions.length > 0) {
      errorMessage += `<strong>Suggestions:</strong><ul style="margin: 0.5rem 0 0.5rem 1rem;">`;
      errorData.suggestions.forEach(suggestion => {
        errorMessage += `<li>${suggestion}</li>`;
      });
      errorMessage += '</ul>';
    }

    if (errorData.nextSteps && errorData.nextSteps.length > 0) {
      errorMessage += `<strong>Next Steps:</strong><ul style="margin: 0.5rem 0 0.5rem 1rem;">`;
      errorData.nextSteps.forEach(step => {
        errorMessage += `<li>${step}</li>`;
      });
      errorMessage += '</ul>';
    }

    errorDiv.innerHTML = errorMessage;

    // Clear previous error messages and add the new one
    container.innerHTML = '';
    container.appendChild(errorDiv);
  }
}

// Export a singleton instance
const errorHandler = new ErrorHandler();
export default errorHandler;