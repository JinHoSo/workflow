# API Documentation

This document provides comprehensive API documentation for the workflow engine.

## Core Classes

### Workflow

Main workflow class that manages nodes, links, and execution.

```typescript
class Workflow implements IWorkflow {
  id: string
  name?: string
  nodes: { [nodeName: string]: Node }
  linksBySource: WorkflowLinks
  linksByTarget: WorkflowLinks
  nodeTypeRegistry: NodeTypeRegistry
  staticData: DataRecord
  settings: WorkflowSettings
  mockData?: MockData
  state: WorkflowState
}
```

#### Methods

- `addNode(node: Node): void` - Adds a node to the workflow
- `removeNode(nodeName: string): void` - Removes a node and cleans up links
- `linkNodes(sourceNode: string, sourceOutput: string, targetNode: string, targetInput: string): void` - Creates a link between nodes
- `validateNodeTypeAvailability(registry: NodeTypeRegistry): ValidationResult` - Validates all node types are available
- `getNodesWithUnavailableTypes(registry: NodeTypeRegistry): string[]` - Gets nodes with unavailable types
- `removeNodesWithUnavailableTypes(registry: NodeTypeRegistry): string[]` - Removes nodes with unavailable types
- `export(): WorkflowExportData` - Exports workflow to serializable format
- `static import(data: WorkflowExportData, registry?: NodeTypeRegistry, factory?: NodeFactory): Workflow` - Imports workflow from data

### ExecutionEngine

Orchestrates workflow execution with DAG-based ordering and parallel execution.

```typescript
class ExecutionEngine {
  constructor(workflow: IWorkflow, persistenceHook?: StatePersistenceHook)

  async execute(triggerNodeName: string, initialData?: NodeOutput): Promise<void>
  getWorkflowState(): WorkflowState
  getStateManager(): ExecutionStateManager
}
```

### BaseNode

Base class for all workflow nodes.

```typescript
abstract class BaseNode implements Node {
  properties: NodeProperties
  state: NodeState
  config: NodeConfiguration
  inputs: InputPort[]
  outputs: OutputPort[]
  annotation?: string
  error?: Error

  addInput(name: string, dataType: string, linkType?: LinkType): void
  addOutput(name: string, dataType: string, linkType?: LinkType): void
  setup(config: NodeConfiguration): void
  async run(context: ExecutionContext): Promise<NodeOutput>
  getResult(portName: string): DataRecord | DataRecord[] | undefined
  getAllResults(): NodeOutput
}
```

### NodeTypeRegistry

Manages node type registration and retrieval.

```typescript
interface NodeTypeRegistry {
  get(name: string, version?: number): NodeType | undefined
  getAll(): NodeType[]
  register(nodeType: NodeType): void
  registerFromPlugin?(plugin: Plugin): void
  unregisterFromPlugin?(pluginKey: string): void
}
```

### PluginRegistry

Manages plugin loading and registration.

```typescript
class PluginRegistry {
  setNodeTypeRegistry(registry: NodeTypeRegistry): void
  async register(plugin: Plugin): Promise<void>
  async unregister(pluginName: string, version?: string): Promise<void>
  get(pluginName: string, version?: string): Plugin | undefined
  getAll(): Plugin[]
}
```

### NodeFactory

Creates node instances from serialized data.

```typescript
class NodeFactory {
  setNodeTypeRegistry(registry: NodeTypeRegistry): void
  register(nodeType: string, version: number, factory: NodeFactoryFunction): void
  create(serializedNode: SerializedNode): Node
  createDefault(serializedNode: SerializedNode): BaseNode
}
```

## Protocols

### ExecutionProtocol

Defines how nodes are executed.

```typescript
interface ExecutionProtocol {
  executeNode(node: Node, context: ExecutionContext): Promise<NodeOutput>
  validateNodeState(node: Node): boolean
}
```

### DataFlowProtocol

Defines how data flows between nodes.

