/**
 * Tests for BaseNode class
 * Tests state management, port management, execution lifecycle, and configuration
 */

import { BaseNode } from "../base-node"
import type { NodeProperties, NodePropertiesInput, ExecutionContext, NodeOutput } from "@workflow/interfaces"
import { NodeState, LinkType } from "@workflow/interfaces"

/**
 * Test node implementation for testing BaseNode functionality
 */
class TestNode extends BaseNode {
  /** Node type identifier for this class */
  static readonly nodeType = "test-node"

  constructor(properties: NodePropertiesInput) {
    super({
      ...properties,
      nodeType: TestNode.nodeType,
    })
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const inputData = context.input["input"] || []
    const normalized = Array.isArray(inputData) ? inputData : [inputData]
    return {
      output: normalized.map((item) => ({
        ...item,
        processed: true,
      })),
    }
  }
}

describe("BaseNode", () => {
  let node: TestNode
  let properties: NodeProperties

  beforeEach(() => {
    // nodeType is automatically set from class definition, so we can omit it
    properties = {
      id: "test-node-1",
      name: "TestNode",
      version: 1,
      position: [0, 0] as [number, number],
      // isTrigger defaults to false if not provided
    } as NodeProperties
    node = new TestNode(properties)
  })

  describe("constructor", () => {
    it("should automatically set nodeType from class definition", () => {
      expect(node.properties.nodeType).toBe("test-node")
    })

    it("should override user-provided nodeType with class definition", () => {
      const nodeWithWrongType = new TestNode({
        ...properties,
        nodeType: "wrong-type",
      })
      expect(nodeWithWrongType.properties.nodeType).toBe("test-node")
    })

    it("should default isTrigger to false when not provided", () => {
      const nodeWithoutTrigger = new TestNode({
        ...properties,
      })
      expect(nodeWithoutTrigger.properties.isTrigger).toBe(false)
    })

    it("should initialize node with provided properties", () => {
      expect(node.properties.id).toBe(properties.id)
      expect(node.properties.name).toBe(properties.name)
      expect(node.properties.nodeType).toBe("test-node") // Set by class
      expect(node.properties.isTrigger).toBe(false) // Default value
      expect(node.state).toBe(NodeState.Idle)
      expect(node.config).toEqual({})
      expect(node.inputs).toEqual([])
      expect(node.outputs).toEqual([])
    })

    it("should initialize with empty inputs and outputs", () => {
      expect(node.inputs).toHaveLength(0)
      expect(node.outputs).toHaveLength(0)
    })
  })

  describe("port management", () => {
    it("should add input port", () => {
      node.addInput("input", "string")
      expect(node.inputs).toHaveLength(1)
      expect(node.inputs[0]).toEqual({
        name: "input",
        dataType: "string",
        linkType: LinkType.Standard,
      })
    })

    it("should add output port", () => {
      node.addOutput("output", "string")
      expect(node.outputs).toHaveLength(1)
      expect(node.outputs[0]).toEqual({
        name: "output",
        dataType: "string",
        linkType: LinkType.Standard,
      })
    })

    it("should add input port with custom link type", () => {
      node.addInput("input", "string", LinkType.Standard)
      expect(node.inputs[0].linkType).toBe(LinkType.Standard)
    })

    it("should add multiple input ports", () => {
      node.addInput("input1", "string")
      node.addInput("input2", "number")
      expect(node.inputs).toHaveLength(2)
    })

    it("should add multiple output ports", () => {
      node.addOutput("output1", "string")
      node.addOutput("output2", "number")
      expect(node.outputs).toHaveLength(2)
    })
  })

  describe("state management", () => {
    it("should start in Idle state", () => {
      expect(node.getState()).toBe(NodeState.Idle)
    })

    it("should transition from Idle to Running", () => {
      node.setState(NodeState.Running)
      expect(node.getState()).toBe(NodeState.Running)
    })

    it("should transition from Running to Completed", () => {
      node.setState(NodeState.Running)
      node.setState(NodeState.Completed)
      expect(node.getState()).toBe(NodeState.Completed)
    })

    it("should transition from Running to Failed", () => {
      node.setState(NodeState.Running)
      node.setState(NodeState.Failed)
      expect(node.getState()).toBe(NodeState.Failed)
      expect(node.error).toBeDefined()
    })

    it("should transition from Completed to Idle", () => {
      node.setState(NodeState.Running)
      node.setState(NodeState.Completed)
      node.setState(NodeState.Idle)
      expect(node.getState()).toBe(NodeState.Idle)
    })

    it("should transition from Failed to Idle", () => {
      node.setState(NodeState.Running)
      node.setState(NodeState.Failed)
      node.setState(NodeState.Idle)
      expect(node.getState()).toBe(NodeState.Idle)
    })

    it("should throw error on invalid state transition", () => {
      expect(() => {
        node.setState(NodeState.Completed)
      }).toThrow("Invalid state transition")
    })

    it("should throw error when transitioning from Idle to Failed", () => {
      expect(() => {
        node.setState(NodeState.Failed)
      }).toThrow("Invalid state transition")
    })
  })

  describe("configuration", () => {
    it("should set configuration", () => {
      const config = { key: "value", number: 42 }
      node.setup(config)
      expect(node.config).toEqual(config)
    })

    it("should merge configuration", () => {
      node.setup({ key1: "value1" })
      node.setup({ key2: "value2" })
      expect(node.config).toEqual({ key1: "value1", key2: "value2" })
    })

    it("should preserve state when setting configuration", () => {
      node.setup({ key: "value" })
      expect(node.getState()).toBe(NodeState.Idle)
    })
  })

  describe("result data management", () => {
    it("should return empty array for non-existent output port", () => {
      const result = node.getResult("nonexistent")
      expect(result).toEqual([])
    })

    it("should return result data for output port", async () => {
      node.addInput("input", "object")
      node.addOutput("output", "object")
      const context: ExecutionContext = {
        input: {
          input: [{ value: "test" }],
        },
        state: {},
      }
      await node.run(context)
      const result = node.getResult("output")
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      if (Array.isArray(result) && result.length > 0) {
        expect(result[0]).toHaveProperty("processed", true)
      }
    })

    it("should return all results", async () => {
      node.addInput("input", "object")
      node.addOutput("output", "object")
      const context: ExecutionContext = {
        input: {
          input: [{ value: "test" }],
        },
        state: {},
      }
      await node.run(context)
      const allResults = node.getAllResults()
      expect(allResults).toHaveProperty("output")
    })
  })

  describe("execution lifecycle", () => {
    it("should execute node successfully", async () => {
      node.addInput("input", "object")
      node.addOutput("output", "object")
      const context: ExecutionContext = {
        input: {
          input: [{ value: "test" }],
        },
        state: {},
      }
      const result = await node.run(context)
      expect(node.getState()).toBe(NodeState.Completed)
      expect(result).toHaveProperty("output")
    })

    it("should throw error if node is not in Idle state", async () => {
      node.setState(NodeState.Running)
      const context: ExecutionContext = { input: {}, state: {} }
      await expect(node.run(context)).rejects.toThrow("Cannot run node")
    })

    it("should transition to Failed state on error", async () => {
      class ErrorNode extends BaseNode {
        static readonly nodeType = "error-node"

        constructor(props: NodePropertiesInput) {
          super({
            ...props,
            nodeType: ErrorNode.nodeType,
          })
        }

        protected async process(_context: ExecutionContext): Promise<NodeOutput> {
          throw new Error("Test error")
        }
      }
      const errorNode = new ErrorNode(properties)
      const context: ExecutionContext = { input: {}, state: {} }
      await expect(errorNode.run(context)).rejects.toThrow("Test error")
      expect(errorNode.getState()).toBe(NodeState.Failed)
      expect(errorNode.error).toBeDefined()
    })

    it("should set error when execution fails", async () => {
      class ErrorNode extends BaseNode {
        static readonly nodeType = "error-node"

        constructor(props: NodePropertiesInput) {
          super({
            ...props,
            nodeType: ErrorNode.nodeType,
          })
        }

        protected async process(_context: ExecutionContext): Promise<NodeOutput> {
          throw new Error("Test error")
        }
      }
      const errorNode = new ErrorNode(properties)
      const context: ExecutionContext = { input: {}, state: {} }
      try {
        await errorNode.run(context)
      } catch {
        // Expected to throw
      }
      expect(errorNode.error).toBeDefined()
      expect(errorNode.error?.message).toBe("Test error")
    })
  })

  describe("reset", () => {
    it("should reset node to initial state", async () => {
      node.addInput("input", "object")
      node.addOutput("output", "object")
      const context: ExecutionContext = {
        input: {
          input: [{ value: "test" }],
        },
        state: {},
      }
      await node.run(context)
      node.reset()
      expect(node.getState()).toBe(NodeState.Idle)
      expect(node.error).toBeUndefined()
      expect(node.getAllResults()).toEqual({})
    })

    it("should preserve configuration after reset", () => {
      node.setup({ key: "value" })
      node.reset()
      expect(node.config).toEqual({ key: "value" })
    })
  })

  describe("stop", () => {
    it("should reset state from Completed to Idle", () => {
      node.setState(NodeState.Running)
      node.setState(NodeState.Completed)
      node.stop()
      expect(node.getState()).toBe(NodeState.Idle)
      expect(node.error).toBeUndefined()
    })

    it("should reset state from Failed to Idle", () => {
      node.setState(NodeState.Running)
      node.setState(NodeState.Failed)
      node.stop()
      expect(node.getState()).toBe(NodeState.Idle)
      expect(node.error).toBeUndefined()
    })

    it("should not change state if node is Running", () => {
      node.setState(NodeState.Running)
      node.stop()
      expect(node.getState()).toBe(NodeState.Running)
    })
  })

  describe("annotation", () => {
    it("should set annotation", () => {
      node.setAnnotation("Test annotation")
      expect(node.annotation).toBe("Test annotation")
    })

    it("should remove annotation", () => {
      node.setAnnotation("Test annotation")
      node.removeAnnotation()
      expect(node.annotation).toBeUndefined()
    })
  })
})

