# Design: Monorepo Structure Refactoring

## Context
The workflow package currently has a monolithic structure with all source code in `src/` at the root, while already using yarn workspaces for `packages/cli` and `packages/test-utils`. This creates inconsistency and prevents proper package-level dependency management.

## Goals
- Split root `src/` into logical workspace packages
- Maintain all existing functionality
- Enable independent versioning and builds per package
- Improve dependency management and code organization
- Preserve all existing exports and APIs

## Non-Goals
- Changing the public API of any package
- Refactoring internal implementation logic
- Adding new features or capabilities
- Changing test behavior or coverage requirements

## Decisions

### Decision: Package Structure
Split root `src/` into the following packages:

1. **@workflow/interfaces** - Pure TypeScript interfaces and types
   - `src/interfaces/**`
   - `src/types/**`
   - No runtime dependencies on other workflow packages

2. **@workflow/core** - Core workflow engine
   - `src/core/**`
   - Depends on: `@workflow/interfaces`
   - Exports: Workflow, BaseNode, NodeTypeRegistry, etc.

3. **@workflow/execution** - Execution engine
   - `src/execution/**`
   - Depends on: `@workflow/core`, `@workflow/interfaces`
   - Exports: ExecutionEngine, ExecutionStateManager, etc.

4. **@workflow/protocols** - Protocol implementations
   - `src/protocols/**`
   - Depends on: `@workflow/interfaces`
   - Exports: DataFlow, Execution, ErrorHandling protocols

5. **@workflow/schemas** - Schema validation
   - `src/schemas/**`
   - Depends on: `@workflow/interfaces`
   - Exports: SchemaValidator, schema-to-types utilities

6. **@workflow/secrets** - Secrets management
   - `src/secrets/**`
   - Depends on: `@workflow/interfaces`
   - Exports: SecretService, SecretRegistry, etc.

7. **@workflow/plugins** - Plugin system
   - `src/plugins/**`
   - Depends on: `@workflow/core`, `@workflow/interfaces`
   - Exports: PluginRegistry, PluginDiscovery, etc.

8. **@workflow/nodes** - Built-in nodes
   - `src/nodes/**`
   - Depends on: `@workflow/core`, `@workflow/interfaces`, `@workflow/schemas`
   - Exports: HttpRequestNode, JavaScriptExecutionNode, ManualTrigger, ScheduleTrigger

**Alternatives considered:**
- Single `@workflow/engine` package: Rejected - too monolithic, doesn't enable granular dependencies
- More granular split (e.g., separate trigger package): Rejected - triggers are nodes, keep together for now

### Decision: Root Package
The root `package.json` will become workspace-only:
- Remove `src/` directory
- Remove build/test scripts (moved to packages)
- Keep only workspace configuration and root-level scripts (e.g., `yarn build` to build all packages)
- Remove `main`, `types`, `files` fields

**Alternatives considered:**
- Keep root as `workflow-engine` package: Rejected - creates confusion with workspace structure
- Create `@workflow/workflow-engine` meta-package: Rejected - unnecessary complexity

### Decision: Import Strategy
- All internal imports will use package names: `@workflow/core`, `@workflow/interfaces`, etc.
- Relative imports (`../`, `../../`) will be replaced with package imports
- Each package will have its own `tsconfig.json` with proper path mappings

### Decision: Build Configuration
- Each package will have its own `tsconfig.json`
- Root `tsconfig.json` will be removed or simplified to workspace references only
- Each package will have its own build script
- Root build script will build all packages in dependency order

### Decision: Test Configuration
- Each package will have its own test configuration
- Tests will be co-located with source code in each package
- Root test script will run all package tests

## Risks / Trade-offs

### Risk: Breaking Changes
**Mitigation**: All exports will be preserved. The refactoring is purely structural - no API changes.

### Risk: Circular Dependencies
**Mitigation**: Package dependencies are designed to be acyclic:
- `interfaces` has no dependencies
- `core` depends only on `interfaces`
- `execution` depends on `core` and `interfaces`
- `nodes` depends on `core`, `interfaces`, `schemas`
- Other packages follow similar patterns

### Risk: Import Path Updates
**Mitigation**: Systematic find-and-replace with validation. All imports will be updated in a single pass.

### Risk: Build Complexity
**Mitigation**: Use yarn workspace scripts to build packages in dependency order. Each package builds independently.

## Migration Plan

1. **Create package structure** - Create all new package directories and `package.json` files
2. **Move source files** - Move files from root `src/` to appropriate packages
3. **Update package.json files** - Configure dependencies and scripts
4. **Update TypeScript configs** - Create `tsconfig.json` for each package
5. **Update imports** - Replace relative imports with package imports
6. **Update root package.json** - Remove source-related fields
7. **Update build/test scripts** - Configure workspace-level scripts
8. **Update CLI and test-utils** - Update their dependencies and imports
9. **Verify builds** - Ensure all packages build successfully
10. **Run tests** - Verify all tests pass
11. **Clean up** - Remove old root `src/` directory and unused configs

## Open Questions
- Should we maintain a root `index.ts` that re-exports from all packages for backward compatibility? (Answer: No - breaking change is acceptable for monorepo structure)
- Should we version all packages together or independently? (Answer: Together initially, independent versioning can be added later if needed)

