# Quickstart Guide: AI Chatbot with Text and Voice Interactions

## Overview
This guide will help you quickly set up and run the AI Chatbot with Text and Voice Interactions.

## Prerequisites
- Modern web browser (Chrome, Edge, or Safari with Web Speech API support)
- Internet connection
- Microphone access (for voice input feature)
- Speakers/earphones (for voice output feature)

## Getting Started

### 1. Setup
No installation required! This is a client-side application that runs directly in your browser.

1. Open the `index.html` file in your browser
2. Or host it on a simple web server if running locally from file system

### 2. Configuration
1. Obtain a free API key from Groq at https://console.groq.com
2. Add your API key to the application in `scripts/config.js`:
   ```javascript
   const GROQ_API_KEY = 'your-api-key-here';
   ```

### 3. Using the Chatbot
1. Type your message in the text input field and press Enter/Click Send
2. Or click the microphone button to speak your message
3. Wait for the chatbot response (text and/or audio)
4. Toggle voice output using the speaker button if desired

### 4. Features
- **Text Input**: Type messages in the chat interface
- **Voice Input**: Click the microphone button to speak
- **Text Output**: Chatbot responses appear as text
- **Voice Output**: Chatbot can speak responses aloud
- **Accessibility**: WCAG 2.1 AA compliant interface
- **Privacy**: No data is stored on servers

## Important Notes
- The application uses Groq's free tier which has rate limits (30 requests per minute)
- Voice features may not work in all browsers (currently supported in Chrome, Edge, Safari)
- For voice input to work, you must grant microphone permissions when prompted
- Responses may take a few seconds depending on API availability
- If you exceed rate limits, you'll need to wait before new requests are accepted

## Troubleshooting
- If voice features don't work: Check that your browser supports Web Speech API
- If you get API errors: Verify your Groq API key is correctly configured
- If audio doesn't play: Check your browser's sound settings and permissions
- If requests fail frequently: You may have hit rate limits; wait before retrying