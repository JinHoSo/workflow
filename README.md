# Workflow Engine

A powerful, extensible workflow execution engine built with TypeScript. This system allows you to create complex workflows by connecting nodes together, with support for triggers, parallel execution, retry mechanisms, and more.

## Features

- **Unified Node Model**: All nodes, including triggers, are treated uniformly
- **DAG-Based Execution**: Intelligent dependency resolution and parallel execution
- **Schema Validation**: JSON Schema validation for node configurations
- **Retry Mechanism**: Configurable retry strategies with exponential backoff
- **State Management**: Centralized execution state tracking
- **Plugin System**: Extensible plugin architecture for custom node types
- **Protocol-Based Design**: Consistent interfaces for execution, data flow, and error handling

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

## Quick Start

### Creating a Simple Workflow

```typescript
import { Workflow } from "./src/core/workflow"
import { ManualTrigger } from "./src/triggers/manual-trigger"
import { JavaScriptNode } from "./src/nodes/javascript-execution-node"
import { ExecutionEngine } from "./src/execution/execution-engine"

// Create workflow
const workflow = new Workflow("my-workflow")

// Create trigger
const trigger = new ManualTrigger({
  id: "trigger-1",
  name: "trigger",
  nodeType: "manual-trigger",
  version: 1,
  position: [0, 0],
})

// Create JavaScript node
const jsNode = new JavaScriptNode({
  id: "js-1",
  name: "js-node",
  nodeType: "javascript",
  version: 1,
  position: [100, 0],
})

// Configure JavaScript node
jsNode.setup({
  code: `
    const value = input().value || 0;
    return { value: value * 2 };
  `,
})

// Add nodes to workflow
workflow.addNode(trigger)
workflow.addNode(jsNode)

// Link nodes
workflow.linkNodes("trigger", "output", "js-node", "input")

// Create execution engine
const engine = new ExecutionEngine(workflow)
trigger.setExecutionEngine(engine)

// Execute workflow
trigger.trigger({ output: { value: 5 } })

// Wait for execution
await new Promise(resolve => setTimeout(resolve, 100))

// Get result
const result = jsNode.getResult("output")
console.log(result) // { value: 10 }
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Node Types

### Built-in Nodes

- **ManualTrigger**: Manually trigger workflow execution
- **ScheduleTrigger**: Schedule workflow execution at specific times
- **JavaScriptNode**: Execute JavaScript code
- **HttpRequestNode**: Make HTTP requests

### Creating Custom Nodes

```typescript
import { BaseNode } from "./src/core/base-node"
import type { NodeOutput } from "./src/interfaces"
import type { ExecutionContext } from "./src/interfaces/execution-state"

class MyCustomNode extends BaseNode {
  constructor(properties: NodeProperties) {
    super(properties)
    this.addInput("input", "data")
    this.addOutput("output", "data")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    // Your custom logic here
    const inputData = context.input.input
    return { output: { processed: inputData } }
  }
}
```

## Configuration Schema

Nodes can define JSON Schema for configuration validation:

```typescript
import { JsonSchema } from "./src/schemas/schema-validator"

const myNodeSchema: JsonSchema = {
  type: "object",
  properties: {
    myConfig: {
      type: "string",
      description: "My configuration parameter",
    },
  },
  required: ["myConfig"],
  additionalProperties: false,
}

// In your node constructor:
this.configurationSchema = myNodeSchema
```

## Retry Mechanism

Nodes can be configured to retry on failure:

```typescript
const node = new MyNode({
  // ... other properties
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: { baseDelay: 1000, maxDelay: 10000 }, // Exponential backoff
  // or
  retryDelay: 1000, // Fixed delay
})
```

## State Management

Execution state is tracked centrally:

```typescript
const engine = new ExecutionEngine(workflow)
// ... execute workflow ...

// Get state manager
const stateManager = engine.getStateManager()

// Get node state
const nodeState = stateManager.getNodeState("node-name")

// Get execution metadata
const metadata = stateManager.getNodeMetadata("node-name")
console.log(metadata?.duration) // Execution duration in ms
```

## Plugin System

Create and register plugins:

```typescript
import { Plugin, PluginManifest } from "./src/plugins"
import { pluginRegistry } from "./src/plugins/plugin-registry"

const manifest: PluginManifest = {
  name: "my-plugin",
  version: "1.0.0",
  displayName: "My Plugin",
  description: "My custom plugin",
  nodeTypes: ["my-node-type"],
}

const plugin: Plugin = {
  manifest,
  nodeTypes: [MyCustomNode],
}

await pluginRegistry.register(plugin)
```

## Protocols

The system uses protocols for consistent behavior:

- **ExecutionProtocol**: How nodes are executed
- **DataFlowProtocol**: How data flows between nodes
- **ErrorHandlingProtocol**: How errors are handled

See [ARCHITECTURE.md](./ARCHITECTURE.md) for more details.

## License

[Add your license here]
