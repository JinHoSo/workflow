# Debugging Guide

Guide for debugging workflows and nodes in Workflow Engine.

## Debugging Overview

Debugging workflows involves:

- Inspecting node states
- Checking execution state
- Reviewing error messages
- Tracing data flow

## Node State Inspection

### Check Node State

```typescript
console.log("Node state:", node.state)
// Idle, Running, Completed, Failed
```

### Check Node Error

```typescript
if (node.state === NodeState.Failed) {
  console.error("Node error:", node.error)
}
```

### Check Node Output

```typescript
const output = node.getResult("output")
console.log("Node output:", output)
```

## Execution State Inspection

### Get Execution State

```typescript
const engine = new ExecutionEngine(workflow)
const stateManager = engine.getStateManager()
const state = stateManager.getState()

console.log("Execution state:", state)
```

### Get Node State from Execution

```typescript
const nodeState = stateManager.getNodeState("node-name")
console.log("Node state:", nodeState)
```

### Get Node Metadata

```typescript
const metadata = stateManager.getNodeMetadata("node-name")
console.log("Duration:", metadata?.duration)
console.log("Status:", metadata?.status)
```

## Data Flow Debugging

### Inspect Input Data

```typescript
// In JavaScript node
console.log("Input data:", input())

// In custom node
console.log("Input data:", context.input)
```

### Inspect Output Data

```typescript
const output = node.getResult("output")
console.log("Output data:", output)
```

### Trace Data Flow

```typescript
// Check connections
console.log("Connections:", workflow.linksBySource)
console.log("Reverse connections:", workflow.linksByTarget)
```

## Error Debugging

### Capture Errors

```typescript
try {
  await node.run(context)
} catch (error) {
  console.error("Execution error:", error)
}
```

### Check Error Propagation

```typescript
if (node.state === NodeState.Failed) {
  console.error("Error:", node.error)
  console.error("Error stack:", node.error?.stack)
}
```

## Workflow Debugging

### Check Workflow State

```typescript
console.log("Workflow state:", workflow.state)
```

### Validate Workflow

```typescript
const validation = workflow.validateNodeTypeAvailability(registry)
if (!validation.valid) {
  console.error("Missing types:", validation.missingTypes)
}
```

## Debugging Tips

1. **Add logging**: Use console.log to trace execution
2. **Check state transitions**: Verify state changes
3. **Inspect data**: Verify data format and content
4. **Test incrementally**: Test nodes individually
5. **Use breakpoints**: Set breakpoints in node code
6. **Review connections**: Verify node connections

## Common Debugging Scenarios

### Node Not Executing

- Check node is connected
- Verify execution engine is set
- Check trigger is activated
- Verify node is not disabled

### Data Not Flowing

- Check port names match
- Verify source node produces output
- Check data format
- Verify connections

### Execution Errors

- Check error messages
- Verify configuration
- Check input data format
- Review error handling

## Related Documentation

- [Troubleshooting](../TROUBLESHOOTING.md)
- [Common Issues](./common-issues.md)
- [Error Handling](./error-handling.md)

