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
- Internet connection
- Microphone access (for voice input feature)
- Speakers/earphones (for voice output feature)

## Setup

1. Clone or download this repository to your local machine
2. Obtain a free API key from [Groq Cloud](https://console.groq.com)
3. Open the `scripts/config.js` file
4. Replace the empty string for `GROQ_API_KEY` with your actual API key:
   ```javascript
   GROQ_API_KEY: 'your-actual-api-key-here',
   ```
5. Open the `index.html` file in your web browser

## Usage

1. **Text Chat**: Type your message in the text input field and press Enter/Click Send
2. **Voice Input**: Click the microphone button (🎤) to speak your message
3. **Voice Output**: Click the speaker button (🔊) to toggle voice output for AI responses
4. **Toggle Modes**: Switch between text-only, voice input, voice output, or combined modes

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