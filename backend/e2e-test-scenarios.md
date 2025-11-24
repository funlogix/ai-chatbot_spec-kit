# End-to-End Testing Scenarios for Multi-Provider AI Chatbot

This document outlines the end-to-end testing scenarios for the full-stack multi-provider AI chatbot application.

## Test Scenario 1: Provider Switching Flow
**Objective:** Verify users can switch between different AI providers seamlessly

**Preconditions:**
- Backend server is running
- Valid API keys configured for at least 2 providers
- Frontend application is accessible

**Steps:**
1. User opens the chat application in their browser
2. User accesses the provider selection UI
3. User sees a list of available providers with their status
4. User selects a provider (e.g., Groq)
5. User enters a message and sends it
6. User receives a response from the selected provider
7. User switches to another provider (e.g., OpenAI)
8. User sends another message
9. User receives a response from the newly selected provider

**Expected Results:**
- Provider list displays correctly with accurate status information
- Messages are routed to the selected provider
- Responses come from the appropriate provider API
- Switching happens without page refresh

## Test Scenario 2: API Key Management (Admin)
**Objective:** Verify administrators can securely manage API keys

**Preconditions:**
- Backend server is running
- Admin credentials are available
- Frontend provider configuration UI is accessible to admins

**Steps:**
1. Admin accesses the provider configuration UI
2. Admin adds a new provider with its API key
3. System validates the API key and saves the configuration
4. Admin verifies the provider appears in the available providers list
5. Admin removes an existing provider
6. System removes the provider and its API key

**Expected Results:**
- API keys are never exposed to the client-side
- Providers are added/removed successfully
- Validation prevents invalid API keys from being saved
- Changes take effect immediately

## Test Scenario 3: Rate Limit Handling
**Objective:** Verify the system properly handles rate limits and notifies users

**Preconditions:**
- Backend server is running
- Valid API keys configured for at least one provider
- Simulated or real rate-limited conditions

**Steps:**
1. User selects a provider and sends multiple messages rapidly
2. System detects approaching rate limits for the provider
3. System enforces rate limiting
4. User is notified about rate limiting
5. After the rate limit window, user can send messages again

**Expected Results:**
- Rate limits are enforced per provider specifications
- Users are notified of rate limiting appropriately
- System doesn't crash under high load
- Once rate limit resets, user can continue using the provider

## Test Scenario 4: Provider Unavailability
**Objective:** Verify the system gracefully handles provider unavailability

**Preconditions:**
- Backend server is running
- One or more providers configured but temporarily unavailable

**Steps:**
1. User selects a provider that is temporarily unavailable
2. User attempts to send a message
3. System detects provider unavailability
4. User receives appropriate error message
5. User is guided to select an alternative provider

**Expected Results:**
- Error messages are clear and informative
- System doesn't crash when providers are unavailable
- Users are appropriately guided to switch providers
- No fallback happens to other providers without user consent

## Test Scenario 5: Security Verification
**Objective:** Confirm API keys are never exposed to client-side

**Preconditions:**
- Application is running with API keys configured

**Steps:**
1. Inspect network requests from frontend to backend
2. Examine browser's developer tools for any exposed API keys
3. Review source code for hardcoded API keys
4. Verify API keys are stored only in backend environment variables

**Expected Results:**
- API keys are not visible in browser network requests
- No API keys appear in browser storage (localStorage, sessionStorage, cookies)
- All API keys are handled exclusively by backend proxy
- Frontend only receives necessary provider identification, not keys

## Test Scenario 6: Data Privacy Disclosure
**Objective:** Verify users see data privacy information for selected providers

**Preconditions:**
- Backend server is running
- Provider list includes privacy information

**Steps:**
1. User accesses provider selection UI
2. User views provider information
3. User sees data privacy disclosures for each provider
4. User can access links to full privacy policies

**Expected Results:**
- Privacy information is displayed for all providers
- Links to privacy policies are functional
- Users can make informed decisions based on privacy practices

## Automated E2E Test Example (Cypress)

```javascript
// e2e/tests/provider-switching.cy.js
describe('Multi-Provider AI Chatbot', () => {
  it('should allow users to switch between providers', () => {
    cy.visit('/');
    
    // Select provider
    cy.get('[data-testid="provider-selector"]').click();
    cy.get('[data-testid="provider-option-groq"]').click();
    
    // Send a message
    cy.get('[data-testid="message-input"]').type('Hello from Groq!');
    cy.get('[data-testid="send-button"]').click();
    
    // Verify response
    cy.get('[data-testid="chat-response"]').should('contain', 'response');
    
    // Switch provider
    cy.get('[data-testid="provider-selector"]').click();
    cy.get('[data-testid="provider-option-openai"]').click();
    
    // Send another message
    cy.get('[data-testid="message-input"]').type('Hello from OpenAI!');
    cy.get('[data-testid="send-button"]').click();
    
    // Verify response from new provider
    cy.get('[data-testid="chat-response"]').should('contain', 'response');
  });
});
```

## Performance Tests
- Verify response times remain under 2 seconds for 95% of requests
- Confirm system handles 1000+ concurrent users
- Validate provider switching occurs in under 10 seconds
- Test caching mechanisms for performance improvements

## Accessibility Tests
- Confirm WCAG 2.1 AA compliance is maintained
- Verify keyboard navigation works with new provider UI elements
- Ensure screen readers can interpret provider selection elements
- Test voice input/output functionality with assistive technologies