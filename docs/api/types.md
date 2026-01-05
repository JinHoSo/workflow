# Type Definitions

Complete TypeScript type definitions for Workflow Engine.

## Table of Contents

- [NodeProperties](#nodeproperties)
- [NodeState](#nodestate)
- [WorkflowState](#workflowstate)
- [ExecutionContext](#executioncontext)
- [NodeInput](#nodeinput)
- [NodeOutput](#nodeoutput)
- [DataRecord](#datarecord)
- [ExecutionState](#executionstate)
- [NodeExecutionMetadata](#nodeexecutionmetadata)
- [NodeConfiguration](#nodeconfiguration)
- [SerializedNode](#serializednode)
- [WorkflowLinks](#workflowlinks)
- [LinkType](#linktype)
- [InputPort](#inputport)
- [OutputPort](#outputport)
- [ErrorInfo](#errorinfo)
- [StatePersistenceHook](#statepersistencehook)

## NodeProperties

Properties for creating a node.

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

## NodeState

Node execution state enum.

```typescript
enum NodeState {
  Idle = "idle",
  Running = "running",
  Completed = "completed",
  Failed = "failed",
}
```

## WorkflowState

Workflow execution state enum.

```typescript
enum WorkflowState {
  Idle = "idle",
  Running = "running",
  Completed = "completed",
  Failed = "failed",
}
```

## ExecutionContext

Context provided to nodes during execution.

```typescript
interface ExecutionContext {
  input: NodeInput // Input data from connected nodes
  state: ExecutionState // Execution state with all previous node outputs
}
```

## NodeInput

Input data structure.

```typescript
type NodeInput = {
  [portName: string]: DataRecord[]
}
```

## NodeOutput

Output data structure.

```typescript
type NodeOutput = {
  [portName: string]: DataRecord[]
}
```

## DataRecord

Individual data record.

```typescript
interface DataRecord {
  [key: string]: unknown
}
```

## ExecutionState

Execution state structure.

```typescript
interface ExecutionState {
  [nodeName: string]: {
    [portName: string]: DataRecord[]
  }
}
```

## NodeExecutionMetadata

Metadata about node execution.

```typescript
interface NodeExecutionMetadata {
  startTime: number
  endTime?: number
  duration?: number
  status: NodeState
}
```

## NodeConfiguration

Node configuration (generic).

```typescript
interface NodeConfiguration {
  [key: string]: unknown
}
```

## SerializedNode

Serialized node representation.

```typescript
interface SerializedNode {
  id: string
  name: string
  nodeType: string
  version: number
  position: [number, number]
  config?: NodeConfiguration
  // ... other properties
}
```

## WorkflowLinks

Workflow connection structure.

```typescript
interface WorkflowLinks {
  [sourceNode: string]: {
    [sourcePort: string]: {
      [targetNode: string]: string[] // target ports
    }
  }
}
```

## LinkType

Type of connection between nodes.

```typescript
type LinkType = "data" | "control"
```

## InputPort

Input port definition.

```typescript
interface InputPort {
  name: string
  dataType: string
  linkType?: LinkType
}
```

## OutputPort

Output port definition.

```typescript
interface OutputPort {
  name: string
  dataType: string
  linkType?: LinkType
}
```

## ErrorInfo

Error information structure.

```typescript
interface ErrorInfo {
  node: string
  error: Error
  timestamp: number
}
```

## StatePersistenceHook

Hook for state persistence.

```typescript
interface StatePersistenceHook {
  save(state: ExecutionState, metadata: Record<string, NodeExecutionMetadata>): Promise<void>
  load(): Promise<{ state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> } | null>
}
```

## Related Documentation

- [Core API](./core.md) - Core workflow APIs
- [Execution API](./execution.md) - Execution engine APIs
- [Node Types API](./nodes.md) - Built-in node types

