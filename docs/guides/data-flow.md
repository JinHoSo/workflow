# Data Flow

Understanding how data flows between nodes in Workflow Engine.

## Data Flow Basics

Data flows from output ports of source nodes to input ports of target nodes through connections.

## Creating Connections

```typescript
workflow.linkNodes("source-node", "output", "target-node", "input")
```

This connects:
- Source node's "output" port
- To target node's "input" port

## Data Structure

Data is passed as arrays of records:

```typescript
interface DataRecord {
  [key: string]: unknown
}

type NodeInput = {
  [portName: string]: DataRecord[]
}
```

## Single Output to Single Input

Most common pattern:

```typescript
// Source node outputs: { value: 10 }
// Target node receives: [{ value: 10 }]
workflow.linkNodes("source", "output", "target", "input")
```

## Multiple Outputs to Single Input

When multiple nodes connect to the same input:

```typescript
workflow.linkNodes("node1", "output", "target", "input")
workflow.linkNodes("node2", "output", "target", "input")

// Target node receives combined data from both sources
```

## Single Output to Multiple Inputs

One node can feed multiple nodes:

```typescript
workflow.linkNodes("source", "output", "target1", "input")
workflow.linkNodes("source", "output", "target2", "input")
```

## Accessing Data in Nodes

### In JavaScript Nodes

```typescript
// Get input data
const inputData = input()

// Get specific port data
const portData = input("port-name")

// Get all input data
const allInputs = inputAll()

// Access execution state
const previousOutput = state("previous-node", "output")
```

### In Custom Nodes

```typescript
protected async process(context: ExecutionContext): Promise<NodeOutput> {
  // Access input data
  const inputData = context.input["input"] || []

  // Access execution state
  const previousOutput = context.state["previous-node"]?.output || []

  // Process data
  const result = inputData.map(item => {
    // Process each item
    return { processed: item }
  })

  return { output: result }
}
```

## Data Transformation

Nodes can transform data as it flows:

```typescript
// Input: [{ value: 5 }]
// Process: Multiply by 2
// Output: [{ value: 10 }]
```

## Execution State

In addition to port-based data flow, nodes can access execution state:

```typescript
// Access any previous node's output
const data = state("any-previous-node", "output-port")
```

## Related Documentation

- [Building Workflows](./building-workflows.md)
- [Working with Nodes](./working-with-nodes.md)
- [State Management](./state-management.md)

