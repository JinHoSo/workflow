## 1. Reorganize JavaScript Execution Node
- [x] 1.1 Create `src/nodes/javascript-execution-node/` directory
- [x] 1.2 Move `javascript-execution-node.ts` to new directory
- [x] 1.3 Move `javascript-node-schema.ts` to new directory as `schema.ts`
- [x] 1.4 Create `index.ts` in new directory to export node and schema
- [x] 1.5 Update imports in `javascript-execution-node.ts` to use local schema

## 2. Reorganize HTTP Request Node
- [x] 2.1 Create `src/nodes/http-request-node/` directory
- [x] 2.2 Move `http-request-node.ts` to new directory
- [x] 2.3 Move `http-request-node-schema.ts` to new directory as `schema.ts`
- [x] 2.4 Create `index.ts` in new directory to export node and schema
- [x] 2.5 Update imports in `http-request-node.ts` to use local schema

## 3. Reorganize Manual Trigger
- [x] 3.1 Create `src/nodes/manual-trigger/` directory (moved to nodes folder)
- [x] 3.2 Move `manual-trigger.ts` to new directory
- [x] 3.3 Move `manual-trigger-schema.ts` to new directory as `schema.ts`
- [x] 3.4 Create `index.ts` in new directory to export trigger and schema
- [x] 3.5 Update imports in `manual-trigger.ts` to use local schema

## 4. Reorganize Schedule Trigger
- [x] 4.1 Create `src/nodes/schedule-trigger/` directory (moved to nodes folder)
- [x] 4.2 Move `schedule-trigger.ts` to new directory
- [x] 4.3 Move `schedule-utils.ts` to new directory (trigger-specific utility)
- [x] 4.4 Move `schedule-trigger-schema.ts` to new directory as `schema.ts`
- [x] 4.5 Create `index.ts` in new directory to export trigger, utils, and schema
- [x] 4.6 Update imports in `schedule-trigger.ts` to use local schema and utils

## 5. Update Shared Exports
- [x] 5.1 Update `src/nodes/index.ts` to export from new modular structure
- [x] 5.2 Update `src/triggers/index.ts` to export from new modular structure (triggers folder removed)
- [x] 5.3 Update `src/schemas/index.ts` to only export shared utilities

## 6. Update All Imports
- [x] 6.1 Find all files importing from old node paths and update
- [x] 6.2 Find all files importing from old trigger paths and update (all moved to nodes)
- [x] 6.3 Find all files importing schemas from old paths and update
- [x] 6.4 Update test files with new import paths

## 7. Cleanup
- [x] 7.1 Remove old schema files from `src/schemas/` (node/trigger-specific ones)
- [x] 7.2 Verify `src/schemas/` only contains shared utilities
- [x] 7.3 Remove unused `trigger-registry.ts` file
- [x] 7.4 Remove `src/triggers/` folder (all triggers moved to nodes)

## 8. Testing
- [x] 8.1 Run all tests to ensure imports work correctly
- [x] 8.2 Fix any broken imports or references
- [x] 8.3 Verify node and trigger functionality still works
