# Error Handling

Learn how to handle errors effectively in Workflow Engine workflows.

## Error Handling Overview

Workflow Engine provides multiple mechanisms for handling errors:

- **Node-level error handling**: Individual nodes can handle errors
- **Workflow-level error handling**: Workflow execution can handle errors
- **Retry mechanisms**: Automatic retry on failure
- **Error propagation**: Errors can be propagated to downstream nodes

## Node-Level Errors

### Error States

When a node fails during execution, it transitions to the `Failed` state:

```typescript
if (node.state === NodeState.Failed) {
  console.error("Node failed:", node.error)
}
```

### Handling Errors in Nodes

Nodes can handle errors internally:

```typescript
protected async process(context: ExecutionContext): Promise<NodeOutput> {
  try {
    // Node logic
    return { output: [] }
  } catch (error) {
    // Handle error
    // Error is automatically captured by BaseNode
    throw error
  }
}
```

## Workflow-Level Errors

### Execution Errors

When a workflow execution fails:

```typescript
const engine = new ExecutionEngine(workflow)
await engine.execute("trigger")

if (engine.getWorkflowState() === WorkflowState.Failed) {
  // Handle workflow failure
}
```

### Continue on Failure

Nodes can be configured to continue execution even if they fail:

```typescript
const node = new MyNode({
  // ... other properties
  continueOnFail: true,
})
```

## Retry Mechanisms

### Basic Retry Configuration

```typescript
const node = new MyNode({
  // ... other properties
  retryOnFail: true,
  maxRetries: 3,
})
```

### Fixed Delay Retry

```typescript
const node = new MyNode({
  // ... other properties
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: 1000, // 1 second delay
})
```

### Exponential Backoff

```typescript
const node = new MyNode({
  // ... other properties
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: {
    baseDelay: 1000,    // Start with 1 second
    maxDelay: 10000,    // Maximum 10 seconds
  },
})
```

## Error Propagation

### Error Output Ports

Nodes can have error output ports:

```typescript
node.addOutput("output", "any")
node.addOutput("error", "any")
```

### Handling Errors in Downstream Nodes

```typescript
// Check for errors from previous nodes
const errorData = context.input["error"] || []
if (errorData.length > 0) {
  // Handle error
}
```

## Best Practices

1. **Always handle errors**: Don't let errors go unhandled
2. **Use retry for transient errors**: Retry for network issues, timeouts, etc.
3. **Don't retry for permanent errors**: Don't retry for validation errors, etc.
4. **Log errors**: Always log errors for debugging
5. **Provide error context**: Include context in error messages

## Related Documentation

- [Working with Nodes](./working-with-nodes.md)
- [Retry Strategies](./retry-strategies.md)
- [State Management](./state-management.md)

