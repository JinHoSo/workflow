/**
 * Tests for ExecutionProtocol
 * Tests execution flow, state transitions, and node validation
 */

import { ExecutionProtocolImpl, executionProtocol } from "../execution-impl"
import { BaseNode } from "@workflow/core"
import type { ExecutionContext, NodeOutput, NodeProperties } from "@workflow/interfaces"
import { NodeState } from "@workflow/interfaces"

/**
 * Test node implementation
 */
class TestNode extends BaseNode {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    return { output: context.input["input"] || [] }
  }
}

describe("ExecutionProtocolImpl", () => {
  let protocol: ExecutionProtocolImpl
  let node: TestNode
  let properties: NodeProperties

  beforeEach(() => {
    protocol = new ExecutionProtocolImpl()
    properties = {
      id: "test-1",
      name: "TestNode",
      nodeType: "test",
      version: 1,
      position: [0, 0],
      isTrigger: false,
    }
    node = new TestNode(properties)
  })

  describe("validateExecution", () => {
    it("should validate node in Idle state", () => {
      expect(protocol.validateExecution(node)).toBe(true)
    })

    it("should reject node not in Idle state", () => {
      node.setState(NodeState.Running)
      expect(protocol.validateExecution(node)).toBe(false)
    })

    it("should reject disabled node", () => {
      node.properties.disabled = true
      expect(protocol.validateExecution(node)).toBe(false)
    })
  })

  describe("executeNode", () => {
    it("should execute node successfully", async () => {
      node.addInput("input", "object")
      node.addOutput("output", "object")
      const context = {
        node,
        inputData: { input: [{ value: "test" }] },
        workflowId: "test-workflow",
        state: {},
      }
      const result = await protocol.executeNode(context)
      expect(result).toHaveProperty("output")
    })

    it("should throw error for invalid node", async () => {
      node.setState(NodeState.Running)
      const context = {
        node,
        inputData: {},
        workflowId: "test-workflow",
        state: {},
      }
      await expect(protocol.executeNode(context)).rejects.toThrow("is not ready for execution")
    })
  })

  describe("global instance", () => {
    it("should export global protocol instance", () => {
      expect(executionProtocol).toBeInstanceOf(ExecutionProtocolImpl)
    })
  })
})

