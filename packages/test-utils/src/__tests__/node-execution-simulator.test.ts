/**
 * Tests for node execution simulator
 */

import { BaseNode } from "@workflow/core"
import type { NodeOutput, DataRecord, ExecutionContext } from "@workflow/interfaces"
import { NodeState } from "@workflow/interfaces"
import {
  simulateNodeExecution,
  createMockInputData,
  createMockInputs,
  validateNodeOutput,
  validateStateTransition,
  createTestNode,
} from "../node-execution-simulator"

/**
 * Test node implementation
 */
class TestNode extends BaseNode {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const inputData = context.input["input"] || []
    return {
      output: inputData,
    }
  }
}

describe("node-execution-simulator", () => {
  describe("simulateNodeExecution", () => {
    it("should execute a node successfully", async () => {
      const node = new TestNode({
        id: "test-1",
        name: "TestNode",
        nodeType: "test",
        version: 1,
        position: [0, 0],
        isTrigger: false,
      })

      const result = await simulateNodeExecution(node, {
        inputData: {
          input: [{ value: "test" }],
        },
      })

      expect(result.state).toBe(NodeState.Completed)
      expect(result.output).toHaveProperty("output")
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    it("should handle node errors", async () => {
      class ErrorNode extends BaseNode {
        protected async process(_context: ExecutionContext): Promise<NodeOutput> {
          throw new Error("Test error")
        }
      }

      const node = new ErrorNode({
        id: "error-1",
        name: "ErrorNode",
        nodeType: "error",
        version: 1,
        position: [0, 0],
        isTrigger: false,
      })

      const result = await simulateNodeExecution(node)

      expect(result.state).toBe(NodeState.Failed)
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe("Test error")
    })

    it("should configure node before execution", async () => {
      const node = new TestNode({
        id: "test-2",
        name: "TestNode2",
        nodeType: "test",
        version: 1,
        position: [0, 0],
        isTrigger: false,
      })

      await simulateNodeExecution(node, {
        config: {
          testConfig: "value",
        },
      })

      expect(node.config).toHaveProperty("testConfig")
    })
  })

  describe("createMockInputData", () => {
    it("should create mock input data for single port", () => {
      const data = createMockInputData("input", [{ value: "test" }])

      expect(data).toHaveProperty("input")
      expect(data.input).toEqual([{ value: "test" }])
    })

    it("should handle single record", () => {
      const data = createMockInputData("input", { value: "test" })

      expect(data.input).toEqual({ value: "test" })
    })
  })

  describe("createMockInputs", () => {
    it("should create mock inputs for multiple ports", () => {
      const inputs = createMockInputs({
        input1: [{ value: "test1" }],
        input2: [{ value: "test2" }],
      })

      expect(inputs).toHaveProperty("input1")
      expect(inputs).toHaveProperty("input2")
    })
  })

  describe("validateNodeOutput", () => {
    it("should validate correct output structure", () => {
      const output: NodeOutput = {
        output: [{ value: "test" }],
        error: [],
      }

      const result = validateNodeOutput(output, ["output", "error"])

      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it("should detect missing output ports", () => {
      const output: NodeOutput = {
        output: [{ value: "test" }],
      }

      const result = validateNodeOutput(output, ["output", "error"])

      expect(result.valid).toBe(false)
      expect(result.errors).toContain("Expected output port 'error' not found")
    })

    it("should detect invalid output types", () => {
      const output: NodeOutput = {
        output: "invalid" as unknown as DataRecord[],
      }

      const result = validateNodeOutput(output, ["output"])

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe("validateStateTransition", () => {
    it("should validate correct state transition", () => {
      const result = validateStateTransition(NodeState.Idle, NodeState.Running, [
        NodeState.Running,
      ])

      expect(result.valid).toBe(true)
    })

    it("should detect invalid state transition", () => {
      const result = validateStateTransition(NodeState.Idle, NodeState.Failed, [NodeState.Running])

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe("createTestNode", () => {
    it("should create a test node instance", () => {
      const node = createTestNode(TestNode, {
        id: "custom-id",
        name: "CustomNode",
      })

      expect(node).toBeInstanceOf(TestNode)
      expect(node.properties.id).toBe("custom-id")
      expect(node.properties.name).toBe("CustomNode")
    })

    it("should use default properties when not provided", () => {
      const node = createTestNode(TestNode)

      expect(node.properties.id).toBe("test-node-1")
      expect(node.properties.name).toBe("TestNode")
      expect(node.properties.nodeType).toBe("test-node")
    })
  })
})

