# Legacy Scripts Inventory and Migration Plan

## Current Status
The scripts folder contains legacy architecture components that were replaced during the multi-provider API implementation and voice functionality rebuild. Some components are still being loaded by index.html but may no longer be actively used by the new component-based architecture.

## Files Still Referenced in index.html
These files are currently loaded in index.html but may not all be actively used:
- scripts/config.js
- scripts/utils.js
- scripts/entities/message.js
- scripts/entities/user-input.js
- scripts/services/conversation-service.js
- scripts/api-client.js
- scripts/chat.js

## Files Safe to Remove Now
- scripts/entities/conversation.js
- scripts/entities/user-input.js (NOTE: This is still referenced in index.html)
- scripts/voice-input.js (already removed)
- scripts/voice-output.js (already removed)
- scripts/main.js (already removed)

## Files That Need Migration to New Architecture
These files likely need to be refactored into the new component architecture:
- scripts/config.js - Could be converted to modern ES6 module in frontend/src/config/
- scripts/utils.js - Could be converted to modern ES6 modules in frontend/src/utils/
- scripts/entities/message.js - Logic now handled in new components
- scripts/entities/user-input.js - Logic now handled in new components 
- scripts/services/conversation-service.js - May be replaced with new service architecture
- scripts/api-client.js - Could be replaced with new api service modules
- scripts/chat.js - Large component that may contain functionality that's now in new ChatInterface

## Recommended Actions

### Immediate
1. Create documentation for these legacy files
2. Mark this inventory for future cleanup

### Medium-term
1. Gradually migrate needed functionality to new component architecture
2. Update imports in index.html as components are migrated
3. Remove unused legacy files once fully replaced

### Future Cleanup
- [ ] Remove scripts/main.js when confirmed unused
- [ ] Evaluate scripts/config.js for migration to new config system
- [ ] Evaluate scripts/utils.js for migration to new util modules
- [ ] Evaluate scripts/entities/* for removal (new components handle this)
- [ ] Evaluate scripts/services/conversation-service.js for removal
- [ ] Evaluate scripts/api-client.js for migration to new API service
- [ ] Evaluate scripts/chat.js for removal (functionality now in new ChatInterface)

## Notes
- All voice-related legacy files (voice-input.js, voice-output.js) have been successfully removed
- The new architecture uses ES6 modules in the frontend/src directory
- Legacy files are in CommonJS format (using window.export/window.module) and should be phased out