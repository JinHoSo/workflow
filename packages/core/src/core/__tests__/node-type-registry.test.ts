/**
 * Tests for NodeTypeRegistry class
 * Tests registration, retrieval, versioning, and plugin integration
 */

import { NodeTypeRegistryImpl } from "../node-type-registry"
import type { NodeType, NodeTypeMetadata } from "@workflow/interfaces"

/**
 * Creates a test node type
 */
function createTestNodeType(name: string, version: number): NodeType {
  const metadata: NodeTypeMetadata = {
    name,
    displayName: `${name} Node`,
    description: `Test node type ${name}`,
    version,
  }

  return {
    metadata,
    async run(_node, _inputData) {
      return { output: [] }
    },
  }
}

describe("NodeTypeRegistryImpl", () => {
  let registry: NodeTypeRegistryImpl

  beforeEach(() => {
    registry = new NodeTypeRegistryImpl()
  })

  describe("registration", () => {
    it("should register a node type", () => {
      const nodeType = createTestNodeType("test-node", 1)
      registry.register(nodeType)
      expect(registry.has("test-node")).toBe(true)
    })

    it("should register multiple versions of the same node type", () => {
      const nodeType1 = createTestNodeType("test-node", 1)
      const nodeType2 = createTestNodeType("test-node", 2)
      registry.register(nodeType1)
      registry.register(nodeType2)
      expect(registry.has("test-node", 1)).toBe(true)
      expect(registry.has("test-node", 2)).toBe(true)
    })

    it("should return all registered node types", () => {
      const nodeType1 = createTestNodeType("test-node-1", 1)
      const nodeType2 = createTestNodeType("test-node-2", 1)
      registry.register(nodeType1)
      registry.register(nodeType2)
      const all = registry.getAll()
      expect(all.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe("retrieval", () => {
    it("should retrieve node type by name and version", () => {
      const nodeType = createTestNodeType("test-node", 1)
      registry.register(nodeType)
      const retrieved = registry.get("test-node", 1)
      expect(retrieved).toBeDefined()
      expect(retrieved?.metadata.name).toBe("test-node")
      expect(retrieved?.metadata.version).toBe(1)
    })

    it("should return latest version when version not specified", () => {
      const nodeType1 = createTestNodeType("test-node", 1)
      const nodeType2 = createTestNodeType("test-node", 2)
      registry.register(nodeType1)
      registry.register(nodeType2)
      const retrieved = registry.get("test-node")
      expect(retrieved).toBeDefined()
      expect(retrieved?.metadata.version).toBe(2)
    })

    it("should return undefined for non-existent node type", () => {
      const retrieved = registry.get("non-existent")
      expect(retrieved).toBeUndefined()
    })

    it("should return undefined for non-existent version", () => {
      const nodeType = createTestNodeType("test-node", 1)
      registry.register(nodeType)
      const retrieved = registry.get("test-node", 999)
      expect(retrieved).toBeUndefined()
    })
  })

  describe("unregistration", () => {
    it("should unregister a specific version", () => {
      const nodeType1 = createTestNodeType("test-node", 1)
      const nodeType2 = createTestNodeType("test-node", 2)
      registry.register(nodeType1)
      registry.register(nodeType2)
      registry.unregister("test-node", 1)
      expect(registry.has("test-node", 1)).toBe(false)
      expect(registry.has("test-node", 2)).toBe(true)
    })

    it("should unregister all versions when version not specified", () => {
      const nodeType1 = createTestNodeType("test-node", 1)
      const nodeType2 = createTestNodeType("test-node", 2)
      registry.register(nodeType1)
      registry.register(nodeType2)
      registry.unregister("test-node")
      expect(registry.has("test-node", 1)).toBe(false)
      expect(registry.has("test-node", 2)).toBe(false)
    })
  })

  describe("has method", () => {
    it("should return true for registered node type", () => {
      const nodeType = createTestNodeType("test-node", 1)
      registry.register(nodeType)
      expect(registry.has("test-node")).toBe(true)
      expect(registry.has("test-node", 1)).toBe(true)
    })

    it("should return false for non-existent node type", () => {
      expect(registry.has("non-existent")).toBe(false)
    })
  })
})

