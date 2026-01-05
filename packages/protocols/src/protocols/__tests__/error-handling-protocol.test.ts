/**
 * Tests for ErrorHandlingProtocol
 * Tests error propagation, retry integration, and error handling
 */

import { ErrorHandlingProtocolImpl, errorHandlingProtocol } from "../error-handling-impl"
import { BaseNode } from "@workflow/core"
import type { ExecutionContext, NodeOutput, NodeProperties } from "@workflow/interfaces"
import { NodeState } from "@workflow/interfaces"

/**
 * Test node implementation
 */
class TestNode extends BaseNode {
  protected async process(_context: ExecutionContext): Promise<NodeOutput> {
    return { output: [] }
  }
}

describe("ErrorHandlingProtocolImpl", () => {
  let protocol: ErrorHandlingProtocolImpl
  let node: TestNode
  let properties: NodeProperties

  beforeEach(() => {
    protocol = new ErrorHandlingProtocolImpl()
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

  describe("handleError", () => {
    it("should handle error and set node state", () => {
      const error = new Error("Test error")
      protocol.handleError(node, error)
      expect(node.state).toBe(NodeState.Failed)
      expect(node.error).toBe(error)
    })

    it("should propagate error information", () => {
      const error = new Error("Test error")
      const errorInfo = protocol.propagateError(node, error)
      expect(errorInfo.message).toBe("Test error")
      expect(errorInfo.nodeName).toBe("TestNode")
    })
  })

  describe("shouldStopExecution", () => {
    it("should stop execution by default", () => {
      const error = new Error("Test error")
      expect(protocol.shouldStopExecution(node, error)).toBe(true)
    })

    it("should continue execution if continueOnFail is enabled", () => {
      node.properties.continueOnFail = true
      const error = new Error("Test error")
      expect(protocol.shouldStopExecution(node, error)).toBe(false)
    })
  })

  describe("global instance", () => {
    it("should export global protocol instance", () => {
      expect(errorHandlingProtocol).toBeInstanceOf(ErrorHandlingProtocolImpl)
    })
  })
})

