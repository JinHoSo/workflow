## 1. Reorganize JavaScript Execution Node
- [ ] 1.1 Create `src/nodes/javascript-execution-node/` directory
- [ ] 1.2 Move `javascript-execution-node.ts` to new directory
- [ ] 1.3 Move `javascript-node-schema.ts` to new directory as `schema.ts`
- [ ] 1.4 Create `index.ts` in new directory to export node and schema
- [ ] 1.5 Update imports in `javascript-execution-node.ts` to use local schema

## 2. Reorganize HTTP Request Node
- [ ] 2.1 Create `src/nodes/http-request-node/` directory
- [ ] 2.2 Move `http-request-node.ts` to new directory
- [ ] 2.3 Move `http-request-node-schema.ts` to new directory as `schema.ts`
- [ ] 2.4 Create `index.ts` in new directory to export node and schema
- [ ] 2.5 Update imports in `http-request-node.ts` to use local schema

## 3. Reorganize Manual Trigger
- [ ] 3.1 Create `src/triggers/manual-trigger/` directory
- [ ] 3.2 Move `manual-trigger.ts` to new directory
- [ ] 3.3 Move `manual-trigger-schema.ts` to new directory as `schema.ts`
- [ ] 3.4 Create `index.ts` in new directory to export trigger and schema
- [ ] 3.5 Update imports in `manual-trigger.ts` to use local schema

## 4. Reorganize Schedule Trigger
- [ ] 4.1 Create `src/triggers/schedule-trigger/` directory
- [ ] 4.2 Move `schedule-trigger.ts` to new directory
- [ ] 4.3 Move `schedule-utils.ts` to new directory (trigger-specific utility)
- [ ] 4.4 Move `schedule-trigger-schema.ts` to new directory as `schema.ts`
- [ ] 4.5 Create `index.ts` in new directory to export trigger, utils, and schema
- [ ] 4.6 Update imports in `schedule-trigger.ts` to use local schema and utils

## 5. Update Shared Exports
- [ ] 5.1 Update `src/nodes/index.ts` to export from new modular structure
- [ ] 5.2 Update `src/triggers/index.ts` to export from new modular structure
- [ ] 5.3 Update `src/schemas/index.ts` to only export shared utilities

## 6. Update All Imports
- [ ] 6.1 Find all files importing from old node paths and update
- [ ] 6.2 Find all files importing from old trigger paths and update
- [ ] 6.3 Find all files importing schemas from old paths and update
- [ ] 6.4 Update test files with new import paths

## 7. Cleanup
- [ ] 7.1 Remove old schema files from `src/schemas/` (node/trigger-specific ones)
- [ ] 7.2 Verify `src/schemas/` only contains shared utilities

## 8. Testing
- [ ] 8.1 Run all tests to ensure imports work correctly
- [ ] 8.2 Fix any broken imports or references
- [ ] 8.3 Verify node and trigger functionality still works

