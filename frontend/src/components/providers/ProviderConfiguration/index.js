/**
 * ProviderConfiguration Component
 * Allows developers/administrators to configure new AI providers
 */
class ProviderConfiguration {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      onProviderAdded: options.onProviderAdded || null,
      onProviderRemoved: options.onProviderRemoved || null,
      ...options
    };
    
    this.providers = [];
    this.providerService = null;
    this.authService = null;
    
    this.init();
  }

  async init() {
    // Import services
    const { default: providerService } = await import('../../services/api/providerService.js');
    const { default: authService } = await import('../../services/auth/authService.js');
    
    this.providerService = providerService;
    this.authService = authService;
    
    // Check if user has admin privileges
    if (!this.authService.isDeveloper()) {
      this.showError('Access denied: Only developers and administrators can configure providers');
      return;
    }
    
    // Load existing providers
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
    wrapper.className = 'provider-configuration';
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Provider Configuration';
    wrapper.appendChild(title);
    
    // Create form for adding new provider
    const form = document.createElement('form');
    form.id = 'provider-config-form';
    
    // Provider ID field
    const providerIdDiv = document.createElement('div');
    providerIdDiv.className = 'form-group';
    providerIdDiv.innerHTML = `
      <label for="providerId">Provider ID*:</label>
      <input type="text" id="providerId" name="providerId" required placeholder="e.g., groq:https://api.groq.com">
    `;
    form.appendChild(providerIdDiv);
    
    // Provider Name field
    const providerNameDiv = document.createElement('div');
    providerNameDiv.className = 'form-group';
    providerNameDiv.innerHTML = `
      <label for="providerName">Provider Name*:</label>
      <input type="text" id="providerName" name="providerName" required placeholder="e.g., Groq">
    `;
    form.appendChild(providerNameDiv);
    
    // Endpoint field
    const endpointDiv = document.createElement('div');
    endpointDiv.className = 'form-group';
    endpointDiv.innerHTML = `
      <label for="endpoint">Endpoint*:</label>
      <input type="url" id="endpoint" name="endpoint" required placeholder="e.g., https://api.groq.com">
    `;
    form.appendChild(endpointDiv);
    
    // API Key field
    const apiKeyDiv = document.createElement('div');
    apiKeyDiv.className = 'form-group';
    apiKeyDiv.innerHTML = `
      <label for="apiKey">API Key*:</label>
      <input type="password" id="apiKey" name="apiKey" required placeholder="Enter API key">
    `;
    form.appendChild(apiKeyDiv);
    
    // Tier selection
    const tierDiv = document.createElement('div');
    tierDiv.className = 'form-group';
    tierDiv.innerHTML = `
      <label for="tier">Tier*:</label>
      <select id="tier" name="tier" required>
        <option value="free">Free</option>
        <option value="paid">Paid</option>
        <option value="enterprise">Enterprise</option>
      </select>
    `;
    form.appendChild(tierDiv);
    
    // Requests per minute
    const rpmDiv = document.createElement('div');
    rpmDiv.className = 'form-group';
    rpmDiv.innerHTML = `
      <label for="requestsPerMinute">Requests Per Minute:</label>
      <input type="number" id="requestsPerMinute" name="requestsPerMinute" min="0" placeholder="e.g., 30">
    `;
    form.appendChild(rpmDiv);
    
    // Requests per day
    const rpdDiv = document.createElement('div');
    rpdDiv.className = 'form-group';
    rpdDiv.innerHTML = `
      <label for="requestsPerDay">Requests Per Day:</label>
      <input type="number" id="requestsPerDay" name="requestsPerDay" min="0" placeholder="e.g., 1000">
    `;
    form.appendChild(rpdDiv);
    
    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Add Provider';
    submitBtn.className = 'add-provider-btn';
    form.appendChild(submitBtn);
    
    wrapper.appendChild(form);
    
    // Add section for existing providers
    if (this.providers.length > 0) {
      const providersList = document.createElement('div');
      providersList.id = 'providers-list';
      providersList.style.marginTop = '2rem';
      
      const listTitle = document.createElement('h4');
      listTitle.textContent = 'Configured Providers';
      providersList.appendChild(listTitle);
      
      const list = document.createElement('ul');
      list.className = 'providers-ul';
      
      this.providers.forEach(provider => {
        const listItem = document.createElement('li');
        listItem.className = 'provider-item';
        listItem.innerHTML = `
          <div class="provider-info">
            <strong>${provider.providerName}</strong> (${provider.providerId})
            <span class="provider-tier ${provider.tier}">${provider.tier}</span>
            <span class="status-indicator ${provider.isActive ? 'active' : 'inactive'}"></span>
            ${provider.isActive ? 'Active' : 'Inactive'}
          </div>
          <button type="button" class="remove-provider-btn" data-provider-id="${provider.providerId}">Remove</button>
        `;
        list.appendChild(listItem);
      });
      
      providersList.appendChild(list);
      wrapper.appendChild(providersList);
    }
    
    // Add to container
    this.container.appendChild(wrapper);
  }

  attachEventListeners() {
    // Form submission
    const form = this.container.querySelector('#provider-config-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddProvider(e);
      });
    }
    
    // Remove provider buttons
    const removeButtons = this.container.querySelectorAll('.remove-provider-btn');
    removeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const providerId = e.target.getAttribute('data-provider-id');
        this.handleRemoveProvider(providerId);
      });
    });
  }

  async handleAddProvider(event) {
    const formData = new FormData(event.target);
    
    const newProvider = {
      providerId: formData.get('providerId'),
      providerName: formData.get('providerName'),
      endpoint: formData.get('endpoint'),
      apiKey: formData.get('apiKey'),
      tier: formData.get('tier'),
      rateLimit: {
        requestsPerMinute: parseInt(formData.get('requestsPerMinute')) || 0,
        requestsPerDay: parseInt(formData.get('requestsPerDay')) || 0
      },
      isActive: true
    };
    
    try {
      // Validate the provider data before submitting
      if (!newProvider.providerId || !newProvider.providerName || 
          !newProvider.endpoint || !newProvider.apiKey) {
        throw new Error('Provider ID, Name, Endpoint, and API Key are required');
      }
      
      // Use the API key manager to securely configure the key
      const { default: apiKeyManager } = await import('../auth/apiKeyManager.js');
      const result = await apiKeyManager.configureApiKey(newProvider.providerId, newProvider.apiKey);
      
      console.log('API key configured:', result);
      
      // Add the provider via the provider service
      const providerResult = await this.providerService.createProvider({
        providerId: newProvider.providerId,
        providerName: newProvider.providerName,
        endpoint: newProvider.endpoint,
        tier: newProvider.tier,
        rateLimit: newProvider.rateLimit,
        isActive: newProvider.isActive
      });
      
      console.log('Provider added successfully:', providerResult);
      
      // Show success message
      this.showMessage('Provider added successfully!', 'success');
      
      // Clear the form
      event.target.reset();
      
      // Reload providers
      await this.loadProviders();
      this.render();
      
      // Call the callback if provided
      if (this.options.onProviderAdded) {
        await this.options.onProviderAdded(providerResult);
      }
    } catch (error) {
      console.error('Error adding provider:', error);
      this.showError(`Failed to add provider: ${error.message}`);
    }
  }

  async handleRemoveProvider(providerId) {
    try {
      // Check if the provider is currently assigned to any task types
      const { default: providerRouterService } = await import('../../services/ProviderRouterService.js');
      const assignments = await providerRouterService.getAllAssignments();

      const assignedTaskTypes = assignments
        .filter(assignment => assignment.providerId === providerId)
        .map(assignment => assignment.taskType);

      if (assignedTaskTypes.length > 0) {
        // Get task type names for better error message
        const { default: taskTypeService } = await import('../../services/TaskTypeService.js');
        const taskTypes = await taskTypeService.getAllTaskTypes();
        const taskTypeNames = assignedTaskTypes.map(taskTypeId => {
          const taskType = taskTypes.find(t => t.taskTypeId === taskTypeId);
          return taskType ? taskType.taskTypeName : taskTypeId;
        });

        this.showError(`Cannot remove provider ${providerId} as it is currently assigned to task types: ${taskTypeNames.join(', ')}. Please reassign these tasks to another provider first.`);
        return;
      }

      if (!confirm(`Are you sure you want to remove provider ${providerId}? This action cannot be undone.`)) {
        return;
      }

      // First, remove the API key via the API key manager
      const { default: apiKeyManager } = await import('../../services/auth/apiKeyManager.js');
      const keyResult = await apiKeyManager.removeApiKey(providerId);

      console.log('API key removed:', keyResult);

      // Remove the provider via the provider service
      const result = await this.providerService.deleteProvider(providerId);

      console.log('Provider removed successfully:', result);

      // Show success message
      this.showMessage('Provider removed successfully!', 'success');

      // Reload providers
      await this.loadProviders();
      this.render();

      // Call the callback if provided
      if (this.options.onProviderRemoved) {
        await this.options.onProviderRemoved(providerId);
      }
    } catch (error) {
      console.error('Error removing provider:', error);
      this.showError(`Failed to remove provider: ${error.message}`);
    }
  }

  showMessage(message, type = 'info') {
    // Remove any existing messages
    const existingMsg = this.container.querySelector('.status-message');
    if (existingMsg) {
      existingMsg.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `status-message ${type}`;
    messageEl.textContent = message;
    messageEl.style.marginBottom = '1rem';
    messageEl.style.padding = '0.75rem';
    messageEl.style.borderRadius = 'var(--border-radius)';
    
    // Style based on type
    if (type === 'success') {
      messageEl.style.backgroundColor = 'var(--success-color)';
      messageEl.style.color = 'white';
    } else if (type === 'error') {
      messageEl.style.backgroundColor = 'var(--danger-color)';
      messageEl.style.color = 'white';
    } else {
      messageEl.style.backgroundColor = 'var(--primary-color)';
      messageEl.style.color = 'white';
    }
    
    // Insert after the title
    const title = this.container.querySelector('h3');
    if (title) {
      title.parentNode.insertBefore(messageEl, title.nextSibling);
    } else {
      this.container.insertBefore(messageEl, this.container.firstChild);
    }
  }

  showError(message) {
    this.showMessage(message, 'error');
  }
}

export default ProviderConfiguration;