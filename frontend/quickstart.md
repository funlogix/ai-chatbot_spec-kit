# Quickstart Guide: Multi-Provider AI Chatbot

This guide explains how to set up and use the multi-provider API support feature in the AI chatbot application. This feature allows switching between different AI providers (OpenAI, Groq, Gemini, etc.) and managing their configurations.

## Setup

### 1. Environment Configuration
Create a `.env` file in the project root (this file should be excluded from version control via `.gitignore`):

```env
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Initialize Provider Configurations
Run the configuration script to set up default provider configurations:
```bash
npm run config-providers
# or
yarn config-providers
```

## Usage

### Switching Providers
1. Navigate to the provider selection menu in the UI
2. Choose from the available configured providers
3. The system will automatically switch to the selected provider for subsequent requests

### Adding a New Provider
1. Navigate to the Admin/Configuration panel (requires developer role)
2. Click "Add Provider"
3. Enter provider details (name, endpoint, API key)
4. Configure rate limits and task type assignments
5. Save the configuration

### Managing API Keys
1. Access the configuration panel with developer credentials
2. Select "Manage API Keys"
3. Add, update, or disable API keys as needed
4. Keys will be encrypted and stored securely

## API Endpoints

### Provider Selection
```
POST /api/provider/select
Content-Type: application/json

{
  "providerId": "groq:https://api.groq.com",
  "modelId": "llama3-8b-8192"
}
```

### Provider Status Check
```
GET /api/provider/status
```

### Available Providers
```
GET /api/providers/available
```

## Rate Limiting
The system implements client-side rate limiting based on the specific limits of each provider:
- Groq: Based on your plan's limits
- OpenAI: Based on your plan's limits
- Gemini: 10 RPM, 250 RPD (as specified)
- OpenRouter: 20 RPM, 50 RPD for free tier (as specified)

## Error Handling
- If a provider fails, an error message will be displayed with options to switch to another provider
- Rate limit exceeded errors will pause requests and notify the user
- Invalid API key errors will prompt for key verification

## Data Privacy
- Provider privacy policy information is displayed when selecting a provider
- Privacy information will be noted if not available from the provider

## Troubleshooting

### Provider Not Working
1. Verify API keys are correctly entered
2. Check rate limits haven't been exceeded
3. Confirm the provider endpoint is accessible

### Rate Limit Issues
1. Check the rate limit log in the configuration panel
2. Adjust usage patterns to comply with provider limits
3. Consider upgrading to a paid tier if consistently hitting limits

### Authentication Issues
1. Verify you have developer/administrator credentials
2. Check that your authentication token is still valid
3. Contact system administrator if access is denied