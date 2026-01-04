# Package Structure and Dependencies

This document describes the monorepo package structure and build order.

## Package Overview

The workflow engine is organized into the following packages:

### Core Packages

1. **`@workflow/interfaces`** - TypeScript interfaces and type definitions
   - No dependencies
   - Exports: All interfaces, types, and type definitions

2. **`@workflow/core`** - Core workflow engine
   - Depends on: `@workflow/interfaces`, `@workflow/schemas`, `@workflow/secrets`
   - Peer dependencies: `@workflow/execution`, `@workflow/plugins` (for type-only imports)
   - Exports: Workflow, BaseNode, NodeTypeRegistry, TriggerNodeBase, etc.

3. **`@workflow/execution`** - Execution engine
   - Depends on: `@workflow/core`, `@workflow/interfaces`, `@workflow/protocols`, `@workflow/secrets`
   - Exports: ExecutionEngine, ExecutionStateManager, DAG utilities

4. **`@workflow/protocols`** - Protocol implementations
   - Depends on: `@workflow/interfaces`, `@workflow/core`
   - Exports: ExecutionProtocol, DataFlowProtocol, ErrorHandlingProtocol

5. **`@workflow/schemas`** - Schema validation
   - Depends on: `@workflow/interfaces`
   - Exports: SchemaValidator, JsonSchema type

6. **`@workflow/secrets`** - Secrets management
   - Depends on: `@workflow/interfaces`
   - Exports: SecretService, SecretRegistry, encryption utilities

7. **`@workflow/plugins`** - Plugin system
   - Depends on: `@workflow/core`, `@workflow/interfaces`
   - Exports: PluginRegistry, PluginDiscovery, PluginHotReload

8. **`@workflow/nodes`** - Built-in nodes
   - Depends on: `@workflow/core`, `@workflow/interfaces`, `@workflow/schemas`
   - Exports: ManualTrigger, ScheduleTrigger, JavaScriptExecutionNode, HttpRequestNode

### Utility Packages

9. **`@workflow/cli`** - CLI tool
   - Depends on: `@workflow/core`, `@workflow/interfaces`, `@workflow/plugins`, `@workflow/protocols`
   - Exports: CLI commands and utilities

10. **`@workflow/test-utils`** - Testing utilities
    - Depends on: `@workflow/core`, `@workflow/interfaces`
    - Exports: Node execution simulator, test helpers

## Build Order

Packages must be built in the following order due to dependencies:

1. `@workflow/interfaces` (no dependencies)
2. `@workflow/schemas` (depends on interfaces)
3. `@workflow/secrets` (depends on interfaces)
4. `@workflow/protocols` (depends on interfaces, core)
5. `@workflow/plugins` (depends on core, interfaces)
6. `@workflow/execution` (depends on core, interfaces, protocols, secrets)
7. `@workflow/core` (depends on interfaces, schemas, secrets; peer deps: execution, plugins)
8. `@workflow/nodes` (depends on core, interfaces, schemas)
9. `@workflow/cli` (depends on core, interfaces, plugins, protocols)
10. `@workflow/test-utils` (depends on core, interfaces)

## Circular Dependencies

There are circular dependencies between:
- `@workflow/core` ↔ `@workflow/execution` (core uses ExecutionEngine type, execution uses core classes)
- `@workflow/core` ↔ `@workflow/plugins` (core uses Plugin type, plugins uses core classes)

These are handled as peer dependencies with type-only imports to avoid runtime circular dependencies.

## Building

Use the root build script which builds packages in the correct order:

```bash
yarn build
```

Or build packages individually in dependency order:

```bash
yarn workspace @workflow/interfaces build
yarn workspace @workflow/schemas build
yarn workspace @workflow/secrets build
yarn workspace @workflow/protocols build
yarn workspace @workflow/plugins build
yarn workspace @workflow/execution build
yarn workspace @workflow/core build
yarn workspace @workflow/nodes build
yarn workspace @workflow/cli build
yarn workspace @workflow/test-utils build
```

