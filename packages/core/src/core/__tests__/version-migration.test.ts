/**
 * Tests for VersionMigration
 * Tests node version migration logic
 */

import { VersionMigration, versionMigration } from "../version-migration"
import { versionCompatibilityTracker } from "../version-compatibility"
import { NodeTypeRegistryImpl } from "../node-type-registry"
import type { SerializedNode, NodeType } from "@workflow/interfaces"

/**
 * Creates a test node type
 */
function createTestNodeType(name: string, version: number): NodeType {
  return {
    metadata: {
      name,
      displayName: `${name} Node`,
      description: `Test node type ${name}`,
      version,
    },
    async run(_node, _inputData) {
      return { output: [] }
    },
  }
}

describe("VersionMigration", () => {
  let migration: VersionMigration
  let registry: NodeTypeRegistryImpl
  let serializedNode: SerializedNode

  beforeEach(() => {
    migration = new VersionMigration()
    registry = new NodeTypeRegistryImpl()
    // Clear compatibility tracker before each test
    // Note: versionCompatibilityTracker is a global instance
    serializedNode = {
      properties: {
        id: "test-node-1",
        name: "TestNode",
        nodeType: "test-node",
        version: 1,
        position: [0, 0],
      },
      config: { key: "value" },
      inputs: [],
      outputs: [],
    }
  })

  describe("migrateNode", () => {
    it("should return success when node is already at target version", () => {
      registry.register(createTestNodeType("test-node", 1))
      const result = migration.migrateNode(serializedNode, 1, registry)
      expect(result.success).toBe(true)
      expect(result.messages.length).toBeGreaterThan(0)
    })

    it("should migrate node to target version", () => {
      registry.register(createTestNodeType("test-node", 1))
      registry.register(createTestNodeType("test-node", 2))
      versionCompatibilityTracker.recordCompatibility("test-node", 1, 2, true, "minor")
      const result = migration.migrateNode(serializedNode, 2, registry)
      expect(result.success).toBe(true)
      expect(result.migratedNode).toBeDefined()
      expect(result.migratedNode?.properties.version).toBe(2)
    })

    it("should return error when target node type not found", () => {
      registry.register(createTestNodeType("test-node", 1))
      const result = migration.migrateNode(serializedNode, 2, registry)
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it("should return error when migration not possible", () => {
      registry.register(createTestNodeType("test-node", 1))
      registry.register(createTestNodeType("test-node", 2))
      versionCompatibilityTracker.recordCompatibility("test-node", 1, 2, false, "breaking", "Cannot migrate")
      const result = migration.migrateNode(serializedNode, 2, registry)
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it("should preserve node configuration during migration", () => {
      registry.register(createTestNodeType("test-node", 1))
      registry.register(createTestNodeType("test-node", 2))
      versionCompatibilityTracker.recordCompatibility("test-node", 1, 2, true, "minor")
      const result = migration.migrateNode(serializedNode, 2, registry)
      expect(result.migratedNode?.config).toEqual({ key: "value" })
    })
  })

  describe("migrateNodes", () => {
    it("should migrate multiple nodes", () => {
      registry.register(createTestNodeType("test-node", 1))
      registry.register(createTestNodeType("test-node", 2))
      versionCompatibilityTracker.recordCompatibility("test-node", 1, 2, true, "minor")
      const nodes: SerializedNode[] = [
        serializedNode,
        {
          ...serializedNode,
          properties: { ...serializedNode.properties, name: "TestNode2", id: "test-node-2" },
        },
      ]
      const results = migration.migrateNodes(nodes, 2, registry)
      expect(results.size).toBe(2)
      expect(results.get("TestNode")?.success).toBe(true)
      expect(results.get("TestNode2")?.success).toBe(true)
    })
  })

  describe("migrateToLatest", () => {
    it("should migrate nodes to latest version", () => {
      registry.register(createTestNodeType("test-node", 1))
      registry.register(createTestNodeType("test-node", 2))
      versionCompatibilityTracker.recordCompatibility("test-node", 1, 2, true, "minor")
      const nodes: SerializedNode[] = [serializedNode]
      const results = migration.migrateToLatest(nodes, registry)
      expect(results.get("TestNode")?.success).toBe(true)
      expect(results.get("TestNode")?.migratedNode?.properties.version).toBe(2)
    })

    it("should return error when node type not found", () => {
      const nodes: SerializedNode[] = [serializedNode]
      const results = migration.migrateToLatest(nodes, registry)
      expect(results.get("TestNode")?.success).toBe(false)
      expect(results.get("TestNode")?.errors.length).toBeGreaterThan(0)
    })
  })

  describe("global instance", () => {
    it("should export global migration instance", () => {
      expect(versionMigration).toBeInstanceOf(VersionMigration)
    })
  })
})

