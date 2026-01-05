/**
 * Integration tests for plugin system
 * Tests plugin discovery, loading, and node type registration
 */

import { PluginRegistry } from "@workflow/plugins"
import { NodeTypeRegistryImpl } from "@workflow/core"
import { BaseNode } from "@workflow/core"
import type { Plugin, PluginManifest } from "@workflow/plugins"
import type { NodeOutput, NodePropertiesInput, ExecutionContext } from "@workflow/interfaces"

/**
 * Test node class
 */
class TestNode extends BaseNode {
  static readonly nodeType = "test-node"

  constructor(properties: NodePropertiesInput) {
    super({
      ...properties,
      nodeType: TestNode.nodeType,
    })
  }

  protected async process(_context: ExecutionContext): Promise<NodeOutput> {
    return { output: [] }
  }
}

describe("Plugin System Integration", () => {
  it("should discover and register plugin node types", async () => {
    const registry = new PluginRegistry()
    const nodeTypeRegistry = new NodeTypeRegistryImpl()
    registry.setNodeTypeRegistry(nodeTypeRegistry)

    const manifest: PluginManifest = {
      name: "test-plugin",
      version: "0.1.0",
      displayName: "Test Plugin",
      nodeTypes: ["test-node"],
    }

    const plugin: Plugin = {
      manifest,
      nodeTypes: [TestNode],
    }

    await registry.register(plugin)
    expect(nodeTypeRegistry.has("test-node")).toBe(true)
  })

  it("should handle plugin dependencies", async () => {
    const registry = new PluginRegistry()
    const nodeTypeRegistry = new NodeTypeRegistryImpl()
    registry.setNodeTypeRegistry(nodeTypeRegistry)

    const basePlugin: Plugin = {
      manifest: {
        name: "base-plugin",
        version: "0.1.0",
        displayName: "Base Plugin",
        nodeTypes: ["base-node"],
      },
      nodeTypes: [TestNode],
    }

    await registry.register(basePlugin)

    const dependentPlugin: Plugin = {
      manifest: {
        name: "dependent-plugin",
        version: "0.1.0",
        displayName: "Dependent Plugin",
        nodeTypes: ["dependent-node"],
        dependencies: ["base-plugin@0.1.0"],
      },
      nodeTypes: [TestNode],
    }

    await registry.register(dependentPlugin)
    expect(registry.get("dependent-plugin@0.1.0")).toBeDefined()
  })
})

