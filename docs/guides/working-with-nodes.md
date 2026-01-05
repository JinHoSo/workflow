# Working with Nodes

Understanding how to work with nodes in Workflow Engine.

## Node Basics

Nodes are the fundamental building blocks of workflows. Each node:

- Receives input data
- Performs processing
- Produces output data
- Has a state (Idle, Running, Completed, Failed)

## Node Types

### Trigger Nodes

Trigger nodes start workflow execution:

- **ManualTrigger**: Triggered programmatically
- **ScheduleTrigger**: Triggered on a schedule
- **WebhookTrigger**: Triggered by HTTP requests

### Execution Nodes

Execution nodes process data:

- **JavaScriptExecutionNode**: Execute JavaScript code
- **HttpRequestNode**: Make HTTP requests
- **Custom Nodes**: User-defined nodes

## Configuring Nodes

### Basic Configuration

```typescript
// nodeType is automatically set from class definition
// isTrigger defaults to false, so it can be omitted
const node = new JavaScriptExecutionNode({
  id: "node-1",
  name: "my-node",
  version: 1,
  position: [0, 0],
})

node.setup({
  code: "return { value: 1 }",
})
```

### Advanced Configuration

```typescript
const node = new MyNode({
  id: "node-1",
  name: "my-node",
  nodeType: "my-node-type",
  version: 1,
  position: [0, 0],
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: { baseDelay: 1000, maxDelay: 10000 },
  continueOnFail: false,
})
```

## Node Ports

### Input Ports

Nodes receive data through input ports:

```typescript
node.addInput("input", "any")
```

### Output Ports

Nodes send data through output ports:

```typescript
node.addOutput("output", "any")
```

### Multiple Ports

Nodes can have multiple input and output ports:

```typescript
node.addInput("input1", "any")
node.addInput("input2", "any")
node.addOutput("output", "any")
node.addOutput("error", "any")
```

## Node State

### State Transitions

```
Idle → Running → Completed
Idle → Running → Failed
```

### Checking State

```typescript
if (node.state === NodeState.Completed) {
  const result = node.getResult("output")
}
```

## Node Execution

### Manual Execution

```typescript
const context: ExecutionContext = {
  input: { input: [{ value: "test" }] },
  state: {},
}

const output = await node.run(context)
```

### Execution in Workflow

Nodes execute automatically when the workflow runs, based on the dependency graph.

## Error Handling

### Node Errors

Nodes can fail during execution. Errors are captured and stored:

```typescript
if (node.state === NodeState.Failed) {
  console.error(node.error)
}
```

### Retry Configuration

Configure nodes to retry on failure:

```typescript
const node = new MyNode({
  // ... other properties
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: { baseDelay: 1000, maxDelay: 10000 },
})
```

## Related Documentation

- [Building Workflows](./building-workflows.md)
- [Data Flow](./data-flow.md)
- [Error Handling](./error-handling.md)
- [Node Development Tutorial](../NODE_DEVELOPMENT_TUTORIAL.md)

