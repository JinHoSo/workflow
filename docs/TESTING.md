# Testing Strategy and Patterns

This document outlines the testing strategy and patterns for the refactored workflow architecture.

## Test Structure

### Unit Tests
- **Location**: `src/__tests__/`
- **Purpose**: Test individual components in isolation
- **Examples**:
  - `base-node.test.ts` - BaseNode functionality
  - `schema-validation.test.ts` - Schema validation
  - `protocol-validator.test.ts` - Protocol compliance

### Integration Tests
- **Location**: `src/__tests__/integration.test.ts`
- **Purpose**: Test interactions between components
- **Coverage**:
  - Unified node model
  - DAG execution
  - Parallel execution
  - Plugin system
  - Schema validation
  - Protocol implementations
  - Retry mechanisms
  - State management

### Edge Case Tests
- **Location**: `src/__tests__/edge-cases.test.ts`
- **Purpose**: Test edge cases and error conditions
- **Coverage**:
  - Circular dependencies
  - Missing nodes
  - Invalid configurations
  - Empty workflows
  - Invalid state transitions

### Error Scenario Tests
- **Location**: `src/__tests__/error-scenarios.test.ts`
- **Purpose**: Test error handling and recovery
- **Coverage**:
  - Node failures
  - Retry exhaustion
  - State corruption
  - Cascading failures

### Stress Tests
- **Location**: `src/__tests__/stress-tests.test.ts`
- **Purpose**: Test performance under load
- **Coverage**:
  - Complex workflows with many nodes
  - Deep dependency chains
  - Parallel execution with many nodes

### Benchmark Tests
- **Location**: `src/__tests__/benchmarks.test.ts`
- **Purpose**: Measure and compare performance
- **Coverage**:
  - DAG execution performance
  - Parallel execution speedup
  - Execution with limits

## Testing Patterns

### Node Testing Pattern

```typescript
class TestNode extends BaseNode {
  constructor(properties: NodeProperties) {
    super(properties)
    this.addInput("input", "data")
    this.addOutput("output", "data")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    // Implementation
    return { output: { value: 1 } }
  }
}
```

### Workflow Testing Pattern

```typescript
const workflow = new Workflow("test-workflow")
const trigger = new ManualTrigger({ /* ... */ })
const node = new TestNode({ /* ... */ })

workflow.addNode(trigger)
workflow.addNode(node)
workflow.linkNodes("trigger", "output", "node", "input")

trigger.setup({})
node.setup({})

const engine = new ExecutionEngine(workflow)
trigger.setExecutionEngine(engine)

trigger.trigger()

// Wait for execution
let attempts = 0
while (workflow.state !== WorkflowState.Completed &&
       workflow.state !== WorkflowState.Failed &&
       attempts < 100) {
  await new Promise((resolve) => setTimeout(resolve, 10))
  attempts++
}
```

### Async Testing Pattern

For async operations, use polling with timeout:

```typescript
let attempts = 0
const maxAttempts = 100
while (condition && attempts < maxAttempts) {
  await new Promise((resolve) => setTimeout(resolve, 10))
  attempts++
}
expect(condition).toBe(true)
```

## Test Coverage Goals

### Core Components
- **BaseNode**: 100% coverage
- **Workflow**: 100% coverage
- **ExecutionEngine**: 100% coverage
- **NodeTypeRegistry**: 100% coverage
- **PluginRegistry**: 100% coverage

### Protocols
- **ExecutionProtocol**: 100% coverage
- **DataFlowProtocol**: 100% coverage
- **ErrorHandlingProtocol**: 100% coverage

### Utilities
- **Schema Validation**: 100% coverage
- **Retry Strategy**: 100% coverage
- **Version Management**: 100% coverage

## Running Tests

### All Tests
```bash
yarn test
```

### Specific Test File
```bash
yarn test src/__tests__/workflow.test.ts
```

### Watch Mode
```bash
yarn test --watch
```

### Coverage Report
```bash
yarn test --coverage
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` and `afterEach` for setup/teardown
3. **Naming**: Use descriptive test names that explain what is being tested
4. **Assertions**: Use specific assertions (e.g., `toBe` vs `toEqual`)
5. **Async**: Always wait for async operations to complete
6. **Mocking**: Mock external dependencies (APIs, file system, etc.)

## Common Test Scenarios

### Testing Node Execution
```typescript
test("should execute node and produce output", async () => {
  const node = new TestNode(properties)
  node.setup({})

  const context: ExecutionContext = {
    input: { input: { value: 1 } },
    state: {}
  }

  const result = await node.run(context)
  expect(result.output).toBeDefined()
  expect(node.state).toBe(NodeState.Completed)
})
```

### Testing Workflow Execution
```typescript
test("should execute workflow end-to-end", async () => {
  // Setup workflow
  // Execute
  // Verify results
  expect(workflow.state).toBe(WorkflowState.Completed)
})
```

### Testing Error Handling
```typescript
test("should handle node failure", async () => {
  const failingNode = new AlwaysFailingNode(properties)
  // Execute workflow
  expect(workflow.state).toBe(WorkflowState.Failed)
  expect(failingNode.error).toBeDefined()
})
```

## Future Improvements

1. **E2E Tests**: Add end-to-end tests for complete workflows
2. **Performance Tests**: Add continuous performance monitoring
3. **Visual Regression**: Add visual tests for UI components (if applicable)
4. **Mutation Testing**: Add mutation testing for better coverage validation

