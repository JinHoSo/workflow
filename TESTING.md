# Testing Guidelines

This document provides guidelines for writing and running tests in the workflow monorepo.

## Test Structure

All packages follow a consistent test structure:
- Test files are located in `src/**/__tests__/` directories
- Test files use the naming convention `*.test.ts`
- Each package has its own `jest.config.js` file

## Running Tests

### Run all tests in a package
```bash
cd packages/<package-name>
yarn test
```

### Run tests in watch mode
```bash
cd packages/<package-name>
yarn test:watch
```

### Run a specific test file
```bash
cd packages/<package-name>
yarn test <test-file-name>
```

## Writing Tests

### Test File Structure

```typescript
/**
 * Tests for <ComponentName>
 * Brief description of what is being tested
 */

import { ComponentName } from "../component-name"
import { describe, it, expect, beforeEach } from "@jest/globals"

describe("ComponentName", () => {
  let component: ComponentName

  beforeEach(() => {
    component = new ComponentName()
  })

  describe("method name", () => {
    it("should do something", () => {
      // Test implementation
      expect(component.method()).toBe(expectedValue)
    })
  })
})
```

### Common Patterns

#### Testing Node Classes
```typescript
class TestNode extends BaseNode {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    return { output: [] }
  }
}

describe("TestNode", () => {
  let node: TestNode

  beforeEach(() => {
    node = new TestNode({
      id: "test-1",
      name: "TestNode",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
  })

  it("should execute successfully", async () => {
    node.addInput("input", "object")
    node.addOutput("output", "object")
    const context: ExecutionContext = {
      input: { input: [{ value: "test" }] },
      state: {},
    }
    const result = await node.run(context)
    expect(result).toHaveProperty("output")
  })
})
```

#### Testing State Transitions
```typescript
it("should transition from Idle to Running", () => {
  expect(node.getState()).toBe(NodeState.Idle)
  node.setState(NodeState.Running)
  expect(node.getState()).toBe(NodeState.Running)
})
```

#### Testing Error Handling
```typescript
it("should throw error on invalid input", async () => {
  await expect(node.run(invalidContext)).rejects.toThrow("Error message")
  expect(node.getState()).toBe(NodeState.Failed)
})
```

## Test Coverage

We aim for at least 80% code coverage for all packages. Run coverage reports:

```bash
cd packages/<package-name>
yarn test --coverage
```

## Integration Tests

Integration tests are located in `packages/__tests__/integration/` and test end-to-end workflows across multiple packages.

## Best Practices

1. **Test one thing at a time**: Each test should verify a single behavior
2. **Use descriptive test names**: Test names should clearly describe what is being tested
3. **Setup and teardown**: Use `beforeEach` and `afterEach` to set up test fixtures
4. **Mock external dependencies**: Use mocks for external services, file system, network calls
5. **Test edge cases**: Include tests for error conditions, boundary values, and edge cases
6. **Keep tests independent**: Tests should not depend on each other or execution order

## Common Test Utilities

### Mock Objects
- Use `MockSecretRegistry` for testing secret management
- Use `MockExternalSecretProvider` for testing external secret providers
- Create test node classes that extend `BaseNode` for testing node behavior

### Test Fixtures
- Create reusable test data in `__tests__/fixtures/` directories
- Use factory functions to create test objects with default values

## Troubleshooting

### Tests fail with module not found errors
- Ensure all dependencies are installed: `yarn install`
- Check that the package is built: `yarn build`

### Tests fail with type errors
- Run type checking: `yarn typecheck`
- Ensure TypeScript configuration is correct

### Tests are slow
- Use `jest.config.js` to configure test timeouts
- Consider using `jest.setTimeout()` for specific slow tests

