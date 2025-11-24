/**
 * ErrorDisplay Component
 * Displays error messages with appropriate user guidance
 */
class ErrorDisplay {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      autoHide: options.autoHide !== false, // Default to true
      autoHideDelay: options.autoHideDelay || 10000, // 10 seconds
      showDetails: options.showDetails || false, // Whether to show technical details
      onRetry: options.onRetry || null, // Callback for retry action
      ...options
    };
    
    this.errorHandler = null;
    this.timeoutId = null;
    
    this.init();
  }

  async init() {
    // Import the error handler service
    const { default: errorHandler } = await import('../../services/errorHandler.js');
    this.errorHandler = errorHandler;
    
    // Render the component initially (hidden)
    this.render();
  }

  /**
   * Show an error message
   * @param {Error|Object} error - The error object or formatted error data
   * @param {Object} context - Additional context for the error
   * @returns {void}
   */
  showError(error, context = {}) {
    if (!this.container) {
      console.error(`Container with ID ${this.containerId} not found`);
      return;
    }
    
    // Format the error using the error handler
    const errorData = this.errorHandler.formatUserError(error, context);
    
    // Clear the container and render the error
    this.container.innerHTML = this.generateErrorHTML(errorData);
    
    // Auto-hide if enabled
    if (this.options.autoHide) {
      this.clearAutoHide();
      this.timeoutId = setTimeout(() => {
        this.hideError();
      }, this.options.autoHideDelay);
    }
    
    // Add event listeners for interactive elements
    this.addEventListeners();
  }

  /**
   * Hide the error message
   * @returns {void}
   */
  hideError() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.clearAutoHide();
  }

  /**
   * Clear the auto-hide timeout
   * @returns {void}
   */
  clearAutoHide() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  render() {
    // Initially render as empty container
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Generate HTML for the error display
   * @param {Object} errorData - Formatted error data from error handler
   * @returns {string} HTML string for the error display
   */
  generateErrorHTML(errorData) {
    let html = `
      <div class="error-container" style="
        background-color: var(--danger-color);
        color: white;
        padding: 1rem;
        border-radius: var(--border-radius);
        margin-bottom: 1rem;
        border-left: 4px solid #fff;
        position: relative;
      ">
    `;

    // Error title
    html += `<h3 style="margin: 0 0 0.5rem 0; font-size: 1.1em;">${errorData.title}</h3>`;
    
    // Error message
    html += `<p style="margin: 0 0 0.75rem 0;">${errorData.message}</p>`;
    
    // User action
    if (errorData.userAction) {
      html += `<p style="margin: 0 0 0.75rem 0; font-style: italic;"><strong>Action:</strong> ${errorData.userAction}</p>`;
    }
    
    // Suggestions
    if (errorData.suggestions && errorData.suggestions.length > 0) {
      html += `<p style="margin: 0 0 0.5rem 0;"><strong>Suggestions:</strong></p>`;
      html += `<ul style="margin: 0 0 0.75rem 1.5rem;">`;
      errorData.suggestions.forEach(suggestion => {
        html += `<li>${suggestion}</li>`;
      });
      html += `</ul>`;
    }
    
    // Next steps
    if (errorData.nextSteps && errorData.nextSteps.length > 0) {
      html += `<p style="margin: 0 0 0.5rem 0;"><strong>Next Steps:</strong></p>`;
      html += `<ul style="margin: 0 0 0.75rem 1.5rem;">`;
      errorData.nextSteps.forEach(step => {
        html += `<li>${step}</li>`;
      });
      html += `</ul>`;
    }
    
    // Technical details (only if showDetails is enabled)
    if (this.options.showDetails && errorData.technicalDetails) {
      html += `
        <details style="margin-top: 0.75rem; background: rgba(255,255,255,0.1); padding: 0.5rem; border-radius: calc(var(--border-radius) * 0.5);">
          <summary style="cursor: pointer; font-weight: bold;">Technical Details</summary>
          <pre style="white-space: pre-wrap; word-break: break-word; margin: 0.5rem 0; font-size: 0.85em;">${errorData.technicalDetails}</pre>
        </details>
      `;
    }
    
    // Action buttons
    html += '<div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">';
    
    // Retry button (if onRetry callback provided)
    if (this.options.onRetry) {
      html += `
        <button id="error-retry-btn" style="
          background-color: white;
          color: var(--danger-color);
          border: 1px solid white;
          border-radius: calc(var(--border-radius) * 0.75);
          padding: 0.375rem 0.75rem;
          cursor: pointer;
          font-size: 0.9rem;
        ">Retry</button>
      `;
    }
    
    // Hide button
    html += `
      <button id="error-hide-btn" style="
        background-color: rgba(255,255,255,0.2);
        color: white;
        border: 1px solid rgba(255,255,255,0.5);
        border-radius: calc(var(--border-radius) * 0.75);
        padding: 0.375rem 0.75rem;
        cursor: pointer;
        font-size: 0.9rem;
      ">Hide</button>
    `;
    
    html += '</div></div>';
    
    return html;
  }

  /**
   * Add event listeners for interactive elements
   * @returns {void}
   */
  addEventListeners() {
    // Retry button event listener
    if (this.options.onRetry) {
      const retryBtn = this.container.querySelector('#error-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          this.options.onRetry();
          this.hideError();
        });
      }
    }
    
    // Hide button event listener
    const hideBtn = this.container.querySelector('#error-hide-btn');
    if (hideBtn) {
      hideBtn.addEventListener('click', () => {
        this.hideError();
      });
    }
  }

  /**
   * Show a specific error type without needing to create a full error object
   * @param {string} errorType - The type of error to show
   * @param {string} customMessage - Optional custom message
   * @param {Object} context - Additional context
   * @returns {void}
   */
  showErrorByType(errorType, customMessage = null, context = {}) {
    // Create a mock error object based on the error type
    const mockError = new Error(customMessage || 'An error occurred');
    
    // Add properties to help determine the error type
    let status;
    switch (errorType) {
      case 'RATE_LIMIT':
        mockError.message = customMessage || 'Rate limit exceeded';
        status = 429;
        break;
      case 'NETWORK':
        mockError.message = customMessage || 'Network error';
        break;
      case 'QUOTA':
        mockError.message = customMessage || 'Usage quota exceeded';
        break;
      case 'PROVIDER':
        mockError.message = customMessage || 'Provider unavailable';
        status = 503;
        break;
      case 'AUTH':
        mockError.message = customMessage || 'Authentication error';
        status = 401;
        break;
      default:
        mockError.message = customMessage || 'An error occurred';
        break;
    }
    
    if (status) {
      mockError.status = status;
    }
    
    this.showError(mockError, context);
  }

  /**
   * Destroy the component and clean up resources
   * @returns {void}
   */
  destroy() {
    this.clearAutoHide();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default ErrorDisplay;