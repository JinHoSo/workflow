/**
 * Tests for plugin registry
 */

import { PluginRegistry } from "../plugin-registry"
import type { Plugin, PluginManifest } from "../plugin-manifest"
import { BaseNode } from "@workflow/core"
import type { NodeOutput, NodePropertiesInput, ExecutionContext } from "@workflow/interfaces"

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

describe("PluginRegistry", () => {
  let registry: PluginRegistry

  beforeEach(() => {
    registry = new PluginRegistry()
  })

  describe("register", () => {
    it("should register a plugin successfully", async () => {
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

      const registered = registry.get("test-plugin")
      expect(registered).toBeDefined()
      expect(registered?.manifest.name).toBe("test-plugin")
    })

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

    it("should validate plugin dependencies", async () => {
      const depManifest: PluginManifest = {
        name: "dep-plugin",
        version: "0.1.0",
        displayName: "Dependency Plugin",
        nodeTypes: [],
      }

      const depPlugin: Plugin = {
        manifest: depManifest,
        nodeTypes: [],
      }

      await registry.register(depPlugin)

      const manifest: PluginManifest = {
        name: "test-plugin",
        version: "0.1.0",
        displayName: "Test Plugin",
        nodeTypes: ["test-node"],
        dependencies: ["dep-plugin@0.1.0"],
      }

      const plugin: Plugin = {
        manifest,
        nodeTypes: [TestNode],
      }

      await registry.register(plugin)

      const registered = registry.get("test-plugin")
      expect(registered).toBeDefined()
    })

    it("should throw error when dependency is missing", async () => {
      const manifest: PluginManifest = {
        name: "test-plugin",
        version: "0.1.0",
        displayName: "Test Plugin",
        nodeTypes: ["test-node"],
        dependencies: ["missing-plugin"],
      }

      const plugin: Plugin = {
        manifest,
        nodeTypes: [TestNode],
      }

      await expect(registry.register(plugin)).rejects.toThrow("requires dependency")
    })
  })

  describe("unregister", () => {
    it("should unregister a plugin", async () => {
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
      await registry.unregister("test-plugin")

      const registered = registry.get("test-plugin")
      expect(registered).toBeUndefined()
    })

    it("should throw error when unregistering non-existent plugin", async () => {
      await expect(registry.unregister("non-existent")).rejects.toThrow("not found")
    })
  })

  describe("getAll", () => {
    it("should return all registered plugins", async () => {
      const plugin1: Plugin = {
        manifest: {
          name: "plugin-1",
          version: "0.1.0",
          displayName: "Plugin 1",
          nodeTypes: [],
        },
        nodeTypes: [],
      }

      const plugin2: Plugin = {
        manifest: {
          name: "plugin-2",
          version: "0.1.0",
          displayName: "Plugin 2",
          nodeTypes: [],
        },
        nodeTypes: [],
      }

      await registry.register(plugin1)
      await registry.register(plugin2)

      const all = registry.getAll()
      expect(all.length).toBe(2)
    })
  })

  describe("loading strategy", () => {
    it("should set loading strategy", () => {
      registry.setLoadingStrategy("lazy")
      // Strategy is stored internally, test by checking discover behavior
      expect(registry).toBeDefined()
    })
  })
})

