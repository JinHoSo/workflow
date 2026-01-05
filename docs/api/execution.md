# Execution API Reference

API documentation for the Execution Engine and execution-related functionality.

## Table of Contents

- [ExecutionEngine](#executionengine)
  - [Constructor](#constructor)
  - [Methods](#methods)
- [ExecutionStateManager](#executionstatemanager)
  - [Methods](#methods-1)
- [DAG Utilities](#dag-utilities)
- [Retry Strategy](#retry-strategy)
  - [Built-in Strategies](#built-in-strategies)

## ExecutionEngine

Executes workflows using DAG-based approach with parallel execution support.

### Constructor

```typescript
new ExecutionEngine(workflow: Workflow, persistenceHook?: StatePersistenceHook)
```

Creates a new execution engine for the given workflow.

**Parameters:**
- `workflow: Workflow` - The workflow to execute
- `persistenceHook?: StatePersistenceHook` - Optional hook for state persistence

**Example:**
```typescript
const engine = new ExecutionEngine(workflow)
```

### Methods

#### `async execute(triggerNodeName: string): Promise<void>`

Executes the workflow starting from the given trigger node.

**Parameters:**
- `triggerNodeName: string` - Name of the trigger node to start execution

**Example:**
```typescript
await engine.execute("trigger")
```

#### `getWorkflowState(): WorkflowState`

Gets the current workflow state.

**Returns:** `WorkflowState` - Current workflow state (Idle, Running, Completed, Failed)

**Example:**
```typescript
const state = engine.getWorkflowState()
if (state === WorkflowState.Completed) {
  console.log("Workflow completed successfully")
}
```

#### `getStateManager(): ExecutionStateManager`

Gets the execution state manager.

**Returns:** `ExecutionStateManager` - State manager instance

**Example:**
```typescript
const stateManager = engine.getStateManager()
const nodeState = stateManager.getNodeState("node-name")
```

#### `getNodeState(nodeName: string): NodeOutput | undefined`

Gets execution state for a specific node.

**Parameters:**
- `nodeName: string` - Name of the node

**Returns:** `NodeOutput | undefined` - Node output or undefined

**Example:**
```typescript
const nodeState = engine.getNodeState("my-node")
```

#### `getNodeMetadata(nodeName: string): NodeExecutionMetadata | undefined`

Gets execution metadata for a specific node.

**Parameters:**
- `nodeName: string` - Name of the node

**Returns:** `NodeExecutionMetadata | undefined` - Node metadata or undefined

**Example:**
```typescript
const metadata = engine.getNodeMetadata("my-node")
console.log("Duration:", metadata?.duration) // Execution duration in ms
```

## ExecutionStateManager

Manages execution state for workflow execution.

### Methods

#### `getState(): ExecutionState`

Gets the current execution state.

**Returns:** `ExecutionState` - Current execution state

**Example:**
```typescript
const state = stateManager.getState()
```

#### `getNodeState(nodeName: string): NodeOutput | undefined`

Gets execution state for a specific node.

**Parameters:**
- `nodeName: string` - Name of the node

**Returns:** `NodeOutput | undefined` - Node output or undefined

**Example:**
```typescript
const nodeState = stateManager.getNodeState("node-name")
```

#### `setNodeState(nodeName: string, output: NodeOutput): void`

Sets execution state for a node.

**Parameters:**
- `nodeName: string` - Name of the node
- `output: NodeOutput` - Node output

**Example:**
```typescript
stateManager.setNodeState("node-name", { output: [{ value: 10 }] })
```

#### `getNodeMetadata(nodeName: string): NodeExecutionMetadata | undefined`

Gets execution metadata for a node.

**Parameters:**
- `nodeName: string` - Name of the node

**Returns:** `NodeExecutionMetadata | undefined` - Node metadata or undefined

**Example:**
```typescript
const metadata = stateManager.getNodeMetadata("node-name")
```

#### `recordNodeStart(nodeName: string): void`

Records node execution start.

**Parameters:**
- `nodeName: string` - Name of the node

**Example:**
```typescript
stateManager.recordNodeStart("node-name")
```

#### `recordNodeEnd(nodeName: string, status: NodeState): void`

Records node execution completion.

**Parameters:**
- `nodeName: string` - Name of the node
- `status: NodeState` - Final node state

**Example:**
```typescript
stateManager.recordNodeEnd("node-name", NodeState.Completed)
```

#### `export(): { state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> }`

Exports execution state for persistence.

**Returns:** Object containing state and metadata

**Example:**
```typescript
const exported = stateManager.export()
```

#### `import(data: { state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> }): void`

Imports execution state from persistence.

**Parameters:**
- `data: { state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> }` - State data to import

**Example:**
```typescript
stateManager.import(exportedData)
```

## DAG Utilities

Utilities for working with dependency graphs.

### `buildDependencyGraph(workflow: Workflow): DependencyGraph`

Builds a dependency graph from workflow links.

**Parameters:**
- `workflow: Workflow` - The workflow

**Returns:** `DependencyGraph` - Dependency graph

### `topologicalSort(graph: DependencyGraph): string[][]`

Performs topological sort to determine execution order.

**Parameters:**
- `graph: DependencyGraph` - Dependency graph

**Returns:** `string[][]` - Array of execution levels (nodes at same level can run in parallel)

## Retry Strategy

### `RetryStrategy`

Interface for retry strategies.

```typescript
interface RetryStrategy {
  shouldRetry(attempt: number, error: Error): boolean
  getDelay(attempt: number): number
}
```

### Built-in Strategies

#### Fixed Delay

```typescript
const strategy = new FixedDelayRetryStrategy({
  maxRetries: 3,
  delay: 1000,
})
```

#### Exponential Backoff

```typescript
const strategy = new ExponentialBackoffRetryStrategy({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
})
```

## Related Documentation

- [Core API](./core.md) - Core workflow APIs
- [Node Types API](./nodes.md) - Built-in node types
- [State Management Guide](../guides/state-management.md) - State management guide

