# Protocol Usage Patterns

This document describes the protocol system used in the workflow engine and how to use protocols correctly.

## Overview

The workflow engine uses three main protocols to ensure consistent behavior across all nodes:

1. **ExecutionProtocol** - Handles node execution
2. **DataFlowProtocol** - Handles data passing between nodes
3. **ErrorHandlingProtocol** - Handles errors consistently

## Execution Protocol

The ExecutionProtocol is responsible for executing nodes in a consistent manner.

### Usage

```typescript
import { executionProtocol } from "./protocols/execution-impl"

// Execute a node
const output = await executionProtocol.executeNode({
  node: myNode,
  inputData: { input: data },
  workflowId: "workflow-1",
  state: executionState,
})

// Validate node is ready for execution
const ready = executionProtocol.validateExecution(myNode)
```

### Implementation

All nodes should extend `BaseNode` which is compatible with the ExecutionProtocol. The protocol:

- Validates node is in Idle state
- Checks node is not disabled
- Executes the node's `run()` method
- Manages state transitions

## Data Flow Protocol

The DataFlowProtocol handles data passing between nodes with proper normalization.

### Usage

```typescript
import { dataFlowProtocol } from "./protocols/data-flow-impl"

// Pass data from source to destination
const inputData = dataFlowProtocol.passData(
  sourceNodeOutput,
  "input" // destination input port name
)

// Combine data from multiple sources
const combined = dataFlowProtocol.combineData([
  source1Output,
  source2Output,
])
```

### Implementation

The protocol:

- Normalizes data to arrays when needed
- Handles port name matching
- Combines data from multiple sources correctly

## Error Handling Protocol

The ErrorHandlingProtocol ensures consistent error handling across all nodes.

### Usage

```typescript
import { errorHandlingProtocol } from "./protocols/error-handling-impl"

try {
  await node.run(context)
} catch (error) {
  // Handle error using protocol
  errorHandlingProtocol.handleError(node, error)

  // Check if execution should stop
  if (errorHandlingProtocol.shouldStopExecution(node, error)) {
    // Stop workflow execution
  }

  // Propagate error information
  const errorInfo = errorHandlingProtocol.propagateError(node, error)
}
```

### Implementation

The protocol:

- Sets node error state
- Logs error information
- Determines if execution should continue based on `continueOnFail` property
- Provides error information for downstream nodes

## Protocol Compliance Validation

Use `ProtocolValidator` to validate that nodes comply with all protocols:

```typescript
import { protocolValidator } from "./protocols/protocol-validator"
import { executionProtocol, dataFlowProtocol, errorHandlingProtocol } from "./protocols"

// Validate all protocols
const result = protocolValidator.validateAllProtocols(
  myNode,
  executionProtocol,
  dataFlowProtocol,
  errorHandlingProtocol
)

if (!result.compliant) {
  console.error("Protocol compliance issues:", result.issues)
}
```

### Validation Checks

The validator checks:

- **Execution Protocol**: Node extends BaseNode, has required methods, is in correct state
- **Data Flow Protocol**: Node has input/output ports with valid data types
- **Error Handling Protocol**: Node has error and state properties

## Best Practices

1. **Always use protocols**: Don't call node methods directly, use protocols instead
2. **Validate compliance**: Use ProtocolValidator when creating custom nodes
3. **Handle errors consistently**: Always use ErrorHandlingProtocol for error handling
4. **Use data flow protocol**: Don't manually format data, use DataFlowProtocol

## Example: Custom Node Implementation

```typescript
import { BaseNode } from "./core/base-node"
import type { ExecutionContext, NodeOutput } from "./interfaces"

class MyCustomNode extends BaseNode {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    // Your node logic here
    const input = context.input.input?.[0]
    return {
      output: { result: input.value * 2 }
    }
  }
}
```

This node automatically complies with all protocols because it extends `BaseNode`.

