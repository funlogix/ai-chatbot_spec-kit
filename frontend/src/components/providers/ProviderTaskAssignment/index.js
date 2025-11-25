/**
 * ProviderTaskAssignment Component
 * Allows administrators to configure which providers/models to use for different task types
 */
class ProviderTaskAssignment {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.options = {
      onAssignmentChanged: options.onAssignmentChanged || null,
      ...options
    };
    
    this.taskTypes = [];
    this.providers = [];
    this.assignments = [];
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
      this.showError('Access denied: Only developers and administrators can manage task assignments');
      return;
    }
    
    // Load task types, providers, and existing assignments
    await Promise.all([
      this.loadTaskTypes(),
      this.loadProviders(),
      this.loadAssignments()
    ]);
    
    // Render the component
    this.render();
    this.attachEventListeners();
  }

  async loadTaskTypes() {
    // For this implementation, we'll define task types in the client
    // In a real implementation, these might come from an API
    this.taskTypes = [
      { taskTypeId: 'chat', taskTypeName: 'Chat', description: 'Text-based conversations' },
      { taskTypeId: 'image', taskTypeName: 'Image Generation', description: 'Creating images from text prompts' },
      { taskTypeId: 'text', taskTypeName: 'Text Processing', description: 'Text analysis and transformation' },
      { taskTypeId: 'code', taskTypeName: 'Code Generation', description: 'Writing and reviewing code' }
    ];
  }

  async loadProviders() {
    try {
      this.providers = await this.providerService.getAvailableProviders();
    } catch (error) {
      console.error('Error loading providers:', error);
      this.showError('Failed to load providers. Please try again later.');
    }
  }

  async loadAssignments() {
    // In a real implementation, this would fetch from an API
    // For this mock, we'll use localStorage to persist assignments
    
    // For now, return an empty array or use default assignments
    this.assignments = [];
    
    // Find default provider for each task type
    this.taskTypes.forEach(taskType => {
      // Find an active provider to use as default
      const defaultProvider = this.providers.find(provider => provider.isActive);
      if (defaultProvider && defaultProvider.models && defaultProvider.models.length > 0) {
        this.assignments.push({
          taskType: taskType.taskTypeId,
          providerId: defaultProvider.providerId,
          modelId: defaultProvider.models[0].modelId
        });
      }
    });
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
    wrapper.className = 'provider-task-assignment';
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = 'Provider-Task Assignments';
    wrapper.appendChild(title);
    
    // Create description
    const description = document.createElement('p');
    description.textContent = 'Configure which providers and models are used for each task type:';
    description.style.marginBottom = '1.5rem';
    wrapper.appendChild(description);
    
    // Create assignment table
    const table = document.createElement('table');
    table.className = 'assignment-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Create table header
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border-color);">Task Type</th>
        <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border-color);">Provider</th>
        <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border-color);">Model</th>
        <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid var(--border-color);">Actions</th>
      </tr>
    `;
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    this.taskTypes.forEach(taskType => {
      const row = document.createElement('tr');
      
      // Find current assignment for this task type
      const currentAssignment = this.assignments.find(a => a.taskType === taskType.taskTypeId);
      
      // Task type cell
      const taskCell = document.createElement('td');
      taskCell.style.padding = '0.75rem';
      taskCell.style.borderBottom = '1px solid var(--border-color)';
      taskCell.innerHTML = `
        <strong>${taskType.taskTypeName}</strong><br>
        <small>${taskType.description}</small>
      `;
      row.appendChild(taskCell);
      
      // Provider selection cell
      const providerCell = document.createElement('td');
      providerCell.style.padding = '0.75rem';
      providerCell.style.borderBottom = '1px solid var(--border-color)';
      providerCell.innerHTML = `
        <select class="provider-select" data-task-type="${taskType.taskTypeId}">
          <option value="">Select Provider</option>
        </select>
      `;
      
      // Populate provider options
      const providerSelect = providerCell.querySelector(`select[data-task-type="${taskType.taskTypeId}"]`);
      this.providers.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider.providerId;
        option.textContent = provider.providerName;
        if (currentAssignment && currentAssignment.providerId === provider.providerId) {
          option.selected = true;
        }
        providerSelect.appendChild(option);
      });
      
      row.appendChild(providerCell);
      
      // Model selection cell
      const modelCell = document.createElement('td');
      modelCell.style.padding = '0.75rem';
      modelCell.style.borderBottom = '1px solid var(--border-color)';
      modelCell.innerHTML = `
        <select class="model-select" data-task-type="${taskType.taskTypeId}">
          <option value="">Select Model</option>
        </select>
      `;
      
      // Populate model options based on selected provider
      const modelSelect = modelCell.querySelector(`select[data-task-type="${taskType.taskTypeId}"]`);
      if (currentAssignment) {
        const selectedProvider = this.providers.find(p => p.providerId === currentAssignment.providerId);
        if (selectedProvider) {
          selectedProvider.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.modelId;
            option.textContent = model.modelName;
            if (currentAssignment.modelId === model.modelId) {
              option.selected = true;
            }
            modelSelect.appendChild(option);
          });
        }
      }
      
      row.appendChild(modelCell);
      
      // Actions cell
      const actionsCell = document.createElement('td');
      actionsCell.style.padding = '0.75rem';
      actionsCell.style.borderBottom = '1px solid var(--border-color)';
      actionsCell.innerHTML = `
        <button class="save-assignment-btn" data-task-type="${taskType.taskTypeId}">Save</button>
      `;
      row.appendChild(actionsCell);
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    wrapper.appendChild(table);
    
    // Add save all button
    const saveAllButton = document.createElement('button');
    saveAllButton.textContent = 'Save All Assignments';
    saveAllButton.className = 'save-all-btn';
    saveAllButton.style.marginTop = '1rem';
    saveAllButton.style.padding = '0.5rem 1rem';
    saveAllButton.style.backgroundColor = 'var(--primary-color)';
    saveAllButton.style.color = 'white';
    saveAllButton.style.border = 'none';
    saveAllButton.style.borderRadius = 'var(--border-radius)';
    saveAllButton.style.cursor = 'pointer';
    saveAllButton.addEventListener('click', () => this.handleSaveAll());
    
    wrapper.appendChild(saveAllButton);
    
    // Add to container
    this.container.appendChild(wrapper);
  }

  attachEventListeners() {
    // Add event listener for provider selection changes
    this.container.querySelectorAll('.provider-select').forEach(select => {
      select.addEventListener('change', (e) => {
        this.handleProviderChange(e);
      });
    });
    
    // Add event listener for save buttons
    this.container.querySelectorAll('.save-assignment-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const taskType = e.target.getAttribute('data-task-type');
        this.handleSaveAssignment(taskType);
      });
    });
  }

  handleProviderChange(event) {
    const taskType = event.target.getAttribute('data-task-type');
    const providerId = event.target.value;
    
    // Update the model selection dropdown based on selected provider
    const modelSelect = this.container.querySelector(`.model-select[data-task-type="${taskType}"]`);
    
    // Clear existing options except the first one
    modelSelect.innerHTML = '<option value="">Select Model</option>';
    
    if (providerId) {
      // Find the selected provider and populate its models
      const provider = this.providers.find(p => p.providerId === providerId);
      if (provider && provider.models) {
        provider.models.forEach(model => {
          const option = document.createElement('option');
          option.value = model.modelId;
          option.textContent = model.modelName;
          modelSelect.appendChild(option);
        });
      }
    }
  }

  async handleSaveAssignment(taskType) {
    try {
      const providerSelect = this.container.querySelector(`.provider-select[data-task-type="${taskType}"]`);
      const modelSelect = this.container.querySelector(`.model-select[data-task-type="${taskType}"]`);
      
      const providerId = providerSelect.value;
      const modelId = modelSelect.value;
      
      if (!providerId || !modelId) {
        this.showMessage('Please select both a provider and a model', 'error');
        return;
      }
      
      // Validate that the selected model belongs to the selected provider
      const provider = this.providers.find(p => p.providerId === providerId);
      if (provider) {
        const model = provider.models.find(m => m.modelId === modelId);
        if (!model) {
          this.showMessage('Selected model does not belong to the selected provider', 'error');
          return;
        }
      }
      
      // Create assignment object
      const assignment = {
        taskType,
        providerId,
        modelId
      };
      
      // In a real implementation, this would call an API endpoint
      // For this mock, we'll use the provider service to update the assignment
      // We'll use localStorage to persist the assignment
      
      // Get existing assignments from localStorage
      let existingAssignments = JSON.parse(localStorage.getItem('providerTaskAssignments') || '[]');
      
      // Remove existing assignment for this task type
      existingAssignments = existingAssignments.filter(a => a.taskType !== taskType);
      
      // Add new assignment
      existingAssignments.push(assignment);
      
      // Save updated assignments
      localStorage.setItem('providerTaskAssignments', JSON.stringify(existingAssignments));
      
      this.showMessage(`Assignment saved for ${taskType}`, 'success');
      
      // Call the callback if provided
      if (this.options.onAssignmentChanged) {
        await this.options.onAssignmentChanged(assignment);
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      this.showError(`Failed to save assignment: ${error.message}`);
    }
  }

  async handleSaveAll() {
    try {
      // Get all assignments from the form
      const allAssignments = [];
      
      this.taskTypes.forEach(taskType => {
        const providerSelect = this.container.querySelector(`.provider-select[data-task-type="${taskType.taskTypeId}"]`);
        const modelSelect = this.container.querySelector(`.model-select[data-task-type="${taskType.taskTypeId}"]`);
        
        const providerId = providerSelect.value;
        const modelId = modelSelect.value;
        
        if (providerId && modelId) {
          allAssignments.push({
            taskType: taskType.taskTypeId,
            providerId,
            modelId
          });
        }
      });
      
      // Save all assignments to localStorage
      localStorage.setItem('providerTaskAssignments', JSON.stringify(allAssignments));
      
      this.showMessage('All assignments saved successfully', 'success');
      
      // Call the callback if provided
      if (this.options.onAssignmentChanged) {
        for (const assignment of allAssignments) {
          await this.options.onAssignmentChanged(assignment);
        }
      }
    } catch (error) {
      console.error('Error saving all assignments:', error);
      this.showError(`Failed to save assignments: ${error.message}`);
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
    messageEl.style.margin = '1rem 0';
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
    
    // Auto-remove success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove();
        }
      }, 5000);
    }
  }

  showError(message) {
    this.showMessage(message, 'error');
  }
}

export default ProviderTaskAssignment;