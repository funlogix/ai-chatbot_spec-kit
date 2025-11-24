// frontend/src/components/ModelSelector/index.js
/**
 * ModelSelector Component
 * Allows users to select which AI model to use for their requests
 */
import ModelService from '../../services/api/modelService.js';

class ModelSelector {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      displayType: options.displayType || 'dropdown', // 'dropdown' or 'radio'
      providerId: options.providerId || null, // Optional default provider
      onModelChange: options.onModelChange || null,
      ...options
    };

    this.models = [];
    this.selectedModelId = null;
    this.selectedProviderId = null;

    this.init();
  }

  async init() {
    // Render the component initially
    this.render();
    
    // Load models if a provider is already selected
    if (this.options.providerId) {
      await this.loadModelsForProvider(this.options.providerId);
    }
  }

  async loadModelsForProvider(providerId) {
    try {
      this.selectedProviderId = providerId;
      this.models = await ModelService.getProviderModels(providerId);
      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error(`Error loading models for provider ${providerId}:`, error);
      this.showError(`Failed to load models for ${providerId}. Please try selecting a different provider.`);
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
    wrapper.className = 'model-selector';

    // Create label
    const label = document.createElement('label');
    label.textContent = 'Select Model:';
    label.setAttribute('for', 'model-select');
    label.style.display = 'block';
    label.style.marginBottom = '0.5rem';

    // Create the appropriate selection element
    let modelElement;
    if (this.options.displayType === 'radio') {
      modelElement = this.createRadioSelection();
    } else {
      modelElement = this.createDropdownSelection();
    }

    // Add a note about the selected provider
    if (this.selectedProviderId) {
      const providerNote = document.createElement('div');
      providerNote.style.fontSize = '0.8em';
      providerNote.style.marginTop = '0.25rem';
      providerNote.style.color = '#6c757d';
      providerNote.textContent = `Models for: ${this.selectedProviderId}`;
      wrapper.appendChild(providerNote);
    }

    // Add elements to wrapper
    wrapper.appendChild(label);
    wrapper.appendChild(modelElement);

    // Add to container
    this.container.appendChild(wrapper);
  }

  createDropdownSelection() {
    const select = document.createElement('select');
    select.id = 'model-select';
    select.className = 'model-select';
    select.disabled = this.models.length === 0; // Disable if no models available

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    if (this.models.length === 0) {
      defaultOption.textContent = 'No models available - select a provider first';
    } else {
      defaultOption.textContent = 'Choose a model...';
    }
    select.appendChild(defaultOption);

    // Add options for each model
    this.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      if (model.id === this.selectedModelId) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    // Prevent selection of the default option (empty value)
    select.addEventListener('change', (e) => {
      if (!e.target.value) {
        // If the default option was selected, reset to previous selection
        if (this.selectedModelId) {
          e.target.value = this.selectedModelId;
        } else {
          // If no previous selection, just return without processing
          return;
        }
      } else {
        // Process the valid selection
        this.handleModelChange(e.target.value);
      }
    });

    return select;
  }

  createRadioSelection() {
    const radioContainer = document.createElement('div');
    radioContainer.className = 'model-radios';

    if (this.models.length === 0) {
      const noModelsNote = document.createElement('div');
      noModelsNote.style.fontStyle = 'italic';
      noModelsNote.style.color = '#6c757d';
      noModelsNote.textContent = 'No models available - select a provider first';
      radioContainer.appendChild(noModelsNote);
      return radioContainer;
    }

    this.models.forEach((model, index) => {
      const radioWrapper = document.createElement('div');
      radioWrapper.style.display = 'flex';
      radioWrapper.style.alignItems = 'center';
      radioWrapper.style.marginBottom = '0.5rem';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.id = `model-${model.id}`;
      radio.name = 'model-selector';
      radio.value = model.id;
      if (model.id === this.selectedModelId) {
        radio.checked = true;
      }

      const label = document.createElement('label');
      label.htmlFor = `model-${model.id}`;
      label.style.marginLeft = '0.5rem';
      label.textContent = `${model.name} (${model.providerId})`;

      radioWrapper.appendChild(radio);
      radioWrapper.appendChild(label);
      radioContainer.appendChild(radioWrapper);
    });

    return radioContainer;
  }

  attachEventListeners() {
    if (this.models.length === 0) return; // No need for event listeners if no models

    if (this.options.displayType === 'radio') {
      // For radio buttons, add change listener to the container
      const radioContainer = this.container.querySelector('.model-radios');
      if (radioContainer) {
        radioContainer.addEventListener('change', (e) => {
          if (e.target.type === 'radio') {
            this.handleModelChange(e.target.value);
          }
        });
      }
    } else {
      // For dropdown, add change listener to select
      const select = this.container.querySelector('#model-select');
      if (select) {
        select.addEventListener('change', (e) => {
          this.handleModelChange(e.target.value);
        });
      }
    }
  }

  handleModelChange(modelId) {
    if (!modelId) {
      this.selectedModelId = null;
      return;
    }

    this.selectedModelId = modelId;

    // Call the callback if provided
    if (this.options.onModelChange) {
      this.options.onModelChange(modelId);
    }
  }

  // Method to load models for a specific provider
  async loadModelsForProvider(providerId) {
    try {
      this.models = await ModelService.getProviderModels(providerId);
      this.selectedProviderId = providerId;

      // Try to get the default model for this provider from the backend
      try {
        const providersResponse = await fetch('http://localhost:3000/api/providers/available', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (providersResponse.ok) {
          const { providers } = await providersResponse.json();
          const provider = providers.find(p => p.id === providerId);
          if (provider && provider.defaultModel) {
            // Set the default model as the selected model
            this.selectedModelId = provider.defaultModel;
          }
        }
      } catch (providerError) {
        console.error(`Error getting provider default model:`, providerError);
        // Continue with the existing flow if we can't get the default
      }

      this.render();
      this.attachEventListeners();

      // If we have a default model, try to select it in the UI
      if (this.selectedModelId) {
        setTimeout(() => {
          this.selectModel(this.selectedModelId);
        }, 50); // Small delay to ensure UI is ready
      }
    } catch (error) {
      console.error(`Error loading models for provider ${providerId}:`, error);

      // More specific error handling for different error types
      if (error.message.includes('404') || error.message.includes('not found')) {
        this.showError(`Provider "${providerId}" is not supported or not configured on the server. Please select a different provider.`);
      } else if (error.message.includes('API key')) {
        this.showError(`API key not configured for ${providerId}. Please configure an API key to use this provider.`);
      } else {
        this.showError(`Failed to load models for ${providerId}. Error: ${error.message}`);
      }
    }
  }

  // Method to programmatically select a model
  selectModel(modelId) {
    if (this.options.displayType === 'dropdown') {
      const select = this.container.querySelector('#model-select');
      if (select) {
        select.value = modelId;
        // Trigger change event
        select.dispatchEvent(new Event('change'));
      }
    } else {
      const radio = this.container.querySelector(`input[value="${modelId}"]`);
      if (radio) {
        radio.checked = true;
        // Trigger change event
        radio.dispatchEvent(new Event('change'));
      }
    }
  }

  showError(message) {
    // Create and show an error element
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.style.color = '#dc3545';
    errorContainer.style.marginTop = '0.5rem';
    errorContainer.style.padding = '0.5rem';
    errorContainer.style.border = '1px solid #dc3545';
    errorContainer.style.borderRadius = '4px';
    errorContainer.style.backgroundColor = '#f8d7da';
    errorContainer.textContent = message;

    // Clear container and add error
    this.container.innerHTML = '';
    this.container.appendChild(errorContainer);
  }
}

export default ModelSelector;