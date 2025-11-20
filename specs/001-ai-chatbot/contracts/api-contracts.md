# API Contracts: AI Chatbot with Text and Voice Interactions

## Overview
This document defines the API contracts for the AI chatbot functionality. Since this is a client-side application using browser APIs for voice processing and Groq API directly from the client, the contracts primarily document the expected data flows and interfaces.

## Chat API Contract

### Send Text Message
**Client Action:** User sends a text message to the chatbot

**Request Data:**
```json
{
  "message": "string",
  "conversationId": "string (optional)",
  "model": "string (default: openai/gpt-oss-120b)"
}
```

**Response Data:**
```json
{
  "response": "string",
  "conversationId": "string",
  "timestamp": "ISO 8601 timestamp"
}
```

**Error Response:**
```json
{
  "error": "string",
  "code": "string (e.g., rate_limit_exceeded)",
  "retryAfter": "number (seconds to wait before retrying)"
}
```

### Voice to Text Processing
**Client Action:** User speaks into microphone, browser processes audio to text

**Request Data:**
```json
{
  "audioData": "Audio blob or stream",
  "language": "string (default: en-US)"
}
```

**Response Data:**
```json
{
  "transcript": "string",
  "confidence": "number (0-1)",
  "isFinal": "boolean"
}
```

**Error Response:**
```json
{
  "error": "string",
  "code": "string (e.g., no_microphone, permission_denied)"
}
```

## Internal Client Contracts

### Message Display Interface
**Component:** Chat interface that displays messages

**Input:**
```json
{
  "message": {
    "id": "string",
    "content": "string",
    "timestamp": "timestamp",
    "sender": "enum ['user', 'bot']",
    "mediaType": "enum ['text', 'audio']"
  }
}
```

**Operations:**
- addMessage(message): Adds a message to the chat display
- updateMessageStatus(messageId, status): Updates the status of a message
- clearChat(): Clears all messages from the display

### Text to Speech Interface
**Component:** Browser Web Speech API integration

**Input:**
```json
{
  "text": "string",
  "voice": "string (optional)",
  "rate": "number (optional, default: 1.0)",
  "pitch": "number (optional, default: 1.0)",
  "volume": "number (optional, default: 1.0)"
}
```

**Operations:**
- speak(textObj): Converts text to speech and plays it
- stop(): Stops current speech playback
- pause(): Pauses current speech playback
- resume(): Resumes paused speech playback

### Conversation Context Management
**Component:** Manages conversation state and history in memory

**Operations:**
- createConversation(): Initializes a new conversation
- addMessageToConversation(conversationId, message): Adds message to conversation
- getConversationHistory(conversationId): Returns conversation messages
- clearConversation(conversationId): Clears conversation history