# State Management

Understanding execution state management in Workflow Engine.

## Execution State Overview

Execution state provides access to:

- Previous node outputs
- Current node states
- Execution metadata (timing, errors, etc.)

## Accessing Execution State

### In JavaScript Nodes

```typescript
// Access previous node output
const previousOutput = state("previous-node", "output")

// Access any node's output
const anyOutput = state("any-node", "output-port")
```

### In Custom Nodes

```typescript
protected async process(context: ExecutionContext): Promise<NodeOutput> {
  // Access execution state
  const previousOutput = context.state["previous-node"]?.output || []

  // Use state data
  return { output: previousOutput }
}
```

## State Manager

### Getting State Manager

```typescript
const engine = new ExecutionEngine(workflow)
const stateManager = engine.getStateManager()
```

### Getting Node State

```typescript
const nodeState = stateManager.getNodeState("node-name")
```

### Getting Node Metadata

```typescript
const metadata = stateManager.getNodeMetadata("node-name")
console.log(metadata?.duration) // Execution duration in ms
```

## State Structure

### Execution State

```typescript
interface ExecutionState {
  [nodeName: string]: {
    [portName: string]: DataRecord[]
  }
}
```

### Node Metadata

```typescript
interface NodeExecutionMetadata {
  startTime: number
  endTime?: number
  duration?: number
  status: NodeState
}
```

## State Isolation

Execution state is isolated between executions:

- Each execution has its own state
- State is cleared between executions
- Previous execution state is not accessible

## State Persistence

### Exporting State

```typescript
const exported = stateManager.export()
```

### Importing State

```typescript
stateManager.import(exported)
```

## Best Practices

1. **Use state for cross-node data**: Access previous node outputs via state
2. **Don't modify state directly**: State is read-only
3. **Check state availability**: Always check if state exists before accessing
4. **Use state for debugging**: Inspect state to understand execution flow

## Related Documentation

- [Data Flow](./data-flow.md)
- [Working with Nodes](./working-with-nodes.md)
- [Building Workflows](./building-workflows.md)

