/**
 * ProviderSelector Component
 * Allows users to select from available AI providers
 */
class ProviderSelector {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      displayType: options.displayType || 'dropdown', // 'dropdown' or 'radio'
      showModelSelector: options.showModelSelector !== false, // Default to true
      onProviderChange: options.onProviderChange || null,
      onModelChange: options.onModelChange || null,
      ...options
    };
    
    this.providers = [];
    this.selectedProviderId = null;
    this.selectedModelId = null;
    this.providerService = null;
    
    this.init();
  }

  async init() {
    // Import the provider service
    const { default: providerService } = await import('../../services/api/providerService.js');
    this.providerService = providerService;
    
    // Load available providers
    await this.loadProviders();
    
    // Render the component
    this.render();
    this.attachEventListeners();
  }

  async loadProviders() {
    try {
      this.providers = await this.providerService.getAvailableProviders();
    } catch (error) {
      console.error('Error loading providers:', error);
      // Show error to user
      this.showError('Failed to load providers. Please try again later.');
    }
  }

  render() {
    if (!this.container) {
      console.error(`Container with ID ${this.containerId} not found`);
      return;
    }
    
    // Clear the container
    this.container.innerHTML = '';
    
    // Create the main wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'provider-selector';
    
    // Create label
    const label = document.createElement('label');
    label.textContent = 'Select AI Provider:';
    label.setAttribute('for', 'provider-select');
    
    // Create the provider selection element based on display type
    let providerElement;
    if (this.options.displayType === 'radio') {
      providerElement = this.createRadioSelection();
    } else {
      providerElement = this.createDropdownSelection();
    }
    
    // Add label and selection element to wrapper
    wrapper.appendChild(label);
    wrapper.appendChild(providerElement);
    
    // Add privacy information container if needed
    const privacyContainer = document.createElement('div');
    privacyContainer.id = 'provider-privacy-info';
    privacyContainer.style.marginTop = '0.5rem';
    privacyContainer.style.padding = '0.5rem';
    privacyContainer.style.border = '1px solid #dee2e6';
    privacyContainer.style.borderRadius = '4px';
    privacyContainer.style.display = 'none'; // Initially hidden
    wrapper.appendChild(privacyContainer);
    
    // Add to container
    this.container.appendChild(wrapper);
  }

  createDropdownSelection() {
    const select = document.createElement('select');
    select.id = 'provider-select';
    select.className = 'provider-select';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Choose a provider...';
    select.appendChild(defaultOption);
    
    // Add options for each provider
    this.providers.forEach(provider => {
      const option = document.createElement('option');
      option.value = provider.providerId;
      option.textContent = provider.providerName;
      if (provider.providerId === this.selectedProviderId) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    return select;
  }

  createRadioSelection() {
    const radioContainer = document.createElement('div');
    radioContainer.className = 'provider-radios';
    
    this.providers.forEach((provider, index) => {
      const radioWrapper = document.createElement('div');
      radioWrapper.style.display = 'flex';
      radioWrapper.style.alignItems = 'center';
      radioWrapper.style.marginBottom = '0.5rem';
      
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.id = `provider-${provider.providerId}`;
      radio.name = 'provider-selector';
      radio.value = provider.providerId;
      if (provider.providerId === this.selectedProviderId) {
        radio.checked = true;
      }
      
      const label = document.createElement('label');
      label.htmlFor = `provider-${provider.providerId}`;
      label.style.marginLeft = '0.5rem';
      label.textContent = provider.providerName;
      
      radioWrapper.appendChild(radio);
      radioWrapper.appendChild(label);
      radioContainer.appendChild(radioWrapper);
    });
    
    return radioContainer;
  }

  attachEventListeners() {
    if (this.options.displayType === 'radio') {
      // For radio buttons, add change listener to the container
      const radioContainer = this.container.querySelector('.provider-radios');
      radioContainer.addEventListener('change', (e) => {
        if (e.target.type === 'radio') {
          this.handleProviderChange(e.target.value);
        }
      });
    } else {
      // For dropdown, add change listener to select
      const select = this.container.querySelector('#provider-select');
      select.addEventListener('change', (e) => {
        this.handleProviderChange(e.target.value);
      });
    }
  }

  async handleProviderChange(providerId) {
    if (!providerId) {
      // Reset selection
      this.selectedProviderId = null;
      this.selectedModelId = null;
      this.hidePrivacyInfo();
      if (this.options.onProviderChange) {
        await this.options.onProviderChange(null, null);
      }
      return;
    }

    this.selectedProviderId = providerId;

    // Update privacy info display
    await this.updatePrivacyInfo(providerId);

    // If model selector should be shown, handle model selection too
    if (this.options.showModelSelector) {
      // We'll trigger the model selector to load models for this provider
      // This would happen in coordination with the ModelSelector component
    }

    // First check provider status and rate limits before selecting
    try {
      // Import the provider service
      const { default: providerService } = await import('../../services/api/providerService.js');

      // Check the provider's status
      const status = await providerService.getProviderStatus(providerId);
      console.log('Provider status:', status);

      // If provider is not connectable, warn the user
      if (!status.canConnect) {
        this.showError(`Error: ${status.providerId} is currently unavailable. Please select a different provider or try again later.`);
      }

      // Check rate limits for the provider
      const rateLimitStatus = await providerService.getRateLimits();
      const providerRateLimit = rateLimitStatus[providerId];

      if (providerRateLimit) {
        // Display rate limit information to the user
        console.log(`Rate limit status for ${providerId}:`, providerRateLimit);

        // Warn if approaching limits
        if (providerRateLimit.remainingRequestsPerMinute < 5) {
          this.showError(`Warning: Approaching rate limit for ${status.providerId}. ${providerRateLimit.remainingRequestsPerMinute} requests remaining this minute.`);
        }
      }

      // Call the API to select the provider
      const result = await providerService.selectProvider(providerId, this.selectedModelId);

      console.log('Provider selected successfully:', result);

      // Call the callback if provided
      if (this.options.onProviderChange) {
        await this.options.onProviderChange(providerId, this.selectedModelId);
      }
    } catch (error) {
      console.error('Error selecting provider:', error);
      this.showError(`Failed to select provider: ${error.message}`);
    }
  }

  async updatePrivacyInfo(providerId) {
    // In a real implementation, this would fetch privacy information for the provider
    // For now, we'll use placeholder information

    const privacyContainer = this.container.querySelector('#provider-privacy-info');

    if (!providerId) {
      privacyContainer.style.display = 'none';
      return;
    }

    try {
      // Find the provider
      const provider = this.providers.find(p => p.providerId === providerId);
      if (!provider) {
        throw new Error(`Provider with ID ${providerId} not found`);
      }

      // For this implementation, we'll use specific privacy information for each provider
      // In a real implementation, this would come from a backend service
      let privacyInfo = '';

      switch(provider.providerName.toLowerCase()) {
        case 'groq':
          privacyInfo = `
            <strong>Privacy Information for ${provider.providerName}:</strong><br>
            Groq may collect usage data for service improvement and system optimization.
            Your input and output data are not stored for training purposes.
            For complete details, please review the provider's
            <a href="https://www.groq.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.`;
          break;
        case 'openai':
          privacyInfo = `
            <strong>Privacy Information for ${provider.providerName}:</strong><br>
            OpenAI retains data for 30 days for AI output improvements unless you opt out.
            They do not use your data to train their models by default.
            For complete details, please review the provider's
            <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.`;
          break;
        case 'gemini':
          privacyInfo = `
            <strong>Privacy Information for ${provider.providerName}:</strong><br>
            Google may use your conversations to improve their services unless you opt out.
            Your data is not used for personalized ads.
            For complete details, please review the provider's
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.`;
          break;
        case 'openrouter':
          privacyInfo = `
            <strong>Privacy Information for ${provider.providerName}:</strong><br>
            OpenRouter acts as a proxy and may log usage for operational purposes.
            Your data is sent to the underlying provider according to their privacy policy.
            For complete details, please review the provider's
            <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.`;
          break;
        default:
          privacyInfo = `
            <strong>Privacy Information for ${provider.providerName}:</strong><br>
            This provider may collect usage data for service improvement.
            Data is not used for training purposes in free tier.
            For complete details, please review the provider's
            <a href="#" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.`;
      }

      privacyContainer.innerHTML = privacyInfo;
      privacyContainer.style.display = 'block';
    } catch (error) {
      console.error('Error updating privacy info:', error);
      privacyContainer.innerHTML = `<strong>Privacy Information:</strong><br>Unable to load privacy information for ${provider.providerName}. Privacy information not available.`;
      privacyContainer.style.display = 'block';
    }
  }

  hidePrivacyInfo() {
    const privacyContainer = this.container.querySelector('#provider-privacy-info');
    privacyContainer.style.display = 'none';
  }

  showError(message) {
    // Create and show an error element
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.textContent = message;
    
    // Clear container and add error
    this.container.innerHTML = '';
    this.container.appendChild(errorContainer);
  }

  // Method to programmatically select a provider
  async selectProvider(providerId) {
    if (this.options.displayType === 'dropdown') {
      const select = this.container.querySelector('#provider-select');
      select.value = providerId;
      // Trigger change event
      select.dispatchEvent(new Event('change'));
    } else {
      const radio = this.container.querySelector(`input[value="${providerId}"]`);
      if (radio) {
        radio.checked = true;
        // Trigger change event
        radio.dispatchEvent(new Event('change'));
      }
    }
  }
}

export default ProviderSelector;