# Core Concepts

Understanding the core concepts of Workflow Engine will help you build effective workflows.

## Table of Contents

- [Workflows](#workflows)
- [Nodes](#nodes)
  - [Node Types](#node-types)
  - [Node Properties](#node-properties)
- [Ports](#ports)
- [Data Flow](#data-flow)
- [Execution](#execution)
  - [Execution Engine](#execution-engine)
  - [Execution Flow](#execution-flow)
  - [Execution State](#execution-state)
- [Triggers](#triggers)
- [State Management](#state-management)
  - [Node States](#node-states)
  - [State Transitions](#state-transitions)
  - [Execution State](#execution-state-1)
- [Error Handling](#error-handling)
  - [Node-Level Errors](#node-level-errors)
  - [Workflow-Level Errors](#workflow-level-errors)
  - [Retry Strategies](#retry-strategies)
- [Protocols](#protocols)
- [Plugins](#plugins)
- [Configuration](#configuration)

## Workflows

A **workflow** is a collection of connected nodes that execute in a specific order. Workflows define:

- **Nodes**: The building blocks that perform work
- **Connections**: How data flows between nodes
- **Execution order**: Determined by dependencies

```typescript
const workflow = new Workflow("my-workflow")
```

## Nodes

**Nodes** are the fundamental building blocks of workflows. Each node:

- Receives input data
- Performs processing
- Produces output data
- Has a specific state (Idle, Running, Completed, Failed)

### Node Types

- **Trigger Nodes**: Start workflow execution
- **Execution Nodes**: Process data and perform work
- **Custom Nodes**: User-defined nodes for specific tasks

### Node Properties

```typescript
interface NodeProperties {
  id: string              // Unique identifier
  name: string            // Node name (unique in workflow)
  nodeType: string        // Type of node
  version: number         // Node version
  position: [number, number]  // Visual position
  isTrigger?: boolean     // Is this a trigger?
  disabled?: boolean      // Is node disabled?
  retryOnFail?: boolean   // Retry on failure?
  maxRetries?: number     // Maximum retry attempts
  continueOnFail?: boolean // Continue on failure?
}
```

## Ports

**Ports** are the connection points for data flow:

- **Input Ports**: Receive data from other nodes
- **Output Ports**: Send data to other nodes
- **Port Types**: Define the data type (e.g., "any", "object", "string")

```typescript
// Add input port
node.addInput("input", "any")

// Add output port
node.addOutput("output", "any")
```

## Data Flow

Data flows between nodes through connections:

1. **Source Node** produces output on an output port
2. **Connection** links source output to target input
3. **Target Node** receives data on an input port

```typescript
workflow.linkNodes("source-node", "output", "target-node", "input")
```

### Data Structure

Data is passed as arrays of records:

```typescript
interface DataRecord {
  [key: string]: unknown
}

type NodeInput = {
  [portName: string]: DataRecord[]
}
```

## Execution

### Execution Engine

The **ExecutionEngine** manages workflow execution:

- Builds dependency graph
- Determines execution order (topological sort)
- Executes nodes in parallel when possible
- Manages execution state

```typescript
const engine = new ExecutionEngine(workflow)
```

### Execution Flow

1. **Trigger Activation**: A trigger node starts execution
2. **Dependency Resolution**: Engine builds dependency graph
3. **Topological Sort**: Nodes ordered by dependencies
4. **Level-by-Level Execution**: Nodes at same level execute in parallel
5. **State Updates**: Execution state updated after each node
6. **Completion**: Workflow completes or fails

### Execution State

Execution state tracks:

- **Node States**: Current state of each node
- **Node Outputs**: Data produced by each node
- **Metadata**: Execution timing, errors, etc.

```typescript
const stateManager = engine.getStateManager()
const nodeState = stateManager.getNodeState("node-name")
```

## Triggers

**Triggers** are special nodes that start workflow execution:

- **Manual Trigger**: Triggered programmatically
- **Schedule Trigger**: Triggered on a schedule
- **Webhook Trigger**: Triggered by HTTP requests
- **Custom Triggers**: User-defined trigger types

```typescript
const trigger = new ManualTrigger({...})
trigger.setExecutionEngine(engine)
trigger.trigger({ output: { data: "value" } })
```

## State Management

### Node States

Nodes have four possible states:

- **Idle**: Initial state, ready to execute
- **Running**: Currently executing
- **Completed**: Successfully completed
- **Failed**: Execution failed

### State Transitions

```
Idle → Running → Completed
Idle → Running → Failed
```

### Execution State

Execution state provides access to:

- Previous node outputs
- Current node state
- Execution metadata

```typescript
// Access previous node output in JavaScript node
const previousOutput = state("previous-node", "output")
```

## Error Handling

### Node-Level Errors

- Nodes can fail during execution
- Errors are captured and stored
- Failed nodes transition to Failed state

### Workflow-Level Errors

- Workflow can stop on critical errors
- Retry mechanisms can recover from transient errors
- Error information is preserved for debugging

### Retry Strategies

Nodes can be configured to retry on failure:

- **Fixed Delay**: Retry after fixed time
- **Exponential Backoff**: Retry with increasing delays
- **Max Retries**: Limit number of retry attempts

```typescript
const node = new MyNode({
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: { baseDelay: 1000, maxDelay: 10000 },
})
```

## Protocols

**Protocols** ensure consistent behavior:

- **Execution Protocol**: How nodes are executed
- **Data Flow Protocol**: How data flows between nodes
- **Error Handling Protocol**: How errors are handled

All nodes must comply with these protocols.

## Plugins

**Plugins** extend Workflow Engine with:

- Custom node types
- Additional functionality
- Integration with external services

```typescript
const plugin: Plugin = {
  manifest: { ... },
  nodeTypes: [MyCustomNode],
}
```

## Configuration

Nodes can have **configuration**:

- Defined using JSON Schema
- Validated before use
- Type-safe with TypeScript

```typescript
const schema: JsonSchema = {
  type: "object",
  properties: {
    myConfig: { type: "string" },
  },
  required: ["myConfig"],
}

node.setup({ myConfig: "value" })
```

## Next Steps

Now that you understand the core concepts:

1. **Build workflows**: See [Building Workflows](../guides/building-workflows.md)
2. **Work with nodes**: Read [Working with Nodes](../guides/working-with-nodes.md)
3. **Understand data flow**: Check [Data Flow](../guides/data-flow.md)
4. **Create custom nodes**: Follow [Node Development Tutorial](../NODE_DEVELOPMENT_TUTORIAL.md)

## Related Documentation

- [Architecture](../../ARCHITECTURE.md) - System architecture
- [API Reference](../api/README.md) - Complete API documentation
- [Best Practices](../BEST_PRACTICES.md) - Development best practices

