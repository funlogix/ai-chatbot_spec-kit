# Data Model: Multi-Provider API Support

## Entities

### AI Provider
- **providerId**: string (unique identifier combining provider name and endpoint)
- **providerName**: string (display name for the provider)
- **endpoint**: string (API endpoint URL)
- **apiKey**: string (encrypted/stored separately)
- **models**: Array<Model> (available models from this provider)
- **rateLimit**: Object (rate limit configuration including RPM, RPD, TPM)
- **tier**: string (free, paid, enterprise)
- **isActive**: boolean (whether the provider is currently enabled)
- **createdAt**: DateTime
- **updatedAt**: DateTime

### Model
- **modelId**: string (unique identifier for the model)
- **modelName**: string (display name for the model)
- **providerId**: string (reference to AI Provider)
- **capabilities**: Array<string> (what the model can do: text-generation, image-generation, etc.)
- **pricing**: Object (cost per token, other pricing details)
- **isDefault**: boolean (if this is the default model for the provider)

### User Preference
- **userId**: string (identifier for the user)
- **selectedProviderId**: string (reference to AI Provider)
- **selectedModelId**: string (reference to Model)
- **taskTypePreferences**: Object (mapping of task types to preferred providers/models)
- **lastUsed**: DateTime
- **createdAt**: DateTime
- **updatedAt**: DateTime

### Task Type
- **taskTypeId**: string (unique identifier)
- **taskTypeName**: string (display name: chat, image-generation, etc.)
- **description**: string (description of the task type)
- **defaultProviderId**: string (default provider for this task type)
- **defaultModelId**: string (default model for this task type)

### Provider Configuration
- **configId**: string (unique identifier for this configuration)
- **providerId**: string (reference to AI Provider)
- **assignedTaskTypes**: Array<string> (task types assigned to this provider)
- **rateLimitOverride**: Object (optional override of default rate limits)
- **isActive**: boolean (whether this configuration is active)
- **createdAt**: DateTime
- **updatedAt**: DateTime

### API Key
- **keyId**: string (internal identifier)
- **providerId**: string (reference to AI Provider)
- **encryptedKey**: string (encrypted API key value)
- **isActive**: boolean (whether key is currently active)
- **createdAt**: DateTime
- **updatedAt**: DateTime

### Rate Limit Log
- **logId**: string (unique identifier)
- **providerId**: string (reference to AI Provider)
- **requestCount**: number (number of requests made)
- **timestamp**: DateTime (when the request was made)
- **remainingQuota**: number (remaining quota after the request)

## Relationships

- **AI Provider** has many **Models**
- **AI Provider** has one **API Key** (1:1 mapping)
- **User** has many **User Preferences** (1:many)
- **User Preference** references one **AI Provider** and one **Model** (many:1)
- **Task Type** references one **AI Provider** and one **Model** (many:1)
- **Provider Configuration** references one **AI Provider** and many **Task Types** (1:many)
- **Rate Limit Log** references one **AI Provider** (many:1)

## Validation Rules

### AI Provider
- providerId must be unique across all providers
- endpoint must be a valid URL
- rateLimit must comply with the provider's actual rate limits
- tier must be one of: 'free', 'paid', 'enterprise'

### Model
- modelName must be unique within a provider
- capabilities must be from a predefined list
- pricing must be a valid object with expected format

### User Preference
- Each user can have only one preference record per task type
- selectedProviderId must reference an active provider
- selectedModelId must reference an active model from the selected provider

### Task Type
- taskTypeName must be unique
- defaultProviderId and defaultModelId must both be valid or both null

### Provider Configuration
- assignedTaskTypes must not overlap between configurations for the same provider
- isActive configurations must not conflict for the same task type

## State Transitions

### AI Provider
- **Pending**: Initial state when provider is added
- **Active**: When provider is ready for use
- **Inactive**: When temporarily disabled
- **Suspended**: When rate limits exceeded or API issue detected
- **Transition Logic**: Pending → Active (after validation), Active → Inactive (admin action), Active → Suspended (after failed requests), Suspended → Active (after timeout/reset)

### API Key
- **Active**: Ready to use
- **Revoked**: Marked as inactive (key changed or compromised)
- **Invalid**: Failed validation checks
- **Transition Logic**: Created as Active, Admin can change to Revoked, System can change to Invalid after failed validation

## Constraints

- No API keys stored in client-side code or source control
- Provider configurations must not create circular dependencies
- Rate limiting must be enforced per provider specifications
- Each task type must have exactly one assigned provider in active configurations