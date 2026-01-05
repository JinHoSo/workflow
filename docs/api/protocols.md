# Protocols API Reference

API documentation for Workflow Engine protocols.

## Overview

Protocols ensure consistent behavior across all nodes in Workflow Engine. All nodes must comply with these protocols.

## ExecutionProtocol

Defines how nodes are executed with state validation.

### Interface

```typescript
interface ExecutionProtocol {
  executeNode(context: ExecutionProtocolContext): Promise<NodeOutput> | NodeOutput
  validateExecution(node: Node): boolean
}
```

### Methods

#### `executeNode(context: ExecutionProtocolContext): Promise<NodeOutput> | NodeOutput`

Executes a node with the given context.

**Parameters:**
- `context: ExecutionProtocolContext` - Execution context

**Returns:** `Promise<NodeOutput> | NodeOutput` - Node output

#### `validateExecution(node: Node): boolean`

Validates that a node is ready for execution.

**Parameters:**
- `node: Node` - Node to validate

**Returns:** `boolean` - True if node is ready

### Usage

```typescript
import { executionProtocol } from "@workflow/protocols"

const result = await executionProtocol.executeNode(context)
const isValid = executionProtocol.validateExecution(node)
```

## DataFlowProtocol

Handles data passing between nodes with normalization.

### Interface

```typescript
interface DataFlowProtocol {
  passData(sourceOutput: NodeOutput, destinationInputPort: string): NodeInput
  combineData(sources: NodeOutput[]): NodeOutput
}
```

### Methods

#### `passData(sourceOutput: NodeOutput, destinationInputPort: string): NodeInput`

Passes data from source output to destination input port.

**Parameters:**
- `sourceOutput: NodeOutput` - Source node output
- `destinationInputPort: string` - Destination input port name

**Returns:** `NodeInput` - Normalized input data

#### `combineData(sources: NodeOutput[]): NodeOutput`

Combines data from multiple sources.

**Parameters:**
- `sources: NodeOutput[]` - Array of source outputs

**Returns:** `NodeOutput` - Combined output

### Usage

```typescript
import { dataFlowProtocol } from "@workflow/protocols"

const input = dataFlowProtocol.passData(sourceOutput, "input")
const combined = dataFlowProtocol.combineData([output1, output2])
```

## ErrorHandlingProtocol

Manages error handling with retry support.

### Interface

```typescript
interface ErrorHandlingProtocol {
  handleError(node: Node, error: Error): void
  propagateError(node: Node, error: Error): ErrorInfo
  shouldStopExecution(node: Node, error: Error): boolean
}
```

### Methods

#### `handleError(node: Node, error: Error): void`

Handles an error for a node.

**Parameters:**
- `node: Node` - Node that encountered the error
- `error: Error` - The error

#### `propagateError(node: Node, error: Error): ErrorInfo`

Propagates error information.

**Parameters:**
- `node: Node` - Node that encountered the error
- `error: Error` - The error

**Returns:** `ErrorInfo` - Error information

#### `shouldStopExecution(node: Node, error: Error): boolean`

Determines if execution should stop on error.

**Parameters:**
- `node: Node` - Node that encountered the error
- `error: Error` - The error

**Returns:** `boolean` - True if execution should stop

### Usage

```typescript
import { errorHandlingProtocol } from "@workflow/protocols"

errorHandlingProtocol.handleError(node, error)
const errorInfo = errorHandlingProtocol.propagateError(node, error)
const shouldStop = errorHandlingProtocol.shouldStopExecution(node, error)
```

## Protocol Compliance

### Validation

Validate that nodes comply with all protocols:

```typescript
import { protocolValidator } from "@workflow/protocols"
import { executionProtocol, dataFlowProtocol, errorHandlingProtocol } from "@workflow/protocols"

const result = protocolValidator.validateAllProtocols(
  node,
  executionProtocol,
  dataFlowProtocol,
  errorHandlingProtocol
)

if (!result.compliant) {
  console.error("Compliance issues:", result.issues)
}
```

### Compliance Requirements

All nodes must:

1. **Execution Protocol**:
   - Extend `BaseNode`
   - Implement `process()` method
   - Manage state transitions correctly

2. **Data Flow Protocol**:
   - Define input/output ports
   - Use correct data types
   - Handle data normalization

3. **Error Handling Protocol**:
   - Have error property
   - Handle errors gracefully
   - Transition to Failed state on error

## Related Documentation

- [Core API](./core.md) - Core workflow APIs
- [Best Practices](../BEST_PRACTICES.md) - Development best practices
- [Node Development Tutorial](../NODE_DEVELOPMENT_TUTORIAL.md) - Creating custom nodes

