# Workflow Engine

A powerful, extensible workflow execution engine built with TypeScript. This system allows you to create complex workflows by connecting nodes together, with support for triggers, parallel execution, retry mechanisms, and more.

## Features

- **Unified Node Model**: All nodes, including triggers, are treated uniformly in a single collection
- **DAG-Based Execution**: Intelligent dependency resolution using topological sorting with parallel execution
- **Schema Validation**: JSON Schema validation for node configurations with detailed error messages
- **Retry Mechanism**: Configurable retry strategies (exponential backoff, fixed delay) with attempt tracking
- **State Management**: Centralized execution state tracking with persistence hooks and recovery
- **Plugin System**: Extensible plugin architecture for dynamic node type loading and registration
- **Protocol-Based Design**: Consistent interfaces for execution, data flow, and error handling
- **Version Management**: Semantic versioning with compatibility tracking and migration utilities
- **Protocol Compliance**: Validation tools to ensure nodes comply with all protocols

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
import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { JavaScriptExecutionNode } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"

// Create workflow
const workflow = new Workflow("my-workflow")

// Create trigger
// nodeType is automatically set from class definition
const trigger = new ManualTrigger({
  id: "trigger-1",
  name: "trigger",
  version: 1,
  position: [0, 0],
})

// Create JavaScript node
// nodeType is automatically set from class definition
// isTrigger defaults to false, so it can be omitted
const jsNode = new JavaScriptExecutionNode({
  id: "js-1",
  name: "js-node",
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

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

### 🚀 Getting Started
- [Getting Started Guide](./docs/getting-started/README.md) - Start here if you're new
- [Installation](./docs/getting-started/installation.md) - Installation instructions
- [Quick Start](./docs/getting-started/quick-start.md) - Get started in 5 minutes
- [Your First Workflow](./docs/getting-started/your-first-workflow.md) - Build your first workflow
- [Core Concepts](./docs/getting-started/core-concepts.md) - Understand key concepts

### 📖 Guides
- [Building Workflows](./docs/guides/building-workflows.md) - How to build workflows
- [Working with Nodes](./docs/guides/working-with-nodes.md) - Understanding nodes
- [Data Flow](./docs/guides/data-flow.md) - How data flows between nodes
- [Error Handling](./docs/guides/error-handling.md) - Handling errors
- [State Management](./docs/guides/state-management.md) - Execution state
- [Workflow Patterns](./docs/guides/workflow-patterns.md) - Common patterns

### 🔧 API Reference
- [API Overview](./docs/api/README.md) - Complete API documentation
- [Core API](./docs/api/core.md) - Workflow and BaseNode APIs
- [Execution API](./docs/api/execution.md) - ExecutionEngine APIs
- [Node Types API](./docs/api/nodes.md) - Built-in node types

### 👨‍💻 Developer Resources
- [Architecture](./docs/ARCHITECTURE.md) - System architecture
- [Node Development Tutorial](./docs/NODE_DEVELOPMENT_TUTORIAL.md) - Create custom nodes
- [Plugin Development Guide](./docs/PLUGIN_DEVELOPMENT.md) - Build plugins
- [Best Practices](./docs/BEST_PRACTICES.md) - Development best practices
- [Package Structure](./docs/PACKAGE_STRUCTURE.md) - Monorepo structure
- [Migration Guide](./docs/MIGRATION_GUIDE.md) - Migration guide
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues

### 📝 Examples
- [Basic Examples](./examples/basic/) - Simple workflows
- [Advanced Examples](./examples/advanced/) - Complex scenarios
- [Integration Examples](./examples/integrations/) - External integrations

For the complete documentation index, see [Documentation Overview](./docs/README.md).

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

Create and register plugins with automatic node type registration:

```typescript
import { Plugin, PluginManifest } from "./src/plugins"
import { pluginRegistry } from "./src/plugins/plugin-registry"
import { NodeTypeRegistryImpl } from "./src/core/node-type-registry"

// Create registry and connect to plugin registry
const nodeTypeRegistry = new NodeTypeRegistryImpl()
pluginRegistry.setNodeTypeRegistry(nodeTypeRegistry)

// Create plugin
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

// Register plugin (node types are automatically registered)
await pluginRegistry.register(plugin)

// Node types are now available
const nodeType = nodeTypeRegistry.get("my-node-type")
```

## Protocols

The system uses protocols for consistent behavior:

- **ExecutionProtocol**: How nodes are executed with state validation
- **DataFlowProtocol**: How data flows between nodes with normalization
- **ErrorHandlingProtocol**: How errors are handled with retry support

### Protocol Compliance Validation

Validate that nodes comply with all protocols:

```typescript
import { protocolValidator } from "./src/protocols/protocol-validator"
import { executionProtocol, dataFlowProtocol, errorHandlingProtocol } from "./src/protocols"

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

See [PROTOCOLS.md](./docs/PROTOCOLS.md) for detailed protocol usage patterns.

## CLI Tools

The Workflow Engine includes a comprehensive CLI for development:

### Installation

```bash
cd packages/cli
yarn install
yarn build
```

### Available Commands

```bash
# Create a new node
workflow create:node <name> [--template <basic|http|trigger>]

# Create a new plugin
workflow create:plugin <name>

# Build plugin/node
workflow build [--watch]

# Run tests
workflow test [--watch] [--coverage]

# Validate protocol compliance
workflow validate [--format json] [--suggest]

# Publish plugin
workflow publish [--dry-run] [--bump <patch|minor|major>]

# Search plugins
workflow search [query] [--category <cat>] [--node-type <type>]

# Install plugin
workflow install <name> [--version <ver>]

# List plugins
workflow list

# Show plugin info
workflow info <name>

# Update plugin
workflow update <name>

# Remove plugin
workflow remove <name>

# Development mode with hot reloading
workflow dev [--watch <dirs>]
```

### Quick Start

```bash
# Create your first plugin
workflow create:plugin my-plugin
cd my-plugin

# Create a node
workflow create:node my-node

# Build and test
workflow build
workflow test

# Validate
workflow validate

# Publish
workflow publish
```

For detailed documentation, see:
- [Plugin Development Guide](./docs/PLUGIN_DEVELOPMENT.md)
- [Node Development Tutorial](./docs/NODE_DEVELOPMENT_TUTORIAL.md)
- [Best Practices](./docs/BEST_PRACTICES.md)
- [Contributing Guide](./CONTRIBUTING.md)

## Version Management

Manage node type versions with compatibility tracking and migration:

```typescript
import { versionCompatibilityTracker } from "./src/core/version-compatibility"
import { versionMigration } from "./src/core/version-migration"

// Record compatibility
versionCompatibilityTracker.recordCompatibility(
  "node-type",
  fromVersion,
  toVersion,
  compatible,
  "minor"
)

// Check compatibility
const compatibility = versionCompatibilityTracker.checkCompatibility(
  "node-type",
  fromVersion,
  toVersion
)

// Migrate nodes
const result = versionMigration.migrateNode(node, targetVersion, registry)
```

See [VERSIONING.md](./docs/VERSIONING.md) for versioning strategy details.

## Workflow Validation

Validate workflows for node type availability:

```typescript
// Check if all node types are available
const validation = workflow.validateNodeTypeAvailability(registry)
if (!validation.valid) {
  console.error("Missing types:", validation.missingTypes)
}

// Get nodes with unavailable types
const unavailable = workflow.getNodesWithUnavailableTypes(registry)

// Remove unavailable nodes gracefully
const removed = workflow.removeNodesWithUnavailableTypes(registry)
```

## License

[Add your license here]
