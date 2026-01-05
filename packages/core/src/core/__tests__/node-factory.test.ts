/**
 * Tests for NodeFactory class
 * Tests node instantiation from serialized data
 */

import { NodeFactory, nodeFactory } from "../node-factory"
import { BaseNode } from "../base-node"
import type { SerializedNode, ExecutionContext, NodeOutput } from "@workflow/interfaces"

/**
 * Test node implementation
 */
class TestNode extends BaseNode {
  protected async process(_context: ExecutionContext): Promise<NodeOutput> {
    return { output: [] }
  }
}

describe("NodeFactory", () => {
  let factory: NodeFactory
  let serializedNode: SerializedNode

  beforeEach(() => {
    factory = new NodeFactory()
    serializedNode = {
      properties: {
        id: "test-node-1",
        name: "TestNode",
        nodeType: "test-node",
        version: 1,
        position: [0, 0],
      },
      config: {},
      inputs: [],
      outputs: [],
    }
  })

  describe("registration", () => {
    it("should register factory function", () => {
      factory.register("test-node", 1, (serialized) => {
        return new TestNode(serialized.properties)
      })
      const node = factory.create(serializedNode)
      expect(node).toBeInstanceOf(TestNode)
    })

    it("should register multiple versions", () => {
      factory.register("test-node", 1, (serialized) => {
        return new TestNode(serialized.properties)
      })
      factory.register("test-node", 2, (serialized) => {
        return new TestNode(serialized.properties)
      })
      const node1 = factory.create({ ...serializedNode, properties: { ...serializedNode.properties, version: 1 } })
      const node2 = factory.create({ ...serializedNode, properties: { ...serializedNode.properties, version: 2 } })
      expect(node1).toBeInstanceOf(TestNode)
      expect(node2).toBeInstanceOf(TestNode)
    })
  })

  describe("node creation", () => {
    it("should create node using registered factory", () => {
      factory.register("test-node", 1, (serialized) => {
        return new TestNode(serialized.properties)
      })
      const node = factory.create(serializedNode)
      expect(node).toBeDefined()
      expect(node.properties.name).toBe("TestNode")
    })

    it("should throw error when factory not registered", () => {
      expect(() => {
        factory.create(serializedNode)
      }).toThrow("No factory registered")
    })

    it("should create default node", () => {
      const node = factory.createDefault(serializedNode)
      expect(node).toBeInstanceOf(BaseNode)
      expect(node.properties.name).toBe("TestNode")
    })
  })

  describe("node type registry integration", () => {
    it("should set node type registry", () => {
      const registry = {} as unknown
      factory.setNodeTypeRegistry(registry as never)
      expect(factory).toBeDefined()
    })
  })

  describe("global factory", () => {
    it("should export global factory instance", () => {
      expect(nodeFactory).toBeInstanceOf(NodeFactory)
    })
  })
})

