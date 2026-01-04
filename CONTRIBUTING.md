# Contributing to Workflow Engine

Thank you for your interest in contributing to the Workflow Engine! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Yarn package manager
- Git

### Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd workflow
```

2. Install dependencies:
```bash
yarn install
```

3. Build the project:
```bash
yarn build
```

4. Run tests:
```bash
yarn test
```

## Development Workflow

### Creating a New Node

Use the CLI to create a new node:

```bash
# From packages/cli directory
yarn build
node dist/bin/workflow.js create:node my-node --template basic
```

This will generate:
- Node TypeScript file
- Configuration schema
- Test file
- Package.json

### Creating a New Plugin

```bash
node dist/bin/workflow.js create:plugin my-plugin
```

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

### Code Quality

Before submitting a PR, ensure:

1. All tests pass: `yarn test`
2. Code is linted: `yarn lint`
3. Type checking passes: `yarn typecheck`
4. Code follows the project's style guidelines

## Plugin Development

### Plugin Structure

A plugin should follow this structure:

```
my-plugin/
├── package.json          # Plugin metadata with workflow field
├── src/
│   ├── manifest.ts      # Plugin manifest
│   ├── index.ts         # Plugin entry point
│   └── nodes/           # Node implementations
│       └── my-node.ts
├── schemas/             # Node configuration schemas
├── icons/               # Node icons (optional)
├── README.md
└── LICENSE
```

### Plugin Manifest

The plugin manifest defines plugin metadata:

```typescript
export const manifest: PluginManifest = {
  name: "@workflow/my-plugin",
  version: "0.1.0",
  displayName: "My Plugin",
  description: "Plugin description",
  author: "Your Name",
  dependencies: [],
  nodeTypes: ["my-node"],
  category: "integration",
  tags: ["api", "http"],
}
```

### Node Implementation

Nodes must extend `BaseNode`:

```typescript
import { BaseNode } from "workflow-engine"
import type { ExecutionContext, NodeOutput } from "workflow-engine"

export class MyNode extends BaseNode {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    // Node logic here
    return { output: [] }
  }
}
```

## Testing Guidelines

### Writing Tests

- Use Jest for testing
- Place test files next to source files with `.test.ts` extension
- Test both happy paths and error cases
- Mock external dependencies

### Test Utilities

Use `@workflow/test-utils` for node testing:

```typescript
import { simulateNodeExecution, createMockInputData } from "@workflow/test-utils"

const result = await simulateNodeExecution(node, {
  inputData: createMockInputData("input", [{ value: "test" }]),
})
```

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and small

## Submitting Changes

1. Create a feature branch from `main`
2. Make your changes
3. Write or update tests
4. Ensure all tests pass
5. Update documentation if needed
6. Submit a pull request

### Pull Request Guidelines

- Provide a clear description of changes
- Reference any related issues
- Ensure CI checks pass
- Request review from maintainers

## Protocol Compliance

All nodes must comply with workflow protocols:

- **ExecutionProtocol**: Proper state management and execution
- **DataFlowProtocol**: Correct port definitions and data flow
- **ErrorHandlingProtocol**: Error handling and state transitions

Validate compliance:

```bash
workflow validate
```

## Questions?

If you have questions, please:
- Check existing documentation
- Open an issue for discussion
- Reach out to maintainers

Thank you for contributing!

