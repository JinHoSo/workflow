# Change: Add Workflow Import/Export Functionality

## Why
Users need the ability to save workflows as JSON files and restore them later. This enables workflow backup, sharing between environments, version control, and workflow templates. The system must support exporting a complete workflow definition (nodes, connections, settings, static data) to JSON format and importing that JSON to recreate a fully functional workflow.

## What Changes
- **ADDED**: Workflow export functionality that serializes workflow to JSON format
- **ADDED**: Workflow import functionality that deserializes JSON and recreates workflow instance
- **ADDED**: JSON schema for workflow serialization format
- **ADDED**: Validation for imported workflow data
- **ADDED**: Node reconstruction from serialized data during import

## Impact
- **Affected specs**:
  - `workflow-core` (new requirements for import/export)
- **Affected code**:
  - `src/core/workflow.ts` - Add export/import methods
  - `src/interfaces/workflow.ts` - Add serialization interfaces
  - New serialization utilities for node reconstruction

