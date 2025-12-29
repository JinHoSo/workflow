# Change: Refactor Workflow Architecture for Enterprise-Grade Extensibility

## Why

The current workflow implementation has several architectural limitations that prevent it from being a truly extensible, enterprise-grade workflow system:

1. **Node/Trigger Separation Complexity**: Nodes and triggers are stored separately in Workflow, creating inconsistent patterns. Triggers extend BaseNode but override `run()` to throw an error, which is a code smell indicating poor abstraction.

2. **Limited Execution Engine**: The execution engine uses a simple queue-based approach without proper DAG resolution, no parallel execution of independent nodes, and basic error handling without retry/recovery mechanisms.

3. **Weak Type System**: Data flow type checking is just string matching with no schema validation. NodeConfiguration is too loose (`Record<string, unknown>`) with no validation.

4. **No Plugin System**: There's no mechanism for dynamic node loading, no plugin architecture, and adding new node types requires modifying core code.

5. **Protocols Not Utilized**: Protocols are defined but not consistently used throughout the system, reducing their value.

6. **State Management Gaps**: No centralized state management, no persistence, and no recovery mechanisms.

7. **Limited Extensibility**: Hard to extend without modifying core code, no versioning strategy, and no marketplace concept.

## What Changes

This change refactors the workflow architecture to address these limitations:

- **Unified Node Model**: Triggers are treated as first-class nodes with a unified execution model, eliminating the separate storage and inconsistent patterns.

- **Enhanced Execution Engine**: Proper DAG resolution with topological sorting, parallel execution of independent nodes, and advanced error handling with retry strategies.

- **Type System Improvements**: Schema-based configuration validation, proper data type system with schema validation, and type-safe configuration interfaces.

- **Plugin Architecture**: Dynamic node loading system, plugin registry, and versioning strategy for node types.

- **Protocol Implementation**: Fully implement and consistently use execution, data flow, and error handling protocols throughout the system.

- **State Management**: Centralized execution state with persistence support and recovery mechanisms.

- **Extensibility Framework**: Node factory pattern, configuration schema system, and extension points for custom node types.

## Impact

- **Affected specs**:
  - `workflow-core`: Execution engine improvements, unified node model
  - `workflow-nodes`: Base node abstraction improvements, plugin system
  - `workflow-execution`: New execution capabilities (parallel execution, retry, etc.)
  - `workflow-extensibility`: New capability for plugin system and dynamic loading

- **Affected code**:
  - `src/core/workflow.ts`: Unified node storage, plugin integration
  - `src/core/base-node.ts`: Enhanced abstraction, configuration schema
  - `src/execution/execution-engine.ts`: DAG resolution, parallel execution, retry logic
  - `src/core/node-type-registry.ts`: Plugin system integration
  - `src/triggers/base-trigger.ts`: Unified with regular nodes
  - `src/protocols/*`: Full protocol implementation
  - `src/__tests__/*`: Complete test suite refactoring for new architecture
  - New: `src/plugins/`: Plugin system implementation
  - New: `src/schemas/`: Configuration schema system

- **Breaking changes**:
  - **BREAKING**: Workflow no longer separates nodes and triggers - all stored in unified collection
  - **BREAKING**: NodeConfiguration now requires schema validation
  - **BREAKING**: Execution engine API changes for parallel execution support

