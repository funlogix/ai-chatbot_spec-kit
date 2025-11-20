# Research: AI Chatbot with Text and Voice Interactions

## Decision: Use Groq API for Chat Functionality
**Rationale:** Based on the clarification session, Groq API was selected for chat functionality because it offers a free tier with reasonable limits and supports the openai/gpt-oss-120b model which meets the performance requirements specified in the feature spec.

**Alternatives considered:**
- OpenAI API: Would require paid subscription beyond free tier
- Anthropic Claude API: Would require separate account setup
- Self-hosted models: Would exceed "free tier services" constraint

## Decision: All Conversation Data Processed in Real-time Without Storage
**Rationale:** This approach ensures privacy as requested in the clarifications, reduces complexity by not requiring a backend or database, and aligns with the "free tier services" constraint.

**Alternatives considered:**
- Store conversations temporarily: Would violate privacy requirement
- Store conversations for improvement: Would violate privacy requirement

## Decision: System Degrades Gracefully to Text-only Mode
**Rationale:** This ensures basic functionality remains available when voice services fail, maintaining user experience and meeting the reliability requirement from clarifications.

**Alternatives considered:**
- Stop working when voice services fail: Would provide poor user experience
- Queue requests: Would add complexity without clear benefit

## Decision: Support Basic WCAG 2.1 AA Compliance
**Rationale:** WCAG 2.1 AA is the standard level of accessibility compliance that provides good balance between implementation effort and accessibility coverage.

**Alternatives considered:**
- WCAG 2.1 AAA: Would require significantly more implementation effort
- Only basic keyboard navigation: Would not meet comprehensive accessibility needs

## Decision: Voice Input/Output Performance Target of Sub-3 Second Response Time for 80% of Requests
**Rationale:** This target provides good user experience while being realistic for voice processing services, meeting the performance requirements clarified in the session.

**Alternatives considered:**
- 5 second target: Would be too slow for good voice experience
- Sub-2 second target: Might be unrealistic given service limitations

## Decision: Plain HTML, CSS, and JavaScript Technology Stack
**Rationale:** This aligns with the project constitution which requires "Plain Web Technologies Only" and prohibits frameworks like React, Vue, or Angular.

**Alternatives considered:**
- React/Vue/Angular: Would violate constitution principle
- Other libraries: Would violate constitution principle

## Decision: Web Speech API for Text-to-Speech
**Rationale:** The Web Speech API is a native browser API that requires no additional dependencies, aligns with the plain HTML/CSS/JS requirement, and provides the needed text-to-speech functionality.

**Alternatives considered:**
- Third-party TTS libraries: Would violate constitution principle
- Self-hosted TTS: Would add complexity beyond scope

## Decision: Browser Speech Recognition API for Voice Input
**Rationale:** The browser's built-in speech recognition API requires no additional dependencies and provides the needed voice-to-text functionality.

**Alternatives considered:**
- Third-party STT services: Would violate constitution principle
- Self-hosted STT: Would add complexity beyond scope

## Decision: Client-Side Only Architecture
**Rationale:** Given the privacy requirement to not store data and the constraint to use free tier services, a client-side only architecture is appropriate and meets all requirements.

**Alternatives considered:**
- Server-side architecture: Would require backend infrastructure and data storage