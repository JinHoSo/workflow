# Design: Modular Node/Trigger Structure

## Context

The current workflow system organizes nodes, triggers, and schemas in separate top-level directories. This creates a flat structure where related files for a single node are scattered across multiple directories, making it harder to maintain and understand individual node implementations.

**Current State**:
- Nodes in `src/nodes/` (flat structure)
- Triggers in `src/triggers/` (flat structure)
- All schemas in `src/schemas/` (flat structure)
- Related files for a node are separated across directories

**Target State**:
- Each node in its own folder with all related files
- Each trigger in its own folder with all related files
- Shared utilities remain in `src/schemas/`
- Better code organization and discoverability

## Goals / Non-Goals

### Goals
- **Modular Organization**: Each node/trigger is self-contained
- **Better Discoverability**: All files for a node are in one place
- **Easier Maintenance**: Changes to a node are localized to its folder
- **Consistent Structure**: All nodes/triggers follow the same pattern
- **Backward Compatibility**: Maintain same public API (exports)

### Non-Goals
- Moving shared utilities (schema-validator, schema-to-types) - these stay in `schemas/`
- Changing node/trigger APIs or interfaces
- Moving test files (can be done separately if needed)
- Changing core architecture or execution model

## Decisions

### Decision: Modular Folder Structure
**What**: Each node/trigger gets its own folder with implementation, schema, and index file.

**Why**:
- Better code organization and discoverability
- Easier to maintain and extend individual nodes
- Follows common patterns in modular codebases
- Makes it easier to add new nodes/triggers

**Alternatives considered**:
- Keep flat structure: Rejected - poor organization
- Group by category: Considered but rejected - too complex for current scale

**Implementation**:
- Create folder per node/trigger: `nodes/{node-name}/`, `triggers/{trigger-name}/`
- Move implementation file to folder
- Move schema file to folder as `schema.ts`
- Create `index.ts` in each folder for exports
- Update all imports throughout codebase

### Decision: Keep Shared Utilities in schemas/
**What**: `schema-validator.ts` and `schema-to-types.ts` remain in `src/schemas/`.

**Why**:
- These are shared utilities used by all nodes/triggers
- Not specific to any single node/trigger
- Keeps shared code centralized

**Alternatives considered**:
- Move to each node folder: Rejected - would duplicate code
- Move to core/: Considered but rejected - schemas are domain-specific

### Decision: Trigger-Specific Utilities Stay with Trigger
**What**: Utilities like `schedule-utils.ts` move with the trigger to its folder.

**Why**:
- These utilities are specific to the trigger
- Better cohesion and discoverability
- Follows modular principle

## Risks / Trade-offs

### Risk: Import Path Changes
**Mitigation**:
- Update all imports systematically
- Use find/replace for common patterns
- Run tests to catch missed imports

### Risk: Breaking Changes
**Mitigation**:
- Maintain same public API through index.ts exports
- Update all internal imports
- Comprehensive testing

### Risk: Merge Conflicts
**Mitigation**:
- Complete refactoring in single focused change
- Clear communication of changes
- Update documentation

## Migration Plan

### Phase 1: Create New Structure
1. Create new folders for each node/trigger
2. Move implementation files
3. Move schema files
4. Create index.ts files

### Phase 2: Update Imports
1. Update imports in moved files (local schema imports)
2. Update imports in other files (node/trigger imports)
3. Update test file imports

### Phase 3: Update Exports
1. Update `src/nodes/index.ts`
2. Update `src/triggers/index.ts`
3. Update `src/schemas/index.ts`

### Phase 4: Cleanup and Test
1. Remove old files
2. Run all tests
3. Fix any issues
4. Verify functionality

## Open Questions

1. **Test File Organization**: Should test files also move to node folders? (Deferred - can be done separately)
2. **Future Nodes**: Should there be a template or generator for new nodes? (Future enhancement)

