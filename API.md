# API Documentation

This document provides detailed API documentation for the workflow engine.

## Core Classes

### Workflow

Main workflow class that manages nodes and their connections.

#### Constructor

```typescript
new Workflow(id: string)
```

Creates a new workflow with the given ID.

#### Methods

##### `addNode(node: Node): void`

Adds a node to the workflow. Nodes are identified by their `name` property.

##### `removeNode(nodeName: string): void`

Removes a node from the workflow and all its connections.

##### `linkNodes(sourceNode: string, sourcePort: string, targetNode: string, targetPort: string): void`

Creates a connection between two nodes. Validates port types match.

##### `reset(): void`

Resets all nodes in the workflow to Idle state and clears their outputs.

##### `export(): string`

Exports the workflow as JSON string.

##### `static import(json: string, nodeFactory?: NodeFactory, nodeTypeRegistry?: NodeTypeRegistry): Workflow`

Imports a workflow from JSON string.

#### Properties

- `id: string` - Workflow identifier
- `nodes: { [nodeName: string]: Node }` - All nodes in the workflow
- `linksBySource: WorkflowLinks` - Links indexed by source node
- `linksByTarget: WorkflowLinks` - Links indexed by target node
- `state: WorkflowState` - Current workflow state

### BaseNode

Abstract base class for all nodes.

#### Constructor

```typescript
constructor(properties: NodeProperties)
```

Creates a new node with the given properties.

#### Methods

##### `setup(config: NodeConfiguration): void`

Configures the node with the given configuration. Validates against schema if defined.

##### `async run(context: ExecutionContext): Promise<NodeOutput>`

Executes the node. This method calls `process()` internally.

##### `reset(): void`

Resets the node to Idle state and clears outputs.

##### `addInput(name: string, dataType: string, linkType?: LinkType): void`

Adds an input port to the node.

##### `addOutput(name: string, dataType: string, linkType?: LinkType): void`

Adds an output port to the node.

##### `getResult(outputPortName: string): DataRecord | DataRecord[]`

Gets result data for a specific output port.

##### `getAllResults(): NodeOutput`

Gets all result data from all output ports.

#### Properties

- `properties: NodeProperties` - Node properties
- `state: NodeState` - Current node state
- `config: NodeConfiguration` - Node configuration
- `inputs: InputPort[]` - Input ports
- `outputs: OutputPort[]` - Output ports
- `error?: Error` - Error if node failed

### ExecutionEngine

Executes workflows using DAG-based approach.

#### Constructor

```typescript
new ExecutionEngine(workflow: Workflow, persistenceHook?: StatePersistenceHook)
```

Creates a new execution engine for the given workflow.

#### Methods

##### `async execute(triggerNodeName: string): Promise<void>`

Executes the workflow starting from the given trigger node.

##### `getWorkflowState(): WorkflowState`

Gets the current workflow state.

##### `getStateManager(): ExecutionStateManager`

Gets the execution state manager.

##### `getNodeState(nodeName: string): NodeOutput | undefined`

Gets execution state for a specific node.

##### `getNodeMetadata(nodeName: string): NodeExecutionMetadata | undefined`

Gets execution metadata for a specific node.

## Trigger Nodes

### ManualTrigger

Manually trigger workflow execution.

#### Methods

##### `trigger(data?: NodeOutput): void`

Triggers the workflow execution with optional initial data.

##### `setExecutionEngine(engine: ExecutionEngine): void`

Sets the execution engine for workflow execution.

### ScheduleTrigger

Schedule workflow execution at specific times.

#### Methods

##### `activate(): void`

Activates the schedule trigger.

##### `deactivate(): void`

Deactivates the schedule trigger.

##### `getNextExecutionTime(): Date | undefined`

Gets the next scheduled execution time.

##### `setExecutionEngine(engine: ExecutionEngine): void`

Sets the execution engine for workflow execution.

## Node Types

### JavaScriptNode

Executes JavaScript code.

#### Configuration

