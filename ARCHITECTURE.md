# Workflow Architecture

This document describes the architecture of the workflow system, including its core components, design patterns, and execution model.

## Overview

The workflow system is a node-based execution engine that allows users to create complex workflows by connecting nodes together. Each node represents a unit of work that processes input data and produces output data. Workflows are initiated by trigger nodes, which can be scheduled or manually activated.

## Core Concepts

### Unified Node Model

All nodes, including triggers, are treated uniformly in the system. The distinction between regular nodes and triggers is made through the `isTrigger` property on `NodeProperties`. This unified model simplifies the codebase and allows triggers to be used like regular nodes when needed.

```typescript
interface NodeProperties {
  // ... other properties
  isTrigger?: boolean
}
```

### Node Execution Model

Every node follows a strict input-process-output model:

1. **Input**: Node receives data from connected nodes via input ports
2. **Process**: Node executes its logic using the input data and configuration
3. **Output**: Node produces output data on output ports

### Workflow Execution

Workflows are executed using a DAG (Directed Acyclic Graph) based execution engine:

1. **Dependency Resolution**: The engine builds a dependency graph from workflow links
2. **Topological Sort**: Nodes are ordered using Kahn's algorithm to ensure dependencies are satisfied
3. **Parallel Execution**: Independent nodes (nodes at the same level) can execute in parallel
4. **State Management**: Execution state is tracked centrally, allowing nodes to reference previous node outputs

## Architecture Components

### 1. Core Components

#### Workflow
- Manages nodes and their connections
- Provides serialization/deserialization
- Handles workflow state

#### BaseNode
- Abstract base class for all nodes
- Manages ports, state, and configuration
- Provides schema validation support

#### ExecutionEngine
- Executes workflows using DAG-based approach
- Manages execution state
- Handles retry logic and error recovery

### 2. Protocols

The system uses protocols to ensure consistent behavior across components:

#### ExecutionProtocol
- Defines how nodes are executed
- Validates node readiness
- Provides consistent execution interface

#### DataFlowProtocol
- Handles data passing between nodes
- Normalizes data formats
- Combines data from multiple sources

#### ErrorHandlingProtocol
- Manages error handling consistently
- Determines execution continuation on errors
- Propagates error information

### 3. State Management

#### ExecutionStateManager
- Tracks execution state for all nodes
- Records execution metadata (timing, status)
- Supports state persistence and recovery

### 4. Configuration Schema

All nodes support JSON Schema validation for their configuration:

- **Schema Definition**: Each node type can define a JSON Schema for its configuration
- **Validation**: Configuration is validated before being applied
- **Type Safety**: Ensures configuration matches expected structure

### 5. Retry Mechanism

Nodes can be configured to retry on failure:

- **Retry Strategies**: Fixed delay or exponential backoff
- **Configurable**: Max retries and delay can be configured per node
- **Automatic**: Retries happen automatically during execution

### 6. Plugin System

The system supports a plugin architecture:

- **Plugin Registry**: Manages plugin registration and discovery
- **Dependency Management**: Handles plugin dependencies
- **Versioning**: Supports versioned plugins

### 7. Node Factory

Nodes are created using a factory pattern:

- **Factory Registration**: Node types register factory functions
- **Version Support**: Factories support versioned node types
- **Dynamic Creation**: Nodes can be created from serialized data

## Execution Flow

1. **Trigger Activation**: A trigger node is activated (manually or by schedule)
2. **Workflow Reset**: The workflow state is reset to prepare for execution
3. **Dependency Graph**: The engine builds a dependency graph from workflow links
4. **Topological Sort**: Nodes are ordered by execution level
5. **Level-by-Level Execution**:
   - Nodes at each level execute (potentially in parallel)
   - Execution state is updated after each node completes
   - Next level nodes wait for dependencies
6. **Completion**: Workflow state is set to Completed or Failed

## Data Flow

### Port-Based Data Flow

Data flows between nodes via ports:

- **Input Ports**: Nodes receive data on named input ports
- **Output Ports**: Nodes produce data on named output ports
- **Port Types**: Ports have data types for validation

### Execution State

In addition to port-based data flow, nodes can access execution state:

- **State Access**: Nodes can reference any previous node's output via state
- **State Object**: `state.nodeName.portName` provides access to previous outputs
- **LangGraph-like**: Similar to LangGraph's state concept

## Error Handling

### Node-Level Errors

- **Error State**: Failed nodes are marked with error state
- **Error Propagation**: Errors are propagated to downstream nodes
- **Continue on Fail**: Nodes can be configured to continue execution on failure

### Workflow-Level Errors

- **Execution Stop**: Workflow execution stops on critical errors
- **Error Recovery**: Retry mechanism can recover from transient errors
- **State Preservation**: Failed execution state is preserved for debugging

## Extensibility

### Adding New Node Types

1. Extend `BaseNode` class
2. Implement `process()` method
3. Define configuration schema (optional)
4. Register node type in registry

### Adding New Trigger Types

1. Extend `TriggerNodeBase` class
2. Implement `activate()` method
3. Set `isTrigger: true` in properties
4. Define configuration schema (optional)

### Plugin Development

1. Create plugin manifest
2. Define node types provided by plugin
3. Register plugin with PluginRegistry
4. Plugin dependencies are automatically resolved

## Performance Considerations

### Parallel Execution

- Independent nodes execute in parallel when possible
- Reduces total execution time for workflows with parallel branches
- Controlled by execution engine's parallel execution settings

### State Management

- Execution state is managed centrally
- Efficient state queries for node execution
- State persistence for long-running workflows

### Schema Validation

- Schemas are compiled and cached
- Validation is fast for repeated configurations
- Validation errors provide clear feedback

## Testing Strategy

The system includes comprehensive tests:

- **Unit Tests**: Test individual components
- **Integration Tests**: Test workflow execution
- **DAG Tests**: Test dependency resolution and parallel execution
- **Schema Tests**: Test configuration validation
- **Retry Tests**: Test retry mechanisms
- **State Management Tests**: Test state tracking and persistence

## Future Enhancements

Potential future improvements:

- **Workflow Versioning**: Version workflows for migration
- **Workflow Templates**: Reusable workflow patterns
- **Visual Editor**: GUI for creating workflows
- **Workflow Analytics**: Execution metrics and performance analysis
- **Distributed Execution**: Execute workflows across multiple machines

