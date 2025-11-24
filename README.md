# AI Chatbot with Text and Voice Interactions

A web-based AI chatbot that supports both text and voice interactions using Groq API for chat processing and browser Web Speech APIs for voice input and output.

## Features

- **Text Chat**: Type messages and receive text responses from an AI assistant
- **Voice Input**: Speak to the chatbot using your microphone; speech is converted to text
- **Voice Output**: Listen to AI responses using text-to-speech functionality
- **Privacy Focused**: All conversation data is processed in real-time with no storage
- **Accessible**: WCAG 2.1 AA compliant interface

## Prerequisites

- Modern web browser (Chrome, Edge, or Safari with Web Speech API support)
- Node.js 18+ for backend service
- Internet connection
- Microphone access (for voice input feature)
- Speakers/earphones (for voice output feature)

## Setup

### Frontend Setup
1. Clone or download this repository to your local machine
2. Open the `index.html` file in your web browser

### Backend Setup (Required for Multi-Provider Support)
1. Navigate to the project directory in your terminal
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root based on the `.env.example` file
4. Add your API keys to the `.env` file:
   - `GROQ_API_KEY` - Your Groq API key
   - `OPENAI_API_KEY` - Your OpenAI API key (optional)
   - `GEMINI_API_KEY` - Your Google Gemini API key (optional)
   - `OPENROUTER_API_KEY` - Your OpenRouter API key (optional)
5. Start the backend server:
   ```bash
   npm run dev
   ```
6. The backend server will run on `http://localhost:3000` by default

## Usage

1. **Text Chat**: Type your message in the text input field and press Enter/Click Send
2. **Voice Input**: Click the microphone button (🎤) to speak your message
3. **Voice Output**: Click the speaker button (🔊) to toggle voice output for AI responses
4. **Toggle Modes**: Switch between text-only, voice input, voice output, or combined modes
5. **Provider Selection**: Use the provider selection UI to switch between different AI providers

## API Limits

This application uses Groq's free tier which has the following limits:
- 30 Requests per minute
- 1,000 Requests per day
- 8,000 Tokens per minute
- 200,000 Tokens per day

## Architecture

The application uses a client-side only architecture with:
- Plain HTML, CSS, and JavaScript (no frameworks)
- Groq API for AI chat functionality
- Browser Web Speech API for voice processing
- Client-side state management for conversations

## Testing

The project includes:
- Unit tests for core components (in `/tests/unit/`)
- Integration tests for API and voice processing (in `/tests/integration/`)
- End-to-end tests (in `/tests/e2e/`)

## Accessibility

This application follows WCAG 2.1 AA guidelines:
- Proper heading structure
- Sufficient color contrast
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators

## Performance

- Text responses within 5 seconds 95% of the time
- Voice input/output with sub-3 second response time for 80% of requests
- Page load time under 3 seconds

## Multi-Provider API Support Feature

The AI Chatbot now supports switching between multiple AI providers, allowing users to leverage different AI services based on their needs, access, and preferences.

### Features

- **Provider Switching**: Easily switch between different AI providers (OpenAI, Groq, Gemini, OpenRouter) in real-time
- **Secure API Key Management**: Safe handling of API keys with backend storage to prevent client-side exposure
- **Rate Limit Handling**: Automatic management of provider-specific rate limits with user notifications
- **Model Selection**: Choose from different models within each provider
- **Task Type Assignment**: Administrators can assign specific providers for different task types (chat, image generation, etc.)
- **Data Privacy Information**: View privacy practices for each provider before making a selection
- **Provider Health Checks**: Automatic verification of provider availability

### Supported Providers

- **OpenAI**: GPT-4, GPT-3.5 and other models
- **Groq**: Llama 3, Mixtral and other high-speed models
- **Gemini**: Gemini Pro, Gemini Flash and other Google models
- **OpenRouter**: Various open-source and commercial models