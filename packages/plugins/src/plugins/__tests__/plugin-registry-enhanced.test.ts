/**
 * Additional tests for PluginRegistry
 * Tests edge cases, error handling, and version compatibility
 */

import { PluginRegistry } from "../plugin-registry"
import { BaseNode } from "@workflow/core"
import type { Plugin, PluginManifest } from "../plugin-manifest"
import type { NodeOutput, NodePropertiesInput, ExecutionContext } from "@workflow/interfaces"
import { NodeTypeRegistryImpl } from "@workflow/core"

/**
 * Test node class for testing
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

describe("PluginRegistry - Enhanced Tests", () => {
  let registry: PluginRegistry

  beforeEach(() => {
    registry = new PluginRegistry()
  })

  describe("error handling", () => {
    it("should throw error when registering duplicate plugin", async () => {
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
      await expect(registry.register(plugin)).rejects.toThrow("already registered")
    })

    it("should throw error when dependency not found", async () => {
      const manifest: PluginManifest = {
        name: "dependent-plugin",
        version: "0.1.0",
        displayName: "Dependent Plugin",
        nodeTypes: ["test-node"],
        dependencies: ["missing-plugin@1.0.0"],
      }
      const plugin: Plugin = {
        manifest,
        nodeTypes: [TestNode],
      }
      await expect(registry.register(plugin)).rejects.toThrow("dependency")
    })
  })

  describe("version compatibility", () => {
    it("should handle plugin version updates", async () => {
      const manifest1: PluginManifest = {
        name: "test-plugin",
        version: "0.1.0",
        displayName: "Test Plugin",
        nodeTypes: ["test-node"],
      }
      const plugin1: Plugin = {
        manifest: manifest1,
        nodeTypes: [TestNode],
      }
      await registry.register(plugin1)

      const manifest2: PluginManifest = {
        name: "test-plugin",
        version: "0.2.0",
        displayName: "Test Plugin",
        nodeTypes: ["test-node"],
      }
      const plugin2: Plugin = {
        manifest: manifest2,
        nodeTypes: [TestNode],
      }
      await registry.register(plugin2)
      expect(registry.get("test-plugin@0.2.0")).toBeDefined()
    })
  })

  describe("node type registry integration", () => {
    it("should register node types when registry is set", async () => {
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
  })
})

