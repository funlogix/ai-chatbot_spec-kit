# Multi-Provider API Support Feature Guide

## Overview
This feature enables users to switch between different AI inference providers (OpenAI, Groq, Gemini, OpenRouter) with a simple UI interface. API keys are securely managed on the backend to prevent exposure in client-side code.

## Architecture
- **Frontend**: ProviderSelector and ModelSelector components for user interaction
- **Backend**: Secure API key storage and proxy services to connect with AI providers
- **Proxy**: All requests to AI providers go through the backend proxy

## Setup and Configuration

### 1. Backend Setup
1. Create a `.env` file in the project root with your API keys:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   
   # Security keys
   JWT_SECRET=your_secure_jwt_secret
   ENCRYPTION_KEY=your_32_character_encryption_key
   ADMIN_ACCESS_KEY=your_admin_access_key
   ```

2. Start the backend server:
   ```bash
   npm start
   ```

### 2. Provider Configuration (Admin Only)
To configure a provider with its API key, make an API call with admin access:

```bash
curl -X POST "http://localhost:3000/api/providers/configure" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Access: your_admin_access_key" \
  -d '{
    "providerId": "openai",
    "name": "OpenAI",
    "endpoint": "https://api.openai.com/v1",
    "apiKey": "your_openai_api_key",
    "config": {}
  }'
```

## How to Use

### 1. Provider Selection
1. Open the application in your browser
2. Use the provider selection dropdown to choose an AI provider
3. The list will show all available providers (those with configured API keys)

### 2. Model Selection
1. After selecting a provider, the model selection dropdown will update with available models
2. Choose a specific model for that provider
3. The default model for each provider will be selected automatically if available

### 3. Making Requests
1. Type your message in the chat interface
2. The request will be sent to the selected provider through the backend proxy
3. Responses will come back through the same proxy without exposing API keys

## Testing Functionality

### 1. Verify Available Providers
```bash
curl "http://localhost:3000/api/providers/available"
```

### 2. Check Provider Status
```bash
curl "http://localhost:3000/api/providers/groq/status"
```

### 3. Test Chat Requests
```bash
curl -X POST "http://localhost:3000/api/proxy/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "groq",
    "model": "openai/gpt-oss-120b",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ]
  }'
```

## Error Handling
- If a selected provider has no API key configured, an appropriate error message will be shown
- Rate limiting is implemented per provider specifications with user notifications
- If a provider is unavailable, users are guided to select a different provider

## Security Features
- API keys are never exposed to the client-side code
- All requests to AI providers go through the secure backend proxy
- Authentication and authorization are enforced for provider configuration
- API keys are encrypted when stored

## Provider-Specific Notes
- **Groq**: Fast inference for Llama 3, Mixtral, and other high-speed models
- **OpenAI**: Advanced models like GPT-5 and o4-mini
- **Gemini**: Google's advanced multimodal AI capabilities
- **OpenRouter**: Access to various open-source and commercial models

## Troubleshooting
- If you get "API key not configured" errors, ensure the provider is configured in the backend
- If you get 404 errors, verify that the provider is supported in the system
- Check the browser console for client-side errors
- Check the backend server logs for server-side errors