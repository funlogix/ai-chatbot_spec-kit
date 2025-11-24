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

  loadProviders = async () => {
    try {
      this.providers = await this.providerService.getAvailableProviders();
    } catch (error) {
      console.error('Error loading providers:', error);
      // Show error to user
      this.showError('Failed to load providers. Please try again later.');
    }
  }

  render = () => {
    if (!this.container) {
      console.error(`Container with ID ${this.containerId} not found`);
      return;
    }

    // Clear only the provider selector section, not the whole container
    const existingWrapper = this.container.querySelector('.provider-selector-wrapper');
    if (existingWrapper) {
      existingWrapper.remove();
    }

    // Create the main wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'provider-selector-wrapper'; // Changed to avoid conflict with internal elements

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

  createDropdownSelection = () => {
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
      option.value = provider.id; // Use 'id' instead of 'providerId' to match backend API
      option.textContent = provider.name; // Use 'name' instead of 'providerName' to match backend API
      if (provider.id === this.selectedProviderId) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    return select;
  }

  createRadioSelection = () => {
    const radioContainer = document.createElement('div');
    radioContainer.className = 'provider-radios';

    this.providers.forEach((provider, index) => {
      const radioWrapper = document.createElement('div');
      radioWrapper.style.display = 'flex';
      radioWrapper.style.alignItems = 'center';
      radioWrapper.style.marginBottom = '0.5rem';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.id = `provider-${provider.id}`;
      radio.name = 'provider-selector';
      radio.value = provider.id;
      if (provider.id === this.selectedProviderId) {
        radio.checked = true;
      }

      const label = document.createElement('label');
      label.htmlFor = `provider-${provider.id}`;
      label.style.marginLeft = '0.5rem';
      label.textContent = provider.name;

      radioWrapper.appendChild(radio);
      radioWrapper.appendChild(label);
      radioContainer.appendChild(radioWrapper);
    });

    return radioContainer;
  }

  attachEventListeners = () => {
    if (this.options.displayType === 'radio') {
      // For radio buttons, add change listener to the container
      const radioContainer = this.container.querySelector('.provider-radios');
      if (radioContainer) {
        radioContainer.addEventListener('change', (e) => {
          if (e.target.type === 'radio') {
            this.handleProviderChange(e.target.value);
          }
        });
      }
    } else {
      // For dropdown, add change listener to select
      const select = this.container.querySelector('#provider-select');
      if (select) {
        select.addEventListener('change', (e) => {
          this.handleProviderChange(e.target.value);
        });
      }
    }
  }

  handleProviderChange = async (providerId) => {
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

    // Check if providerId is valid (not empty/null/default option)
    if (!providerId) {
      // If user selects the default option or a blank value, don't proceed with selection
      console.log('No provider selected, ignoring selection');
      // Just update the current provider to null or keep the previous selection
      if (this.options.onProviderChange) {
        await this.options.onProviderChange(null, null);
      }
      return; // Don't execute the rest of the function
    }

    // First check provider status and rate limits before selecting
    try {
      // Check the provider's status via direct API call
      const baseURL = 'http://localhost:3000'; // This could be configured via environment
      const statusResponse = await fetch(`${baseURL}/api/providers/${providerId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({}));
        throw new Error(`Failed to get provider status: ${statusResponse.status} - ${errorData.error || statusResponse.statusText}`);
      }

      const status = await statusResponse.json();
      console.log('Provider status:', status);

      // If provider is not connectable, warn the user
      // Check multiple possible status flags from the backend response
      const isNotAvailable =
        status.status === 'unavailable' ||
        status.status === 'missing_api_key' ||
        (status.hasOwnProperty('hasApiKey') && !status.hasApiKey);

      if (isNotAvailable) {
        this.showError(`Error: ${status.id} is currently unavailable. Please select a different provider or try again later.`);
      }

      // Call the API to select the provider
      const selectResponse = await fetch(`${baseURL}/api/providers/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ providerId })
      });

      if (!selectResponse.ok) {
        const errorData = await selectResponse.json().catch(() => ({}));

        // Handle different types of errors appropriately
        if (errorData.error && errorData.error.includes('API key needs to be configured')) {
          // Show user-friendly message about missing API key
          this.showError(`API key not configured for ${providerId}. Please configure an API key in the admin panel to use this provider.`);
          return; // Exit early without calling the callback
        } else if (selectResponse.status === 404) {
          // Provider doesn't exist in the backend at all
          this.showError(`Provider "${providerId}" is not configured on the server. This provider may not be supported or needs to be configured by an administrator.`);
          return; // Exit early without calling the callback
        } else {
          throw new Error(`Failed to select provider: ${selectResponse.status} - ${errorData.error || selectResponse.statusText}`);
        }
      }

      const result = await selectResponse.json();
      console.log('Provider selected successfully:', result);

      // Get default model for the selected provider
      let defaultModelId = null;

      try {
        // Define the base URL for API requests
        const baseURL = 'http://localhost:3000';  // Or get from environment/config
        // Get the full provider information to determine the default model
        const providersResponse = await fetch(`${baseURL}/api/providers/available`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (providersResponse.ok) {
          const { providers } = await providersResponse.json();
          const provider = providers.find(p => p.id === providerId);
          if (provider && provider.config && provider.config.defaultModel) {
            defaultModelId = provider.config.defaultModel;
          }
        }
      } catch (modelError) {
        console.error(`Error getting default model for provider ${providerId}:`, modelError);
        // Continue with null default model
      }

      // Call the callback if provided
      if (this.options.onProviderChange) {
        await this.options.onProviderChange(providerId, defaultModelId);
      }
    } catch (error) {
      console.error('Error selecting provider:', error);

      // Check for specific error types and provide appropriate user guidance
      if (error.message.includes('404 - Provider not found')) {
        this.showError(`Provider "${providerId}" is not configured on the server. This provider may not be supported or needs to be configured by an administrator.`);
      } else if (error.message.includes('400 - API key needs to be configured')) {
        this.showError(`API key not configured for ${providerId}. Please configure an API key in the admin panel to use this provider.`);
      } else {
        this.showError(`Failed to select provider: ${error.message}`);
      }
    }
  }

  updatePrivacyInfo = async (providerId) => {
    // In a real implementation, this would fetch privacy information for the provider
    // For now, we'll use placeholder information

    const privacyContainer = this.container.querySelector('#provider-privacy-info');

    if (!providerId) {
      privacyContainer.style.display = 'none';
      return;
    }

    try {
      // Find the provider
      const provider = this.providers.find(p => p.id === providerId);
      if (!provider) {
        throw new Error(`Provider with ID ${providerId} not found`);
      }

      // For this implementation, we'll use specific privacy information for each provider
      // In a real implementation, this would come from a backend service
      let privacyInfo = '';

      switch(provider.name.toLowerCase()) {
        case 'groq':
          privacyInfo = `
            <strong>Privacy Information for ${provider.name}:</strong><br>
            Groq may collect usage data for service improvement and system optimization.
            Your input and output data are not stored for training purposes.
            For complete details, please review the provider's
            <a href="https://www.groq.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.`;
          break;
        case 'openai':
          privacyInfo = `
            <strong>Privacy Information for ${provider.name}:</strong><br>
            OpenAI retains data for 30 days for AI output improvements unless you opt out.
            They do not use your data to train their models by default.
            For complete details, please review the provider's
            <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.`;
          break;
        case 'google gemini':
        case 'gemini':
          privacyInfo = `
            <strong>Privacy Information for ${provider.name}:</strong><br>
            Google may use your conversations to improve their services unless you opt out.
            Your data is not used for personalized ads.
            For complete details, please review the provider's
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.`;
          break;
        case 'openrouter':
          privacyInfo = `
            <strong>Privacy Information for ${provider.name}:</strong><br>
            OpenRouter acts as a proxy and may log usage for operational purposes.
            Your data is sent to the underlying provider according to their privacy policy.
            For complete details, please review the provider's
            <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.`;
          break;
        default:
          privacyInfo = `
            <strong>Privacy Information for ${provider.name}:</strong><br>
            This provider may collect usage data for service improvement.
            Data is not used for training purposes in free tier.
            For complete details, please review the provider's
            <a href="#" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.`;
      }

      privacyContainer.innerHTML = privacyInfo;
      privacyContainer.style.display = 'block';
    } catch (error) {
      console.error('Error updating privacy info:', error);
      privacyContainer.innerHTML = `<strong>Privacy Information:</strong><br>Unable to load privacy information for ${provider.name}. Privacy information not available.`;
      privacyContainer.style.display = 'block';
    }
  }

  hidePrivacyInfo = () => {
    const privacyContainer = this.container.querySelector('#provider-privacy-info');
    if (privacyContainer) {
      privacyContainer.style.display = 'none';
    }
  }

  showError = (message) => {
    // Find the provider selector wrapper (created in the render method)
    let errorDisplay = this.container.querySelector('#provider-error-display');

    if (!errorDisplay) {
      // Create error display container if it doesn't exist
      errorDisplay = document.createElement('div');
      errorDisplay.id = 'provider-error-display';
      errorDisplay.className = 'error-message';
      errorDisplay.style.color = '#dc3545';
      errorDisplay.style.marginTop = '0.5rem';
      errorDisplay.style.padding = '0.5rem';
      errorDisplay.style.border = '1px solid #dc3545';
      errorDisplay.style.borderRadius = '4px';
      errorDisplay.style.backgroundColor = '#f8d7da';

      // Insert after the provider selector wrapper
      const providerSelectorWrapper = this.container.querySelector('.provider-selector-wrapper');
      if (providerSelectorWrapper) {
        providerSelectorWrapper.parentNode.insertBefore(errorDisplay, providerSelectorWrapper.nextSibling);
      } else {
        this.container.appendChild(errorDisplay);
      }
    }

    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';

    // Hide the error after 5 seconds
    setTimeout(() => {
      if (errorDisplay) {
        errorDisplay.style.display = 'none';
      }
    }, 5000);
  }

  // Method to programmatically select a provider
  selectProvider = async (providerId) => {
    if (this.options.displayType === 'dropdown') {
      const select = this.container.querySelector('#provider-select');
      if (select) {
        select.value = providerId;
        // Trigger change event
        select.dispatchEvent(new Event('change'));
      }
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