```typescript
interface DataFlowProtocol {
  normalizeInput(input: NodeInput): NodeInput
  normalizeOutput(output: NodeOutput): NodeOutput
  validatePorts(source: OutputPort, target: InputPort): boolean
}
```

### ErrorHandlingProtocol

Defines how errors are handled.

```typescript
interface ErrorHandlingProtocol {
  handleError(node: Node, error: Error): ErrorInfo
  propagateError(node: Node, error: Error): ErrorInfo
  shouldContinue(node: Node): boolean
}
```

## State Management

### ExecutionStateManager

Manages execution state for all nodes.

```typescript
class ExecutionStateManager {
  getState(): ExecutionState
  getNodeState(nodeName: string): NodeOutput | undefined
  setNodeState(nodeName: string, output: NodeOutput): void
  getNodeMetadata(nodeName: string): NodeExecutionMetadata | undefined
  recordNodeStart(nodeName: string): void
  recordNodeEnd(nodeName: string, status: NodeState): void
  export(): { state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> }
  import(data: { state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> }): void
  clear(): void
}
```

### StatePersistenceHook

Interface for persisting and recovering execution state.

```typescript
interface StatePersistenceHook {
  persist(workflowId: string, state: ExecutionState, metadata: Record<string, NodeExecutionMetadata>): Promise<void>
  recover(workflowId: string): Promise<{ state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> } | undefined>
}
```

## Retry Strategy

### RetryStrategy

Interface for retry strategies.

```typescript
interface RetryStrategy {
  calculateDelay(attemptNumber: number): number
  shouldRetry(attemptNumber: number, maxRetries: number): boolean
}
```

### FixedDelayRetryStrategy

Fixed delay between retries.

```typescript
class FixedDelayRetryStrategy implements RetryStrategy {
  constructor(delay: number = 1000)
}
```

### ExponentialBackoffRetryStrategy

Exponential backoff for retry delays.

```typescript
class ExponentialBackoffRetryStrategy implements RetryStrategy {
  constructor(baseDelay: number = 1000, maxDelay: number = 30000)
}
```

## Version Management

### VersionCompatibilityTracker

Tracks version compatibility for node types.

```typescript
class VersionCompatibilityTracker {
  recordCompatibility(nodeTypeName: string, fromVersion: number, toVersion: number, compatible: boolean, reason?: string): void
  checkCompatibility(nodeTypeName: string, fromVersion: number, toVersion: number): VersionCompatibility | undefined
  canMigrate(nodeTypeName: string, fromVersion: number, toVersion: number): boolean
}
```

### VersionMigration

Manages node version migration.

```typescript
class VersionMigration {
  migrateNode(node: Node | SerializedNode, targetVersion: number, registry: NodeTypeRegistry): MigrationResult
  migrateNodes(nodes: (Node | SerializedNode)[], targetVersion: number, registry: NodeTypeRegistry): Map<string, MigrationResult>
  migrateToLatest(nodes: (Node | SerializedNode)[], registry: NodeTypeRegistry): Map<string, MigrationResult>
}
```

## Protocol Validation

### ProtocolValidator

Validates protocol compliance.

```typescript
class ProtocolValidator {
  static implementsExecutionProtocol(node: Node): boolean
  static implementsDataFlowProtocol(node: Node): boolean
  static implementsErrorHandlingProtocol(node: Node): boolean
  static validate(node: Node): boolean
  validateAllProtocols(node: Node, executionProtocol: ExecutionProtocol, dataFlowProtocol: DataFlowProtocol, errorHandlingProtocol: ErrorHandlingProtocol): ProtocolComplianceResult
}
```

## See Also

- [Architecture Overview](./ARCHITECTURE.md)
- [Protocols](./PROTOCOLS.md)
- [Versioning](./VERSIONING.md)
- [Plugin Development](./PLUGIN_DEVELOPMENT.md)
- [Retry Configuration](./RETRY_CONFIGURATION.md)

