# Change: Refactor to Modular Node/Trigger Structure

## Why

The current folder structure separates nodes, triggers, and schemas into different directories, which makes it difficult to maintain and understand node implementations. Each node/trigger should be self-contained with all its related files (implementation, schema, types, tests) in one place for better modularity and maintainability.

Current structure:
- `src/nodes/` - node implementations
- `src/triggers/` - trigger implementations
- `src/schemas/` - all schemas in one place

This separation creates:
- Difficulty finding related files for a specific node
- Poor code organization and discoverability
- Harder to maintain and extend individual nodes
- Inconsistent patterns across the codebase

## What Changes

- **Modular Node Structure**: Each node will have its own folder containing:
  - Node implementation file
  - Schema file
  - Types/interfaces (if node-specific)
  - Index file for exports
  - Tests (moved to node folder or kept in __tests__ with proper organization)

- **Modular Trigger Structure**: Each trigger will have its own folder containing:
  - Trigger implementation file
  - Schema file
  - Utility files (if trigger-specific, like schedule-utils.ts)
  - Index file for exports

- **Folder Structure**:
  ```
  src/
  ├── nodes/
  │   ├── javascript-execution-node/
  │   │   ├── javascript-execution-node.ts
  │   │   ├── schema.ts
  │   │   └── index.ts
  │   ├── http-request-node/
  │   │   ├── http-request-node.ts
  │   │   ├── schema.ts
  │   │   └── index.ts
  │   └── index.ts
  ├── triggers/
  │   ├── manual-trigger/
  │   │   ├── manual-trigger.ts
  │   │   ├── schema.ts
  │   │   └── index.ts
  │   ├── schedule-trigger/
  │   │   ├── schedule-trigger.ts
  │   │   ├── schedule-utils.ts
  │   │   ├── schema.ts
  │   │   └── index.ts
  │   └── index.ts
  └── schemas/
      ├── schema-validator.ts (shared utility)
      ├── schema-to-types.ts (shared utility)
      └── index.ts
  ```

- **Shared Schema Utilities**: Keep `schema-validator.ts` and `schema-to-types.ts` in `schemas/` folder as they are shared utilities.

## Impact

- **Affected specs**:
  - `workflow-nodes`: Node structure and organization
  - `workflow-triggers`: Trigger structure and organization

- **Affected code**:
  - `src/nodes/` - folder structure reorganization
  - `src/triggers/` - folder structure reorganization
  - `src/schemas/` - move node/trigger-specific schemas to respective folders
  - All import statements throughout the codebase
  - `src/nodes/index.ts` - update exports
  - `src/triggers/index.ts` - update exports
  - Test files - update imports

- **Breaking changes**:
  - **BREAKING**: Import paths for nodes and triggers will change
  - **BREAKING**: Schema import paths will change for node/trigger-specific schemas

