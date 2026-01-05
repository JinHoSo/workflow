# API Reference

Complete API documentation for Workflow Engine. This reference covers all public classes, methods, types, and interfaces.

## API Overview

Workflow Engine provides APIs for:

- **Core Workflow Management**: Creating and managing workflows
- **Node Execution**: Executing nodes and managing execution state
- **Node Types**: Built-in and custom node types
- **Protocols**: Execution, data flow, and error handling protocols
- **Plugin System**: Plugin registration and management
- **Type Definitions**: TypeScript types and interfaces

## API Sections

### Core APIs

- [Core API](./core.md) - Workflow, BaseNode, and core classes
  - `Workflow` - Main workflow class
  - `BaseNode` - Base class for all nodes
  - `NodeTypeRegistry` - Node type registration
  - `NodeFactory` - Node creation from serialized data

### Execution APIs

- [Execution Engine](./execution.md) - ExecutionEngine and execution APIs
  - `ExecutionEngine` - Workflow execution engine
  - `ExecutionStateManager` - Execution state management
  - `DAGUtils` - Dependency graph utilities
  - `RetryStrategy` - Retry mechanism

### Node Types

- [Node Types](./nodes.md) - Built-in node types
  - `ManualTrigger` - Manual workflow trigger
  - `ScheduleTrigger` - Scheduled workflow trigger
  - `JavaScriptExecutionNode` - JavaScript code execution
  - `HttpRequestNode` - HTTP request node

### Protocols

- [Protocols](./protocols.md) - Protocol interfaces
  - `ExecutionProtocol` - Node execution protocol
  - `DataFlowProtocol` - Data flow protocol
  - `ErrorHandlingProtocol` - Error handling protocol

### Plugin System

- [Plugin System](./plugins.md) - Plugin registration and management
  - `PluginRegistry` - Plugin registration
  - `PluginDiscovery` - Plugin discovery
  - `Plugin` - Plugin interface

### Type Definitions

- [Type Definitions](./types.md) - TypeScript type definitions
  - `NodeProperties` - Node properties interface
  - `NodeState` - Node state enum
  - `WorkflowState` - Workflow state enum
  - `ExecutionContext` - Execution context interface
  - `NodeOutput` - Node output interface

## Quick Reference

### Creating a Workflow

```typescript
import { Workflow } from "@workflow/core"

const workflow = new Workflow("my-workflow")
```

### Adding Nodes

```typescript
import { ManualTrigger } from "@workflow/nodes"

const trigger = new ManualTrigger({
  id: "trigger-1",
  name: "trigger",
  nodeType: "manual-trigger",
  version: 1,
  position: [0, 0],
})

workflow.addNode(trigger)
```

### Executing a Workflow

```typescript
import { ExecutionEngine } from "@workflow/execution"

const engine = new ExecutionEngine(workflow)
trigger.setExecutionEngine(engine)
trigger.trigger({ output: { data: "value" } })
```

## Type Safety

All APIs are fully typed with TypeScript. Type definitions are available in:

- `@workflow/interfaces` - Core interfaces and types
- `@workflow/core` - Core class types
- `@workflow/execution` - Execution types

## Examples

Each API section includes code examples. For more examples, see:

- [Basic Examples](../../examples/basic/)
- [Advanced Examples](../../examples/advanced/)
- [Integration Examples](../../examples/integrations/)

## Related Documentation

- [Getting Started](../getting-started/README.md) - Getting started guide
- [Guides](../guides/building-workflows.md) - Usage guides
- [Architecture](../../ARCHITECTURE.md) - System architecture

