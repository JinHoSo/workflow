/**
 * Plugin System Example
 *
 * This example demonstrates creating and registering a custom plugin.
 */

import { PluginRegistry } from "../src/plugins/plugin-registry"
import { NodeTypeRegistryImpl } from "../src/core/node-type-registry"
import { BaseNode } from "../src/core/base-node"
import type { Plugin } from "../src/plugins/plugin-manifest"
import type { NodeOutput } from "../src/interfaces"
import type { ExecutionContext } from "../src/interfaces/execution-state"

/**
 * Custom node class
 */
class CustomNode extends BaseNode {
  constructor(properties: import("../src/interfaces").NodeProperties) {
    super(properties)
    this.addInput("input", "data")
    this.addOutput("output", "data")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const inputData = context.input.input
    const value = Array.isArray(inputData) ? inputData[0] : inputData
    const numValue = typeof value === "object" && value !== null && "value" in value
      ? (value as { value: number }).value
      : 0

    return { output: { processed: numValue * 10 } }
  }
}

async function pluginSystemExample() {
  // Create registries
  const nodeTypeRegistry = new NodeTypeRegistryImpl()
  const pluginRegistry = new PluginRegistry()
  pluginRegistry.setNodeTypeRegistry(nodeTypeRegistry)

  // Create plugin
  const plugin: Plugin = {
    manifest: {
      name: "custom-plugin",
      version: "1.0.0",
      displayName: "Custom Plugin",
      description: "Example custom plugin",
      dependencies: [],
      nodeTypes: ["CustomNode"],
    },
    nodeTypes: [CustomNode],
    async initialize() {
      console.log("Plugin initialized")
    },
    async cleanup() {
      console.log("Plugin cleaned up")
    },
  }

  // Register plugin
  await pluginRegistry.register(plugin)

  // Node types are now available
  const nodeType = nodeTypeRegistry.get("custom-node", 1)
  console.log("Node type registered:", nodeType !== undefined)

  // Unregister plugin
  await pluginRegistry.unregister("custom-plugin")
  console.log("Plugin unregistered")
}

pluginSystemExample().catch(console.error)

