# Legacy Scripts Directory

This directory contains components from the original chatbot architecture that have been superseded by the new component-based architecture.

## Status
- Most voice functionality has been migrated to the new ChatInterface component
- Some files may still be referenced by the frontend components
- This directory is kept for historical reference and in case any functionality needs to be ported to the new architecture

## Contents
- entities/: Legacy data model definitions
- services/: Legacy service implementations
- config.js: Configuration file (may still be used)
- utils.js: Utility functions (may still be used)
- api-client.js: API client (may still be referenced)
- chat.js: Legacy chat component (may still be partly used)
- main.js: Legacy main application logic (likely obsolete)

## Migration Status
- [x] Voice input/output functionality: Migrated to ChatInterface
- [ ] Other functionality: Pending review for migration or removal