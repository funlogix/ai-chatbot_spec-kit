/**
 * ModelSelector Component
 * Allows users to select from available AI models for the selected provider
 */
class ModelSelector {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      displayType: options.displayType || 'dropdown', // 'dropdown' or 'radio'
      onModelChange: options.onModelChange || null,
      ...options
    };
    
    this.models = [];
    this.selectedModelId = null;
    this.selectedProviderId = null;
    this.modelService = null;
    
    this.init();
  }

  async init() {
    // Import the model service
    const { default: modelService } = await import('../../services/api/modelService.js');
    this.modelService = modelService;
    
    // Render the component
    this.render();
    this.attachEventListeners();
  }

  async loadModels(providerId) {
    if (!providerId) {
      // Clear models if no provider selected
      this.models = [];
      this.selectedModelId = null;
      this.updateModelSelection();
      return;
    }
    
    try {
      // Get models for the specified provider
      this.models = await this.modelService.getModelsByProvider(providerId);
      this.selectedProviderId = providerId;
      
      // Update the UI
      this.updateModelSelection();
    } catch (error) {
      console.error(`Error loading models for provider ${providerId}:`, error);
      // Show error to user
      this.showError('Failed to load models for this provider. Please try again later.');
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
    label.textContent = 'Select AI Model:';
    label.setAttribute('for', 'model-select');
    
    // Create the model selection element (initially disabled if no provider selected)
    let modelElement;
    if (this.options.displayType === 'radio') {
      modelElement = this.createRadioSelection();
    } else {
      modelElement = this.createDropdownSelection();
    }
    
    // Add label and selection element to wrapper
    wrapper.appendChild(label);
    wrapper.appendChild(modelElement);
    
    // Add to container
    this.container.appendChild(wrapper);
  }

  createDropdownSelection() {
    const select = document.createElement('select');
    select.id = 'model-select';
    select.className = 'model-select';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = this.selectedProviderId ? 'Choose a model...' : 'Select a provider first...';
    defaultOption.disabled = !this.selectedProviderId;
    select.appendChild(defaultOption);
    
    // Add options for each model
    this.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.modelId;
      option.textContent = model.modelName;
      if (model.modelId === this.selectedModelId) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    // Disable if no provider selected
    select.disabled = !this.selectedProviderId;
    
    return select;
  }

  createRadioSelection() {
    const radioContainer = document.createElement('div');
    radioContainer.className = 'model-radios';
    
    if (!this.selectedProviderId) {
      // Show message if no provider is selected
      const message = document.createElement('span');
      message.textContent = 'Select a provider first...';
      radioContainer.appendChild(message);
      return radioContainer;
    }
    
    this.models.forEach((model, index) => {
      const radioWrapper = document.createElement('div');
      radioWrapper.style.display = 'flex';
      radioWrapper.style.alignItems = 'center';
      radioWrapper.style.marginBottom = '0.5rem';
      
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.id = `model-${model.modelId}`;
      radio.name = 'model-selector';
      radio.value = model.modelId;
      if (model.modelId === this.selectedModelId) {
        radio.checked = true;
      }
      
      const label = document.createElement('label');
      label.htmlFor = `model-${model.modelId}`;
      label.style.marginLeft = '0.5rem';
      label.textContent = model.modelName;
      
      radioWrapper.appendChild(radio);
      radioWrapper.appendChild(label);
      radioContainer.appendChild(radioWrapper);
    });
    
    return radioContainer;
  }

  updateModelSelection() {
    // Re-render the component to reflect new models
    this.render();
    this.attachEventListeners();
    
    // If there's only one model, select it by default
    if (this.models.length === 1) {
      this.selectModel(this.models[0].modelId);
    }
  }

  attachEventListeners() {
    if (!this.selectedProviderId) {
      // If no provider is selected, we can't attach event listeners to model selection
      return;
    }
    
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

  async handleModelChange(modelId) {
    if (!modelId) {
      // Reset selection
      this.selectedModelId = null;
      if (this.options.onModelChange) {
        await this.options.onModelChange(null);
      }
      return;
    }

    this.selectedModelId = modelId;
    
    // Call the callback if provided
    if (this.options.onModelChange) {
      await this.options.onModelChange(modelId);
    }
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

  // Method to programmatically select a model
  async selectModel(modelId) {
    if (!this.selectedProviderId) {
      console.warn('Cannot select model: no provider selected');
      return;
    }
    
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

  // Method to get currently selected model
  getSelectedModel() {
    return this.selectedModelId;
  }

  // Method to get currently selected provider
  getSelectedProvider() {
    return this.selectedProviderId;
  }
}

export default ModelSelector;