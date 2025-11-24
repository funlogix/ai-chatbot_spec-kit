// frontend/src/app.js
// Import the necessary components
import ProviderSelector from './components/ProviderSelector/index.js';
import ModelSelector from './components/ModelSelector/index.js';
import ChatInterface from './components/ChatInterface/index.js';

// Also import services to register them in the app context
import ProviderService from './services/api/providerService.js';
import ModelService from './services/api/modelService.js';

// Initialize the application when DOM is loaded
// Global state for tracking current provider and model
let currentProviderId = null;
let currentModelId = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('Initializing AI Chatbot App with Multi-Provider Support');

    // Check if the required containers exist before initializing components
    const providerSelectorContainer = document.getElementById('provider-selector-container');
    const modelSelectorContainer = document.getElementById('model-selector-container');
    const chatInterfaceContainer = document.getElementById('chat-interface-container');

    if (!providerSelectorContainer) {
      console.error('Provider selector container not found');
      throw new Error('Missing provider selector container element with ID "provider-selector-container"');
    }

    if (!modelSelectorContainer) {
      console.error('Model selector container not found');
      throw new Error('Missing model selector container element with ID "model-selector-container"');
    }

    if (!chatInterfaceContainer) {
      console.error('Chat interface container not found');
      throw new Error('Missing chat interface container element with ID "chat-interface-container"');
    }

    // Initialize provider selector component
    const providerSelector = new ProviderSelector('provider-selector-container', {
      displayType: 'dropdown', // Use dropdown UI
      showModelSelector: true,
      onProviderChange: async (providerId, modelId) => {
        console.log(`Provider changed to: ${providerId}, model: ${modelId}`);

        // Only update model selector if providerId is not null
        if (providerId && window.modelSelector) {
          try {
            await window.modelSelector.loadModelsForProvider(providerId);
          } catch (error) {
            console.error(`Error loading models for provider ${providerId}:`, error);
            // Don't fail completely if model loading fails, just log the error
          }
        }

        // Update the chat interface with the new provider
        if (window.chatInterface) {
          window.chatInterface.setCurrentProvider(providerId, currentModelId);
        }

        // Update global state variables
        currentProviderId = providerId;
        if (modelId) {
          currentModelId = modelId;  // Use the default model provided by the backend
        } else if (!providerId) {
          // If provider is null, also reset the model to null
          currentModelId = null;
        } else {
          // If no default model was provided (which shouldn't happen if the backend is working correctly),
          // we should still update the model to null or keep existing one
          // But let's ensure we try to load models for the new provider in any case
        }
        console.log(`Current provider updated to: ${currentProviderId}, model: ${currentModelId}`);

        // After provider changes, ensure the model selector loads the correct models or resets
        if (window.modelSelector) {
          if (providerId) {
            // If a provider is selected, load its models
            setTimeout(async () => {
              try {
                await window.modelSelector.loadModelsForProvider(providerId);
                // If we have a default model from the API call above, select it in the dropdown
                if (modelId) {
                  window.modelSelector.selectModel(modelId);
                  // Also update the global state to ensure consistency
                  currentModelId = modelId;
                }
              } catch (loadError) {
                console.error(`Error loading models for provider ${providerId}:`, loadError);
              }
            }, 100); // Small delay to ensure UI updates
          } else {
            // If no provider is selected, clear the model selector completely
            window.modelSelector.models = []; // Clear the models
            window.modelSelector.selectedProviderId = null; // Clear the selected provider
            window.modelSelector.selectedModelId = null; // Clear the selected model
            window.modelSelector.selectModel(null); // Reset model selection
            window.modelSelector.render(); // Re-render with no models
          }
        }

        // Update any UI elements that show current provider/model info
        updateProviderModelDisplay(providerId, currentModelId);
      }
    });

    // Function to update UI elements showing provider/model info
    function updateProviderModelDisplay(providerId, modelId) {
      // Update any UI element that displays the current provider/model
      // This could be in the header, chat interface, or elsewhere
      const providerDisplay = document.querySelector('#current-provider-display');
      const modelDisplay = document.querySelector('#current-model-display');

      if (providerDisplay) {
        if (providerId) {
          providerDisplay.textContent = `Current Provider: ${providerId}`;
          providerDisplay.style.display = 'inline'; // Show the element
        } else {
          providerDisplay.style.display = 'none'; // Hide when no provider selected
        }
      }

      if (modelDisplay) {
        if (modelId) {
          modelDisplay.textContent = `Current Model: ${modelId}`;
          modelDisplay.style.display = 'inline'; // Show the element
        } else {
          modelDisplay.style.display = 'none'; // Hide when no model selected
        }
      }
    }

    // Initialize model selector component
    const modelSelector = new ModelSelector('model-selector-container', {
      onModelChange: (modelId) => {
        console.log(`Model changed to: ${modelId}`);

        // Update the current model
        currentModelId = modelId;

        // Update the chat interface with the new model
        if (window.chatInterface) {
          window.chatInterface.setCurrentModel(modelId);
        }
      }
    });

    // Store the model selector globally for cross-component communication
    window.modelSelector = modelSelector;

    // Initialize the chat interface
    const chatInterface = new ChatInterface('chat-interface-container', {
      onSendMessage: async (message) => {
        // Use the global state variables for provider and model
        const providerId = currentProviderId || 'groq';
        const modelId = currentModelId || 'openai/gpt-oss-120b';

        // Check if a provider is properly selected
        if (!currentProviderId) {
          throw new Error('No provider selected. Please select a provider before sending a message.');
        }

        console.log('Sending message:', message, 'to provider:', providerId, 'with model:', modelId);

        try {
          // Make a call to the backend proxy
          const response = await fetch('http://localhost:3000/api/proxy/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Include authentication token if available
              'Authorization': `Bearer ${localStorage.getItem('access_token') || 'anon'}`
            },
            body: JSON.stringify({
              providerId: providerId,
              model: modelId,
              messages: [
                { role: 'user', content: message }
              ]
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Chat API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
          }

          const data = await response.json();

          // Return the assistant's response
          const botMessage = data.choices && data.choices[0] && data.choices[0].message
            ? data.choices[0].message.content
            : data.choices && data.choices[0] && data.choices[0].text  // For some providers that return text directly
            ? data.choices[0].text
            : 'Sorry, I could not generate a response.';

          return botMessage;
        } catch (error) {
          console.error('Error getting chat response:', error);
          return 'Sorry, I encountered an error processing your request. Please try again.';
        }
      }
    });

    // Store components globally for debugging purposes
    window.providerSelector = providerSelector;
    window.modelSelector = modelSelector;
    window.chatInterface = chatInterface;

    console.log('AI Chatbot App initialized successfully with multi-provider support!');
  } catch (error) {
    console.error('Failed to initialize the app:', error);

    // Show error in the UI
    const appDiv = document.getElementById('app');
    if (appDiv) {
      appDiv.innerHTML = `
        <div class="error-container" style="padding: 2rem; text-align: center; color: #d32f2f;">
          <h2>Application Initialization Error</h2>
          <p>There was an error initializing the application:</p>
          <p><strong>${error.message}</strong></p>
          <p>Please check the console for more details and ensure all components are properly set up.</p>
        </div>
      `;
    }
  }
});

// Additional helper functions for the application
window.ChatbotApp = {
  // Function to reload provider configurations
  reloadProviders: async () => {
    if (window.providerSelector) {
      await window.providerSelector.init();
    }
  },

  // Function to get current provider
  getCurrentProvider: () => {
    if (window.providerSelector) {
      return window.providerSelector.selectedProviderId;
    }
    return null;
  },

  // Function to get current model
  getCurrentModel: () => {
    if (window.modelSelector && window.modelSelector.selectedModelId) {
      return window.modelSelector.selectedModelId;
    }
    return null;
  }
};