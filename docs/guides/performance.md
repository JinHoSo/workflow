# Performance Optimization

Guide for optimizing workflow performance in Workflow Engine.

## Performance Overview

Workflow performance depends on:

- Node execution time
- Parallel execution opportunities
- Data processing efficiency
- State management overhead

## Parallel Execution

### Enable Parallel Execution

Workflow Engine automatically executes independent nodes in parallel:

```
Level 1: [Node A, Node B, Node C] → Parallel
Level 2: [Node D] → Sequential
Level 3: [Node E, Node F] → Parallel
```

### Design for Parallelism

Structure workflows to maximize parallel execution:

```typescript
// Good: Independent nodes can run in parallel
Trigger → Node A ─┐
       → Node B ─┼→ Node D
       → Node C ─┘

// Less optimal: Sequential dependencies
Trigger → Node A → Node B → Node C
```

## Node Optimization

### Efficient Processing

```typescript
protected async process(context: ExecutionContext): Promise<NodeOutput> {
  // Process data efficiently
  const input = context.input["input"] || []

  // Use efficient algorithms
  const results = input.map(item => processItem(item))

  return { output: results }
}
```

### Avoid Unnecessary Operations

- Don't process data that won't be used
- Cache expensive computations
- Use efficient data structures

## Data Processing

### Batch Processing

Process data in batches when possible:

```typescript
const BATCH_SIZE = 100
for (let i = 0; i < data.length; i += BATCH_SIZE) {
  const batch = data.slice(i, i + BATCH_SIZE)
  await processBatch(batch)
}
```

### Stream Processing

For large datasets, consider streaming:

```typescript
// Process data as it arrives
async function* processStream(data: AsyncIterable<DataRecord>) {
  for await (const item of data) {
    yield processItem(item)
  }
}
```

## State Management

### Minimize State Access

Access state only when needed:

```typescript
// Good: Access state once
const previousData = context.state["previous-node"]?.output

// Less optimal: Multiple accesses
const data1 = context.state["node1"]?.output
const data2 = context.state["node2"]?.output
```

### Efficient State Queries

Use efficient state queries:

```typescript
// Direct access is efficient
const state = stateManager.getNodeState("node-name")
```

## Configuration Optimization

### Optimize Node Configuration

- Use appropriate retry settings
- Set reasonable timeouts
- Configure efficient retry strategies

```typescript
const node = new MyNode({
  // ... other properties
  retryOnFail: true,
  maxRetries: 2, // Don't retry too many times
  retryDelay: 1000, // Reasonable delay
})
```

## Best Practices

1. **Design for parallelism**: Structure workflows to maximize parallel execution
2. **Optimize node processing**: Use efficient algorithms and data structures
3. **Minimize state access**: Access state only when needed
4. **Batch processing**: Process data in batches for large datasets
5. **Profile workflows**: Measure performance to identify bottlenecks
6. **Cache expensive operations**: Cache results of expensive computations

## Performance Monitoring

### Measure Execution Time

```typescript
const metadata = stateManager.getNodeMetadata("node-name")
console.log("Execution time:", metadata?.duration)
```

### Profile Workflows

```typescript
const startTime = Date.now()
await engine.execute("trigger")
const duration = Date.now() - startTime
console.log("Workflow duration:", duration)
```

## Related Documentation

- [Building Workflows](./building-workflows.md)
- [State Management](./state-management.md)
- [Architecture Deep Dive](./architecture-deep-dive.md)

