# Data Model: AI Chatbot with Text and Voice Interactions

## Entities

### Conversation
Represents a sequence of messages between user and chatbot, including both text and metadata about the interaction

**Fields:**
- id: string (unique identifier for the conversation session)
- createdAt: timestamp (when the conversation started)
- lastInteraction: timestamp (when the last message was exchanged)
- isActive: boolean (whether the conversation is currently active)
- messages: Message[] (array of messages in the conversation)

### Message
Individual unit of communication, containing content, timestamp, direction (user/bot), and media type (text or audio)

**Fields:**
- id: string (unique identifier for the message)
- content: string (the actual text content of the message)
- timestamp: timestamp (when the message was created/sent)
- sender: enum ['user', 'bot'] (who sent the message)
- mediaType: enum ['text', 'audio'] (the type of media in the message)
- isProcessed: boolean (whether the message has been fully processed and displayed)
- audioUrl: string (optional - URL to audio file if mediaType is 'audio')

### UserInput
Container for text or audio data that has been provided by the user for processing by the chatbot

**Fields:**
- id: string (unique identifier)
- content: string (text content, may be converted from audio)
- originalMediaType: enum ['text', 'audio'] (the original form of input)
- processedAt: timestamp (when the input was processed)
- originalAudioBlob: Blob (optional - the original audio data if input was audio)
- convertedText: string (the text after audio-to-text conversion if applicable)

## Relationships

- Conversation HAS MANY Message (one-to-many relationship)
- Conversation HAS ONE UserInput (at any given time during interaction)

## Validation Rules

### Conversation
- Must have a unique id
- createdAt must be a valid timestamp
- messages array must not exceed 100 messages (to prevent memory issues)
- isActive defaults to true when created

### Message
- Content must not be empty
- Sender must be either 'user' or 'bot'
- MediaType must be either 'text' or 'audio'
- Timestamp must be a valid timestamp

### UserInput
- Content must not be empty
- OriginalMediaType must be either 'text' or 'audio'
- ProcessedAt must be a valid timestamp when set

## State Transitions

### Conversation
- `CREATED` → `ACTIVE` (when first message is sent)
- `ACTIVE` → `ENDED` (when user ends session or timeout occurs)

### Message
- `PENDING` → `PROCESSING` (when received by system)
- `PROCESSING` → `PROCESSED` (when fully handled and displayed)
- `PROCESSING` → `ERROR` (if processing fails)