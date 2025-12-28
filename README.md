# Workflow Engine

A KNIME/n8n-style workflow engine built with TypeScript, providing a flexible and extensible system for creating data processing pipelines.

## Features

- **Node-based Architecture**: Create workflows by connecting nodes
- **Type-safe**: Full TypeScript support with no `any` or `unknown` types
- **Extensible**: Easy to add new node types and triggers
- **Execution Engine**: Handles sequential and parallel node execution
- **Multiple Trigger Types**: Manual triggers (with more coming)
- **JavaScript Execution Node**: Execute custom JavaScript code in workflows

## Installation

```bash
yarn install
```

## Building

```bash
yarn build
```

## Testing

```bash
yarn test
```

Run tests in watch mode:

```bash
yarn test:watch
```

Generate coverage report:

```bash
yarn test:coverage
```

## Type Checking

```bash
yarn typecheck
```

## Linting

```bash
yarn lint
```

Fix linting issues:

```bash
yarn lint:fix
```

## Usage

```typescript
import { Workflow, ManualTriggerNode, JavaScriptExecutionNode, ExecutionEngine } from "./src"

// Create a workflow
const workflow = new Workflow("my-workflow")

// Create nodes
const trigger = new ManualTriggerNode({
  id: "trigger-1",
  name: "trigger",
  type: "manual",
  typeVersion: 1,
  position: [0, 0],
})

const jsNode = new JavaScriptExecutionNode({
  id: "js-1",
  name: "js-node",
  type: "javascript",
  typeVersion: 1,
  position: [100, 0],
})

// Configure nodes
trigger.configure({})
jsNode.configure({ code: "$output.result = $input[0].value * 2" })

// Add nodes to workflow
workflow.addNode(trigger)
workflow.addNode(jsNode)

// Connect nodes
workflow.connectNodes("trigger", 0, "js-node", "input")

// Execute workflow
const engine = new ExecutionEngine(workflow)
trigger.setWorkflowExecuteCallback((data) => {
  engine.execute("trigger", data)
})

trigger.execute([[{ json: { value: 5 } }]])
```

## Project Structure

```
src/
├── types/              # Type definitions (NodeStatus, ConnectionType)
├── interfaces/         # All interface definitions
├── protocols/          # Protocol definitions
├── core/              # Core implementation (Workflow, BaseNode, NodeTypeRegistry)
├── triggers/          # Trigger implementations
├── nodes/             # Node type implementations
├── execution/         # Execution engine
└── __tests__/         # Unit tests
```

## License

MIT

