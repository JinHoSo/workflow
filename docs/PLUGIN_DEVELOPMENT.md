# Plugin Development Guide

This guide explains how to develop plugins for the Workflow Engine.

## Overview

Plugins extend the Workflow Engine by providing new node types. Each plugin can contain one or more node types that can be used in workflows.

## Quick Start

### 1. Create a Plugin

```bash
workflow create:plugin my-plugin
cd my-plugin
```

### 2. Create Nodes

```bash
workflow create:node my-node --template basic
```

### 3. Implement Node Logic

Edit `src/nodes/my-node.ts`:

```typescript
import { BaseNode } from "workflow-engine"
import type { ExecutionContext, NodeOutput } from "workflow-engine"

export class MyNode extends BaseNode {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const input = context.input["input"] || []
    // Your logic here
    return { output: input }
  }
}
```

### 4. Register Node in Plugin

Edit `src/index.ts`:

```typescript
import { MyNode } from "./nodes/my-node"
import { manifest } from "./manifest"

export const plugin: Plugin = {
  manifest,
  nodeTypes: [MyNode],
}
```

### 5. Build and Test

```bash
workflow build
workflow test
```

### 6. Publish

```bash
workflow publish
```

## Plugin Structure

```
my-plugin/
├── package.json          # Plugin metadata
├── tsconfig.json         # TypeScript config
├── src/
│   ├── manifest.ts      # Plugin manifest
│   ├── index.ts         # Plugin entry point
│   └── nodes/           # Node implementations
│       └── my-node.ts
├── schemas/             # Configuration schemas
├── icons/               # Node icons (SVG)
├── README.md
└── LICENSE
```

## Plugin Manifest

The manifest defines plugin metadata:

```typescript
export const manifest: PluginManifest = {
  name: "@workflow/my-plugin",
  version: "0.1.0",
  displayName: "My Plugin",
  description: "Description of what the plugin does",
  author: "Your Name",
  dependencies: [], // Other plugin dependencies
  nodeTypes: ["my-node"], // Node type names
  category: "integration", // Optional category
  tags: ["api", "http"], // Optional tags
}
```

## Node Development

### Basic Node

```typescript
export class MyNode extends BaseNode {
  constructor(properties: NodeProperties) {
    super(properties)

    // Define input ports
    this.addInput("input", "any")

    // Define output ports
    this.addOutput("output", "any")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    // Node logic
    return { output: [] }
  }
}
```

### HTTP Node Template

```typescript
export class HttpNode extends BaseNode {
  protected configurationSchema = httpNodeSchema

  constructor(properties: NodeProperties) {
    super(properties)
    this.addInput("input", "any")
    this.addOutput("output", "any")
    this.addOutput("error", "any")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const config = this.config as HttpNodeConfiguration
    // HTTP request logic
    return { output: [] }
  }
}
```

### Trigger Node Template

```typescript
export class MyTrigger extends TriggerNodeBase {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    // Trigger logic
    return { output: [] }
  }
}
```

## Configuration Schemas

Define JSON Schema for node configuration:

```typescript
export const myNodeSchema: JsonSchema = {
  type: "object",
  properties: {
    apiKey: {
      type: "string",
      description: "API key for authentication",
    },
    timeout: {
      type: "number",
      minimum: 0,
      description: "Request timeout in milliseconds",
    },
  },
  required: ["apiKey"],
  additionalProperties: false,
}
```

## Testing

### Using Test Utilities

```typescript
import { simulateNodeExecution, createMockInputData } from "@workflow/test-utils"

describe("MyNode", () => {
  it("should process input correctly", async () => {
    const node = new MyNode(properties)
    const result = await simulateNodeExecution(node, {
      inputData: createMockInputData("input", [{ value: "test" }]),
    })

    expect(result.state).toBe(NodeState.Completed)
    expect(result.output).toHaveProperty("output")
  })
})
```

## Protocol Compliance

All nodes must comply with workflow protocols. Validate compliance:

```bash
workflow validate
```

### Execution Protocol

- Nodes must extend `BaseNode`
- Must implement `process()` method
- Must manage state correctly

### Data Flow Protocol

- Must define input/output ports
- Port data types must be strings
- Must handle data correctly

### Error Handling Protocol

- Must have error property
- Must handle errors gracefully
- Must transition to Failed state on error

## Development Mode

Use hot reloading during development:

```bash
workflow dev
```

This watches for file changes and automatically reloads plugins.

## Publishing

### Version Bumping

```bash
workflow publish --bump patch  # 0.1.0 -> 0.1.1
workflow publish --bump minor  # 0.1.0 -> 0.2.0
workflow publish --bump major  # 0.1.0 -> 1.0.0
```

### Dry Run

Test publishing without actually publishing:

```bash
workflow publish --dry-run
```

## Best Practices

1. **Keep nodes focused**: Each node should do one thing well
2. **Use schemas**: Always define configuration schemas
3. **Handle errors**: Implement proper error handling
4. **Write tests**: Test all node functionality
5. **Document**: Provide clear descriptions and examples
6. **Follow protocols**: Ensure protocol compliance
7. **Version properly**: Use semantic versioning

## Examples

See the `examples/` directory for example plugins and nodes.

## Troubleshooting

### Plugin not discovered

- Ensure `workflow.plugin: true` in package.json
- Check `workflow.nodeTypes` array is populated
- Verify plugin is in node_modules or watch directories

### Node not registered

- Check node is exported in plugin index.ts
- Verify node extends BaseNode
- Ensure node is in nodeTypes array

### Validation errors

- Run `workflow validate` to see issues
- Check protocol compliance
- Review error messages for fixes

## Resources

- [API Documentation](./API.md)
- [Protocol Documentation](./PROTOCOLS.md)
- [Contributing Guide](../CONTRIBUTING.md)

