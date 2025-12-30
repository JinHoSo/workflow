import { BaseNode } from "../core/base-node"
import { protocolValidator } from "../protocols/protocol-validator"
import { executionProtocol } from "../protocols/execution-impl"
import { dataFlowProtocol } from "../protocols/data-flow-impl"
import { errorHandlingProtocol } from "../protocols/error-handling-impl"
import type { ExecutionContext } from "../interfaces/execution-state"
import type { NodeOutput } from "../interfaces/node-execution-data"
import type { Node } from "../interfaces"
import { NodeState } from "../types"
import { LinkType } from "../types"

/**
 * Test node that complies with all protocols
 */
class CompliantNode extends BaseNode {
  constructor(properties: import("../interfaces").NodeProperties) {
    super(properties)
    this.addInput("input", "data", LinkType.Standard)
    this.addOutput("output", "data", LinkType.Standard)
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    return { output: context.input.input || {} }
  }
}

/**
 * Test node that doesn't extend BaseNode (non-compliant)
 */
class NonCompliantNode implements Node {
  properties: import("../interfaces").NodeProperties
  state: NodeState = NodeState.Idle
  config: import("../interfaces").NodeConfiguration = {}
  inputs: import("../interfaces").InputPort[] = []
  outputs: import("../interfaces").OutputPort[] = []
  error?: Error

  constructor(properties: import("../interfaces").NodeProperties) {
    this.properties = properties
  }
}

describe("Protocol Validator", () => {
  describe("Execution Protocol Compliance", () => {
    test("should validate compliant node", () => {
      const node = new CompliantNode({
        id: "node-1",
        name: "compliant-node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      const result = protocolValidator.validateExecutionCompliance(node, executionProtocol)

      expect(result.compliant).toBe(true)
      expect(result.issues.length).toBe(0)
    })

    test("should detect non-BaseNode instance", () => {
      const node = new NonCompliantNode({
        id: "node-1",
        name: "non-compliant-node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      const result = protocolValidator.validateExecutionCompliance(node, executionProtocol)

      expect(result.compliant).toBe(false)
      expect(result.issues.some((i) => i.severity === "error")).toBe(true)
      expect(result.issues.some((i) => i.message.includes("BaseNode"))).toBe(true)
    })

    test("should detect node not in Idle state", () => {
      const node = new CompliantNode({
        id: "node-1",
        name: "node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      node.setState(NodeState.Running)

      const result = protocolValidator.validateExecutionCompliance(node, executionProtocol)

      expect(result.compliant).toBe(false)
      expect(result.issues.some((i) => i.message.includes("Idle state"))).toBe(true)
    })

    test("should warn about disabled node", () => {
      const node = new CompliantNode({
        id: "node-1",
        name: "node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
        disabled: true,
      })

      const result = protocolValidator.validateExecutionCompliance(node, executionProtocol)

      expect(result.issues.some((i) => i.severity === "warning" && i.message.includes("disabled"))).toBe(true)
    })
  })

  describe("Data Flow Protocol Compliance", () => {
    test("should validate compliant node with ports", () => {
      const node = new CompliantNode({
        id: "node-1",
        name: "node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      const result = protocolValidator.validateDataFlowCompliance(node, dataFlowProtocol)

      expect(result.compliant).toBe(true)
      expect(result.issues.length).toBe(0)
    })

    test("should warn about node without input ports (non-trigger)", () => {
      const node = new CompliantNode({
        id: "node-1",
        name: "node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      // Remove input ports
      node.inputs = []

      const result = protocolValidator.validateDataFlowCompliance(node, dataFlowProtocol)

      expect(result.issues.some((i) => i.severity === "warning" && i.message.includes("input ports"))).toBe(true)
    })

    test("should error about node without output ports", () => {
      const node = new CompliantNode({
        id: "node-1",
        name: "node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      // Remove output ports
      node.outputs = []

      const result = protocolValidator.validateDataFlowCompliance(node, dataFlowProtocol)

      expect(result.compliant).toBe(false)
      expect(result.issues.some((i) => i.severity === "error" && i.message.includes("output ports"))).toBe(true)
    })
  })

  describe("Error Handling Protocol Compliance", () => {
    test("should validate compliant node", () => {
      const node = new CompliantNode({
        id: "node-1",
        name: "node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
        continueOnFail: false, // Add continueOnFail to make it fully compliant
      })

      const result = protocolValidator.validateErrorHandlingCompliance(node, errorHandlingProtocol)

      expect(result.compliant).toBe(true)
      expect(result.issues.filter((i) => i.severity === "error").length).toBe(0)
    })

    test("should warn about missing continueOnFail property", () => {
      const node = new CompliantNode({
        id: "node-1",
        name: "node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      // Remove continueOnFail from properties
      const props = { ...node.properties }
      delete (props as { continueOnFail?: boolean }).continueOnFail
      node.properties = props

      const result = protocolValidator.validateErrorHandlingCompliance(node, errorHandlingProtocol)

      expect(result.issues.some((i) => i.severity === "warning" && i.message.includes("continueOnFail"))).toBe(true)
    })
  })

  describe("All Protocols Validation", () => {
    test("should validate fully compliant node", () => {
      const node = new CompliantNode({
        id: "node-1",
        name: "node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
        continueOnFail: false, // Add continueOnFail to make it fully compliant
      })

      const result = protocolValidator.validateAllProtocols(
        node,
        executionProtocol,
        dataFlowProtocol,
        errorHandlingProtocol,
      )

      expect(result.compliant).toBe(true)
      expect(result.issues.filter((i) => i.severity === "error").length).toBe(0)
    })

    test("should collect all issues from all protocols", () => {
      const node = new NonCompliantNode({
        id: "node-1",
        name: "node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      const result = protocolValidator.validateAllProtocols(
        node,
        executionProtocol,
        dataFlowProtocol,
        errorHandlingProtocol,
      )

      expect(result.compliant).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues.some((i) => i.protocol === "execution")).toBe(true)
    })
  })
})

