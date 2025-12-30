import { versionCompatibilityTracker } from "../core/version-compatibility"
import { versionMigration } from "../core/version-migration"
import { NodeTypeRegistryImpl } from "../core/node-type-registry"
import type { NodeType } from "../interfaces/node-type"
import type { Node } from "../interfaces"
import { BaseNode } from "../core/base-node"
import type { ExecutionContext } from "../interfaces/execution-state"
import type { NodeOutput } from "../interfaces/node-execution-data"
import { LinkType } from "../types"

/**
 * Test node for version testing
 */
class TestNode extends BaseNode {
  constructor(properties: import("../interfaces").NodeProperties) {
    super(properties)
    this.addOutput("output", "data", LinkType.Standard)
  }

  protected async process(_context: ExecutionContext): Promise<NodeOutput> {
    return { output: { value: 1 } }
  }
}

/**
 * Creates a test node type
 */
function createNodeType(name: string, version: number): NodeType {
  return {
    metadata: {
      name,
      displayName: `${name} Node`,
      description: `Test node type ${name}`,
      version,
    },
    async run(node: Node, inputData: import("../interfaces").NodeInput): Promise<import("../interfaces").NodeOutput> {
      const instance = new TestNode(node.properties)
      if ("setup" in instance && typeof instance.setup === "function") {
        instance.setup(node.config)
      }
      const context: ExecutionContext = {
        input: inputData,
        state: {},
      }
      return await instance.run(context)
    },
  }
}

describe("Version Compatibility Tracker", () => {
  beforeEach(() => {
    // Clear compatibility matrix before each test
    // Note: In a real implementation, we'd need a reset method
  })

  test("should record compatibility", () => {
    versionCompatibilityTracker.recordCompatibility("test-node", 1, 2, true, "minor")

    const compatibility = versionCompatibilityTracker.checkCompatibility("test-node", 1, 2)

    expect(compatibility).toBeDefined()
    expect(compatibility?.compatible).toBe(true)
    expect(compatibility?.level).toBe("minor")
  })

  test("should check semantic versioning compatibility for patch", () => {
    const compatibility = versionCompatibilityTracker.checkCompatibility("test-node", 10000, 10001)

    expect(compatibility).toBeDefined()
    expect(compatibility?.compatible).toBe(true)
    expect(compatibility?.level).toBe("patch")
  })

  test("should check semantic versioning compatibility for minor", () => {
    const compatibility = versionCompatibilityTracker.checkCompatibility("test-node", 10000, 10100)

    expect(compatibility).toBeDefined()
    expect(compatibility?.compatible).toBe(true)
    expect(compatibility?.level).toBe("minor")
  })

  test("should check semantic versioning compatibility for major (breaking)", () => {
    const compatibility = versionCompatibilityTracker.checkCompatibility("test-node", 10000, 20000)

    expect(compatibility).toBeDefined()
    expect(compatibility?.compatible).toBe(false)
    expect(compatibility?.level).toBe("breaking")
    expect(compatibility?.migrationRequired).toBeDefined()
  })

  test("should check same version compatibility", () => {
    const compatibility = versionCompatibilityTracker.checkCompatibility("test-node", 10000, 10000)

    expect(compatibility).toBeDefined()
    expect(compatibility?.compatible).toBe(true)
    expect(compatibility?.level).toBe("patch")
  })

  test("should determine if migration is possible", () => {
    versionCompatibilityTracker.recordCompatibility("test-node", 1, 2, true, "minor")

    const canMigrate = versionCompatibilityTracker.canMigrate("test-node", 1, 2)

    expect(canMigrate).toBe(true)
  })

  test("should prevent migration for breaking changes", () => {
    versionCompatibilityTracker.recordCompatibility("test-node", 1, 2, false, "breaking", "Breaking change")

    const canMigrate = versionCompatibilityTracker.canMigrate("test-node", 1, 2)

    expect(canMigrate).toBe(false)
  })
})

describe("Version Migration", () => {
  let registry: NodeTypeRegistryImpl

  beforeEach(() => {
    registry = new NodeTypeRegistryImpl()
  })

  test("should migrate node to target version", () => {
    // Register node types
    registry.register(createNodeType("test", 1))
    registry.register(createNodeType("test", 2))

    const node: import("../interfaces").SerializedNode = {
      properties: {
        id: "node-1",
        name: "test-node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
        isTrigger: false,
      },
      config: { value: "test" },
      inputs: [],
      outputs: [{ name: "output", dataType: "data", linkType: LinkType.Standard }],
    }

    // Record compatibility
    versionCompatibilityTracker.recordCompatibility("test", 1, 2, true, "minor")

    const result = versionMigration.migrateNode(node, 2, registry)

    expect(result.success).toBe(true)
    expect(result.migratedNode).toBeDefined()
    expect(result.migratedNode?.properties.version).toBe(2)
  })

  test("should fail migration for incompatible versions", () => {
    registry.register(createNodeType("test", 1))
    registry.register(createNodeType("test", 2))

    const node: import("../interfaces").SerializedNode = {
      properties: {
        id: "node-1",
        name: "test-node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
        isTrigger: false,
      },
      config: {},
      inputs: [],
      outputs: [],
    }

    // Record breaking change
    versionCompatibilityTracker.recordCompatibility("test", 1, 2, false, "breaking", "Breaking change")

    const result = versionMigration.migrateNode(node, 2, registry)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  test("should skip migration for same version", () => {
    registry.register(createNodeType("test", 1))

    const node: import("../interfaces").SerializedNode = {
      properties: {
        id: "node-1",
        name: "test-node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
        isTrigger: false,
      },
      config: {},
      inputs: [],
      outputs: [],
    }

    const result = versionMigration.migrateNode(node, 1, registry)

    expect(result.success).toBe(true)
    expect(result.messages.some((m) => m.includes("already at version"))).toBe(true)
  })

  test("should migrate multiple nodes", () => {
    registry.register(createNodeType("test", 1))
    registry.register(createNodeType("test", 2))

    const nodes: import("../interfaces").SerializedNode[] = [
      {
        properties: {
          id: "node-1",
          name: "node1",
          nodeType: "test",
          version: 1,
          position: [0, 0],
          isTrigger: false,
        },
        config: {},
        inputs: [],
        outputs: [],
      },
      {
        properties: {
          id: "node-2",
          name: "node2",
          nodeType: "test",
          version: 1,
          position: [0, 0],
          isTrigger: false,
        },
        config: {},
        inputs: [],
        outputs: [],
      },
    ]

    versionCompatibilityTracker.recordCompatibility("test", 1, 2, true, "minor")

    const results = versionMigration.migrateNodes(nodes, 2, registry)

    expect(results.size).toBe(2)
    expect(results.get("node1")?.success).toBe(true)
    expect(results.get("node2")?.success).toBe(true)
  })

  test("should migrate to latest version", () => {
    registry.register(createNodeType("test", 1))
    registry.register(createNodeType("test", 2))
    registry.register(createNodeType("test", 3))

    const node: import("../interfaces").SerializedNode = {
      properties: {
        id: "node-1",
        name: "test-node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
        isTrigger: false,
      },
      config: {},
      inputs: [],
      outputs: [],
    }

    versionCompatibilityTracker.recordCompatibility("test", 1, 3, true, "minor")

    const results = versionMigration.migrateToLatest([node], registry)

    expect(results.size).toBe(1)
    const result = results.get("test-node")
    expect(result?.success).toBe(true)
    expect(result?.migratedNode?.properties.version).toBe(3)
  })
})

