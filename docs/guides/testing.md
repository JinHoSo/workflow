# Testing Guide

Guide for testing workflows, nodes, and plugins in Workflow Engine.

## Testing Overview

Workflow Engine provides utilities and patterns for testing:

- Unit tests for individual nodes
- Integration tests for workflows
- Protocol compliance validation
- Mock utilities for external dependencies

## Testing Nodes

### Basic Node Test

```typescript
import { BaseNode } from "@workflow/core"
import type { ExecutionContext, NodeOutput } from "@workflow/interfaces"

class TestNode extends BaseNode {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const input = context.input["input"] || []
    return { output: input }
  }
}

describe("TestNode", () => {
  let node: TestNode

  beforeEach(() => {
    node = new TestNode({
      id: "test-1",
      name: "test-node",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
    node.addInput("input", "any")
    node.addOutput("output", "any")
  })

  it("should process input correctly", async () => {
    const context: ExecutionContext = {
      input: { input: [{ value: "test" }] },
      state: {},
    }

    const result = await node.run(context)
    expect(result.output).toEqual([{ value: "test" }])
  })
})
```

### Testing with Configuration

```typescript
it("should use configuration", async () => {
  node.setup({ multiplier: 2 })

  const context: ExecutionContext = {
    input: { input: [{ value: 5 }] },
    state: {},
  }

  const result = await node.run(context)
  expect(result.output[0].value).toBe(10)
})
```

## Testing Workflows

### Simple Workflow Test

```typescript
import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"

describe("Workflow", () => {
  it("should execute workflow", async () => {
    const workflow = new Workflow("test-workflow")
    const trigger = new ManualTrigger({...})
    const node = new TestNode({...})

    workflow.addNode(trigger)
    workflow.addNode(node)
    workflow.linkNodes("trigger", "output", "node", "input")

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    trigger.trigger({ output: { value: 5 } })
    await new Promise(resolve => setTimeout(resolve, 100))

    const result = node.getResult("output")
    expect(result).toBeDefined()
  })
})
```

## Testing Protocols

### Protocol Compliance

```typescript
import { protocolValidator } from "@workflow/protocols"

it("should comply with protocols", () => {
  const result = protocolValidator.validateAllProtocols(
    node,
    executionProtocol,
    dataFlowProtocol,
    errorHandlingProtocol
  )

  expect(result.compliant).toBe(true)
})
```

## Mocking

### Mock External Dependencies

```typescript
jest.mock("external-service", () => ({
  fetchData: jest.fn().mockResolvedValue({ data: "test" }),
}))
```

### Mock Node Execution

```typescript
const mockNode = {
  run: jest.fn().mockResolvedValue({ output: [{ value: 10 }] }),
}
```

## Test Utilities

### Test Helpers

```typescript
import { createMockExecutionContext } from "@workflow/test-utils"

const context = createMockExecutionContext({
  input: { input: [{ value: 5 }] },
})
```

## Best Practices

1. **Test all code paths**: Happy paths and error cases
2. **Use descriptive test names**: Clear test descriptions
3. **Isolate tests**: Each test should be independent
4. **Mock external dependencies**: Don't rely on external services
5. **Test error handling**: Verify error scenarios
6. **Test configuration**: Test with different configurations

## Related Documentation

- [Node Development Tutorial](../NODE_DEVELOPMENT_TUTORIAL.md)
- [Best Practices](../BEST_PRACTICES.md)
- [API Reference](../api/README.md)

