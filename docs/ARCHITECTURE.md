# Workflow Architecture

This document describes the architecture of the workflow engine.

## Overview

The workflow engine is designed for enterprise-grade extensibility with:
- Unified node model (triggers and regular nodes)
- DAG-based execution with parallel processing
- Schema-based configuration validation
- Plugin architecture for dynamic extensibility
- Protocol-based communication
- Centralized state management

## Core Components

### 1. Unified Node Model

All nodes, including triggers, are stored in a unified collection. Triggers are identified by the `isTrigger` property.

**Key Classes:**
- `BaseNode`: Abstract base class for all nodes
- `TriggerNodeBase`: Base class for trigger nodes
- `Workflow`: Manages unified node collection

**Benefits:**
- Consistent execution model
- Simplified workflow management
- Easier serialization/deserialization

### 2. DAG-Based Execution Engine

The execution engine uses topological sorting to determine execution order and enables parallel execution of independent nodes.

**Key Classes:**
- `ExecutionEngine`: Orchestrates workflow execution
- `DAGUtils`: Provides dependency graph utilities
- `ExecutionStateManager`: Manages execution state

**Features:**
- Topological sort (Kahn's algorithm)
- Circular dependency detection
- Parallel execution of independent nodes
- Dependency level grouping

### 3. Configuration Schema System

Node configurations are validated using JSON Schema.

**Key Classes:**
- `SchemaValidator`: Validates configurations against schemas
- `BaseNode.setup()`: Validates configuration on setup

**Benefits:**
- Type safety at configuration time
- Clear documentation of valid configurations
- Prevents runtime configuration errors

### 4. Plugin Architecture

Plugins allow dynamic loading and registration of node types.

**Key Classes:**
- `PluginRegistry`: Manages plugin registration
- `NodeTypeRegistry`: Manages node type registration
- `Plugin`: Plugin interface

**Features:**
- Dynamic plugin loading/unloading
- Plugin dependencies
- Automatic node type registration

### 5. Protocol System

Protocols ensure consistent behavior across all nodes.

**Protocols:**
- `ExecutionProtocol`: Handles node execution
- `DataFlowProtocol`: Handles data passing between nodes
- `ErrorHandlingProtocol`: Handles errors consistently

**Benefits:**
- Loose coupling between components
- Easier testing and mocking
- Foundation for distributed execution

### 6. State Management

Centralized execution state with persistence support.

**Key Classes:**
- `ExecutionStateManager`: Manages execution state
- `ExecutionState`: State interface
- `StatePersistenceHook`: Persistence interface

**Features:**
- Centralized state tracking
- State persistence hooks
- State recovery mechanisms

## Data Flow

```
Trigger Node
    ↓
Execution Engine (Topological Sort)
    ↓
Independent Nodes (Parallel Execution)
    ↓
Dependent Nodes (Sequential Execution)
    ↓
State Manager (Track Results)
    ↓
Next Level Nodes
```

## Execution Flow

1. **Trigger Activation**: Trigger node is activated
2. **Dependency Resolution**: Build dependency graph
3. **Topological Sort**: Determine execution order
4. **Node Grouping**: Group nodes by dependency level
5. **Parallel Execution**: Execute independent nodes in parallel
6. **State Tracking**: Track execution state
7. **Error Handling**: Handle errors using protocol
8. **Completion**: Mark workflow as completed

## Extension Points

### Adding a New Node Type

1. Extend `BaseNode`
2. Implement `process()` method
3. Define configuration schema
4. Register in plugin or directly in registry

### Adding a New Plugin

1. Create plugin manifest
2. Define node type classes
3. Register plugin via `PluginRegistry`
4. Node types are automatically registered

### Adding a New Protocol

1. Define protocol interface
2. Implement protocol class
3. Use protocol in execution engine
4. Update protocol validator

## Versioning Strategy

Node types use semantic versioning:
- **Patch**: Bug fixes, fully compatible
- **Minor**: New features, backward compatible
- **Major**: Breaking changes, migration required

Version compatibility is tracked and migration utilities are provided.

## Testing Strategy

- **Unit Tests**: Test individual components
- **Integration Tests**: Test component interactions
- **Protocol Tests**: Test protocol compliance
- **Performance Tests**: Benchmark execution engine

## Performance Considerations

- **Parallel Execution**: Independent nodes execute in parallel
- **State Caching**: Execution state is cached
- **Schema Validation**: Schemas are compiled and cached
- **Dependency Resolution**: Topological sort is optimized

## Security Considerations

- **Schema Validation**: Prevents invalid configurations
- **Plugin Sandboxing**: (Future) Isolate plugin execution
- **Error Handling**: Prevents error propagation
- **State Isolation**: Each workflow has isolated state

## Future Enhancements

- Plugin sandboxing for security
- Distributed execution support
- Workflow versioning and migration
- Real-time collaboration
- Performance optimizations

