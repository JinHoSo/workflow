# Plugin Development Guide

This guide explains how to develop and register plugins for the workflow engine.

## Overview

Plugins allow you to extend the workflow engine with custom node types without modifying the core codebase. A plugin is a package that provides one or more node type classes.

## Plugin Structure

A plugin must implement the `Plugin` interface:

```typescript
import type { Plugin } from "./plugins/plugin-manifest"
import { BaseNode } from "./core/base-node"

interface MyPlugin extends Plugin {
  manifest: {
    name: "my-plugin"
    version: "1.0.0"
    displayName: "My Plugin"
    description: "A custom plugin"
    nodeTypes: ["my-custom-node"]
  }
  nodeTypes: [typeof MyCustomNode]
}
```

## Creating a Node Type

All node types must extend `BaseNode`:

```typescript
import { BaseNode } from "./core/base-node"
import type { ExecutionContext, NodeOutput } from "./interfaces/execution-state"
import { LinkType } from "./types"
import { javascriptNodeSchema } from "./schemas/javascript-node-schema"

export class MyCustomNode extends BaseNode {
  constructor(properties: import("./interfaces").NodeProperties) {
    super(properties)

    // Set configuration schema for validation
    this.configurationSchema = javascriptNodeSchema

    // Define input ports
    this.addInput("input", "data", LinkType.Standard)

    // Define output ports
    this.addOutput("output", "data", LinkType.Standard)
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    // Your node logic here
    const input = context.input.input?.[0]

    // Process and return output
    return {
      output: {
        result: input?.value || "default"
      }
    }
  }
}
```

## Plugin Registration

### Manual Registration

```typescript
import { pluginRegistry } from "./plugins/plugin-registry"
import { nodeTypeRegistry } from "./core/node-type-registry"

// Create plugin
const myPlugin: Plugin = {
  manifest: {
    name: "my-plugin",
    version: "1.0.0",
    displayName: "My Plugin",
    description: "A custom plugin",
    nodeTypes: ["my-custom-node"],
  },
  nodeTypes: [MyCustomNode],
  async initialize() {
    // Optional: Initialize plugin resources
  },
  async cleanup() {
    // Optional: Cleanup plugin resources
  },
}

// Connect plugin registry to node type registry
pluginRegistry.setNodeTypeRegistry(nodeTypeRegistry)

// Register plugin
await pluginRegistry.register(myPlugin)

// Node types are automatically registered in NodeTypeRegistry
```

### Plugin Dependencies

Plugins can depend on other plugins:

```typescript
const dependentPlugin: Plugin = {
  manifest: {
    name: "dependent-plugin",
    version: "1.0.0",
    displayName: "Dependent Plugin",
    dependencies: ["my-plugin@1.0.0"], // Requires my-plugin version 1.0.0
    nodeTypes: ["dependent-node"],
  },
  nodeTypes: [DependentNode],
}

// Registration will fail if dependencies are not satisfied
await pluginRegistry.register(dependentPlugin)
```

## Configuration Schema

Define a JSON Schema for your node's configuration:

```typescript
import type { JsonSchema } from "./schemas/schema-validator"

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

Then set it in your node constructor:

```typescript
this.configurationSchema = myNodeSchema
```

## Best Practices

1. **Use TypeScript**: Write your nodes in TypeScript for type safety
2. **Define Schemas**: Always define configuration schemas for validation
3. **Handle Errors**: Properly handle errors in your `process()` method
4. **Document Ports**: Clearly document what data your ports expect/produce
5. **Test Your Nodes**: Write unit tests for your custom nodes
6. **Version Your Plugin**: Use semantic versioning for your plugin

## Example: Complete Plugin

```typescript
import { BaseNode } from "./core/base-node"
import type { Plugin } from "./plugins/plugin-manifest"
import type { ExecutionContext, NodeOutput } from "./interfaces/execution-state"
import { LinkType } from "./types"

// Node implementation
class WeatherNode extends BaseNode {
  constructor(properties: import("./interfaces").NodeProperties) {
    super(properties)
    this.addInput("location", "data", LinkType.Standard)
    this.addOutput("weather", "data", LinkType.Standard)
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const location = context.input.location?.[0]?.value as string
    const apiKey = this.config.apiKey as string

    // Fetch weather data
    const response = await fetch(
      `https://api.weather.com/v1/current?location=${location}&key=${apiKey}`
    )
    const data = await response.json()

    return {
      weather: {
        temperature: data.temperature,
        condition: data.condition,
      },
    }
  }
}

// Plugin definition
const weatherPlugin: Plugin = {
  manifest: {
    name: "weather-plugin",
    version: "1.0.0",
    displayName: "Weather Plugin",
    description: "Provides weather information nodes",
    nodeTypes: ["weather"],
  },
  nodeTypes: [WeatherNode],
}

export default weatherPlugin
```

## Plugin Lifecycle

1. **Registration**: Plugin is registered via `pluginRegistry.register()`
2. **Initialization**: `initialize()` is called if provided
3. **Node Type Registration**: Node types are automatically registered
4. **Usage**: Nodes can be used in workflows
5. **Unregistration**: Plugin is unregistered via `pluginRegistry.unregister()`
6. **Cleanup**: `cleanup()` is called if provided

## Troubleshooting

### Node Type Not Found

If your node type is not found after registration:
- Ensure the plugin is registered before creating workflows
- Check that `pluginRegistry.setNodeTypeRegistry()` was called
- Verify the node type name matches the class name

### Configuration Validation Fails

If configuration validation fails:
- Check your schema definition
- Ensure required fields are provided
- Verify data types match the schema

### Dependencies Not Resolved

If plugin dependencies are not resolved:
- Ensure dependent plugins are registered first
- Check version numbers match exactly
- Verify plugin names are correct

