# AI Chatbot Backend

This is the backend service for the AI Chatbot application, which provides secure API key management and acts as a proxy between the frontend and various AI providers.

## Features

- Secure API key management for multiple AI providers
- Proxy requests to AI providers (OpenAI, Groq, Gemini, OpenRouter)
- Authentication and authorization middleware
- Rate limiting for API requests
- Provider configuration and management
- Comprehensive logging and metrics

## Prerequisites

- Node.js 18+ 
- npm or yarn package manager

## Installation

1. Clone this repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

## Configuration

1. Create a `.env` file based on the `.env.example` file
2. Add your API keys and other configuration settings

Required environment variables:
- `GROQ_API_KEY` - Your Groq API key
- `OPENAI_API_KEY` - Your OpenAI API key (optional)
- `GEMINI_API_KEY` - Your Google Gemini API key (optional)
- `OPENROUTER_API_KEY` - Your OpenRouter API key (optional)
- `JWT_SECRET` - Secret key for JWT tokens
- `ENCRYPTION_KEY` - 32-character key for encrypting API keys
- `ADMIN_ACCESS_KEY` - Access key for admin functions

## Usage

### Development

To start the development server:

```bash
npm run dev
```

### Production

To start the production server:

```bash
npm start
```

## API Endpoints

### Provider Management
- `GET /api/providers/available` - Get all available providers
- `GET /api/providers/:providerId/status` - Get provider status
- `POST /api/providers/configure` - Configure a provider (admin only)
- `POST /api/providers/select` - Select a provider for use

### API Key Management
- `POST /api/apikeys` - Create an API key (admin only)
- `GET /api/apikeys` - Get all API keys (admin only)
- `PUT /api/apikeys/:id` - Update an API key (admin only)
- `DELETE /api/apikeys/:id` - Delete an API key (admin only)

### Proxy Endpoints
- `POST /api/proxy/chat/completions` - Proxy chat completion requests
- `POST /api/proxy` - Generic proxy endpoint

## Environment Variables

- `PORT` - Port to run the server on (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `REQUEST_TIMEOUT` - Request timeout in milliseconds (default: 30000)
- `MAX_CONCURRENT_REQUESTS` - Maximum concurrent requests (default: 100)
- `LOG_LEVEL` - Logging level (default: info)

## Docker Deployment

To build and run with Docker:

```bash
# Build the image
docker build -t ai-chatbot-backend .

# Run the container
docker run -p 3000:3000 -e GROQ_API_KEY=your_key_here ai-chatbot-backend
```

## Health Checks

The server provides a health check endpoint at `/health` which returns:
```json
{
  "status": "OK",
  "timestamp": "2025-11-24T12:34:56.789Z"
}
```

## Security

- API keys are encrypted before storage
- Authentication is required for sensitive operations
- Rate limiting is implemented to prevent abuse
- All API requests to providers are proxied through this service