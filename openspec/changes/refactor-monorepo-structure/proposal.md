# Change: Refactor Workflow Package to Monorepo Structure

## Why
The workflow package currently has all source code in a root `src/` directory, while the project already uses yarn workspaces with `packages/cli` and `packages/test-utils`. To properly organize the monorepo and enable better code organization, dependency management, and independent versioning, the root `src/` directory should be split into appropriate workspace packages.

## What Changes
- **BREAKING**: Root `src/` directory will be split into multiple workspace packages:
  - `@workflow/core` - Core workflow engine (base-node, workflow, node-type-registry, etc.)
  - `@workflow/interfaces` - TypeScript interfaces and type definitions
  - `@workflow/execution` - Execution engine and DAG utilities
  - `@workflow/nodes` - Built-in nodes (http-request, javascript-execution, triggers)
  - `@workflow/plugins` - Plugin system (discovery, registry, hot-reload)
  - `@workflow/protocols` - Protocol implementations (data-flow, execution, error-handling)
  - `@workflow/schemas` - Schema validation and type generation
  - `@workflow/secrets` - Secrets management system
- Root `package.json` will become workspace-only (no source code, only workspace configuration)
- All internal imports will be updated to use package names instead of relative paths
- Build configuration will be updated for each package
- Test configuration will be updated for each package
- CLI and test-utils packages will be updated to depend on the new packages

## Impact
- Affected specs: `workflow-core`, `workflow-nodes`, `workflow-triggers`, `workflow-state`
- Affected code:
  - Root `src/` directory (will be split)
  - Root `package.json` (workspace configuration only)
  - Root `tsconfig.json` (may be removed or simplified)
  - `packages/cli/src/**` (import updates)
  - `packages/test-utils/src/**` (import updates)
  - All build and test configurations