```typescript
{
  code: string // JavaScript code to execute
}
```

#### API in Code

- `input(portName?: string)`: Get input data
- `inputAll()`: Get all input data
- `output(data, portName?)`: Set output data
- `state(nodeName, portName)`: Access execution state

### HttpRequestNode

Makes HTTP requests.

#### Configuration

```typescript
{
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS",
  url: string, // Must be valid URI
  headers?: { [key: string]: string },
  queryParameters?: { [key: string]: string },
  body?: any,
  bodyFormat?: "json" | "form-data" | "text" | "raw",
  authType?: "none" | "basic" | "bearer" | "custom",
  basicAuthUsername?: string,
  basicAuthPassword?: string,
  bearerToken?: string,
  customAuthHeaders?: { [key: string]: string },
  timeout?: number
}
```

## Protocols

### ExecutionProtocol

Defines how nodes are executed.

```typescript
interface ExecutionProtocol {
  executeNode(context: ExecutionProtocolContext): Promise<NodeOutput> | NodeOutput
  validateExecution(node: Node): boolean
}
```

### DataFlowProtocol

Handles data passing between nodes.

```typescript
interface DataFlowProtocol {
  passData(sourceOutput: NodeOutput, destinationInputPort: string): NodeInput
  combineData(sources: NodeOutput[]): NodeOutput
}
```

### ErrorHandlingProtocol

Manages error handling.

```typescript
interface ErrorHandlingProtocol {
  handleError(node: Node, error: Error): void
  propagateError(node: Node, error: Error): ErrorInfo
  shouldStopExecution(node: Node, error: Error): boolean
}
```

## State Management

### ExecutionStateManager

Manages execution state.

#### Methods

##### `getState(): ExecutionState`

Gets the current execution state.

##### `getNodeState(nodeName: string): NodeOutput | undefined`

Gets execution state for a specific node.

##### `setNodeState(nodeName: string, output: NodeOutput): void`

Sets execution state for a node.

##### `getNodeMetadata(nodeName: string): NodeExecutionMetadata | undefined`

Gets execution metadata for a node.

##### `recordNodeStart(nodeName: string): void`

Records node execution start.

##### `recordNodeEnd(nodeName: string, status: NodeState): void`

Records node execution completion.

##### `export(): { state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> }`

Exports execution state for persistence.

##### `import(data: { state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> }): void`

Imports execution state from persistence.

## Plugin System

### PluginRegistry

Manages plugin registration.

#### Methods

##### `async register(plugin: Plugin): Promise<void>`

Registers a plugin.

##### `async unregister(pluginName: string, version?: string): Promise<void>`

Unregisters a plugin.

##### `get(pluginName: string, version?: string): Plugin | undefined`

Gets a registered plugin.

##### `getAll(): Plugin[]`

Gets all registered plugins.

## Node Factory

### NodeFactory

Creates node instances from serialized data.

#### Methods

##### `register(nodeType: string, version: number, factory: NodeFactoryFunction): void`

Registers a factory function for a node type.

##### `create(serializedNode: SerializedNode): Node`

Creates a node instance from serialized node data.

## Types

### NodeProperties

```typescript
interface NodeProperties {
  id: string
  name: string
  nodeType: string
  version: number
  position: [number, number]
  isTrigger?: boolean
  disabled?: boolean
  retryOnFail?: boolean
  maxRetries?: number
  retryDelay?: number | { baseDelay?: number; maxDelay?: number }
  continueOnFail?: boolean
  notes?: string
}
```

### NodeState

```typescript
enum NodeState {
  Idle = "idle",
  Running = "running",
  Completed = "completed",
  Failed = "failed",
}
```

### WorkflowState

```typescript
enum WorkflowState {
  Idle = "idle",
  Running = "running",
  Completed = "completed",
  Failed = "failed",
}
```

### ExecutionContext

```typescript
interface ExecutionContext {
  input: NodeInput // Input data from connected nodes
  state: ExecutionState // Execution state with all previous node outputs
}
```

