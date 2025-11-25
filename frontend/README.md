# AI Chatbot Frontend

This is the frontend component of the AI Chatbot application that supports multi-provider API functionality.

## Features

- **Provider Switching**: Switch between different AI providers (OpenAI, Groq, Gemini, OpenRouter)
- **Secure API Key Management**: API keys are securely handled via backend proxy
- **Model Selection**: Choose from different models within each provider
- **Rate Limit Handling**: Automatic management of provider-specific rate limits
- **Error Handling**: Comprehensive error handling with user guidance

## Architecture

The frontend communicates with the backend service which acts as a secure proxy to various AI providers. This ensures that API keys are never exposed to the client-side.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ProviderSelector/
│   │   ├── ModelSelector/
│   │   └── ChatInterface/
│   ├── services/
│   │   ├── api/
│   │   │   ├── providerService.js
│   │   │   └── modelService.js
│   │   ├── providers/
│   │   │   ├── groqProvider.js
│   │   │   ├── openaiProvider.js
│   │   │   ├── geminiProvider.js
│   │   │   └── openrouterProvider.js
│   │   └── auth/
│   │       └── apiKeyManager.js
│   ├── models/
│   ├── utils/
│   │   ├── rateLimiter.js
│   │   └── configLoader.js
│   └── main.js
├── styles/
├── scripts/
└── index.html
```

## Setup

1. Ensure the backend service is running (see backend/README.md)
2. The frontend will automatically connect to the backend at `http://localhost:3000` in development

## Testing

The frontend includes comprehensive tests:

- Unit tests for components and services
- Integration tests for API flows
- Error handling tests

To run tests:
```bash
npm test
```

## Security

- API keys are managed exclusively by the backend
- All requests to AI providers go through the backend proxy
- Frontend only receives necessary provider identification, not keys

## API Endpoints Used

The frontend communicates with the backend via these endpoints:

- `GET /api/providers/available` - Get all available providers
- `GET /api/providers/{providerId}/status` - Get provider status
- `POST /api/providers/select` - Select a provider for use
- `POST /api/proxy/chat/completions` - Make chat completion requests via proxy
- `POST /api/providers/configure` - Configure providers (admin only)
- `DELETE /api/providers/{providerId}` - Remove provider configuration (admin only)

## Development

To run the frontend in development mode, simply open `index.html` in your browser. The application uses plain HTML, CSS, and JavaScript with no frameworks.