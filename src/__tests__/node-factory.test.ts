import { NodeFactory } from "../core/node-factory"
import { NodeTypeRegistryImpl } from "../core/node-type-registry"
import { BaseNode } from "../core/base-node"
import type { SerializedNode } from "../interfaces"
import type { NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"

/**
 * Test node class for factory testing
 */
class TestFactoryNode extends BaseNode {
  protected async process(_context: ExecutionContext): Promise<NodeOutput> {
    return { output: { value: 100 } }
  }
}

describe("Node Factory", () => {
  let factory: NodeFactory
  let nodeTypeRegistry: NodeTypeRegistryImpl

  beforeEach(() => {
    factory = new NodeFactory()
    nodeTypeRegistry = new NodeTypeRegistryImpl()
    factory.setNodeTypeRegistry(nodeTypeRegistry)
  })

  describe("Node Creation", () => {
    test("should create node from serialized data using registered factory", () => {
      const serializedNode: SerializedNode = {
        properties: {
          id: "node-1",
          name: "test-node",
          nodeType: "test-factory",
          version: 1,
          position: [0, 0],
        },
        config: {},
        inputs: [],
        outputs: [],
      }

      factory.register("test-factory", 1, (serialized) => {
        return new TestFactoryNode(serialized.properties)
      })

      const node = factory.create(serializedNode)
      expect(node).toBeInstanceOf(TestFactoryNode)
      expect(node.properties.name).toBe("test-node")
    })

    test("should throw error when factory is not registered", () => {
      const serializedNode: SerializedNode = {
        properties: {
          id: "node-1",
          name: "test-node",
          nodeType: "unknown",
          version: 1,
          position: [0, 0],
        },
        config: {},
        inputs: [],
        outputs: [],
      }

      expect(() => {
        factory.create(serializedNode)
      }).toThrow("No factory registered")
    })

    test("should create default node when using createDefault", () => {
      const serializedNode: SerializedNode = {
        properties: {
          id: "node-1",
          name: "test-node",
          nodeType: "default",
          version: 1,
          position: [0, 0],
        },
        config: {},
        inputs: [],
        outputs: [],
      }

      const node = factory.createDefault(serializedNode)
      expect(node).toBeInstanceOf(BaseNode)
      expect(node.properties.name).toBe("test-node")
    })
  })

  describe("Versioned Node Types", () => {
    test("should create node with specific version", () => {
      const serializedNode: SerializedNode = {
        properties: {
          id: "node-1",
          name: "test-node",
          nodeType: "versioned",
          version: 2,
          position: [0, 0],
        },
        config: {},
        inputs: [],
        outputs: [],
      }

      factory.register("versioned", 1, () => {
        return new (class extends BaseNode {
          protected async process(): Promise<NodeOutput> {
            return { output: { version: 1 } }
          }
        })(serializedNode.properties)
      })

      factory.register("versioned", 2, () => {
        return new (class extends BaseNode {
          protected async process(): Promise<NodeOutput> {
            return { output: { version: 2 } }
          }
        })(serializedNode.properties)
      })

      const node = factory.create(serializedNode)
      expect(node).toBeInstanceOf(BaseNode)
      expect(node.properties.version).toBe(2)
    })

    test("should use correct factory for version", () => {
      const serializedNodeV1: SerializedNode = {
        properties: {
          id: "node-1",
          name: "test-node-v1",
          nodeType: "versioned",
          version: 1,
          position: [0, 0],
        },
        config: {},
        inputs: [],
        outputs: [],
      }

      const serializedNodeV2: SerializedNode = {
        properties: {
          id: "node-2",
          name: "test-node-v2",
          nodeType: "versioned",
          version: 2,
          position: [0, 0],
        },
        config: {},
        inputs: [],
        outputs: [],
      }

      let v1Created = false
      let v2Created = false

      factory.register("versioned", 1, () => {
        v1Created = true
        return new TestFactoryNode(serializedNodeV1.properties)
      })

      factory.register("versioned", 2, () => {
        v2Created = true
        return new TestFactoryNode(serializedNodeV2.properties)
      })

      factory.create(serializedNodeV1)
      factory.create(serializedNodeV2)

      expect(v1Created).toBe(true)
      expect(v2Created).toBe(true)
    })
  })
})

