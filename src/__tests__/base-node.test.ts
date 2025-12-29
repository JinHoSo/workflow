import { BaseNode } from "../core/base-node"
import { NodeState } from "../types"
import type { NodeProperties, NodeOutput, DataRecord } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"

class TestNode extends BaseNode {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    // Map input data to output ports
    const output: NodeOutput = {}
    for (const portName in context.input) {
      // Use the same port name for output, or default to "output"
      const outputPortName = this.outputs.find((p) => p.name === portName)?.name || this.outputs[0]?.name || "output"
      output[outputPortName] = context.input[portName]
    }
    return output
  }
}

describe("WorkflowNodeBase", () => {
  let node: TestNode
  let properties: NodeProperties

  beforeEach(() => {
    properties = {
      id: "test-1",
      name: "test-node",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    }
    node = new TestNode(properties)
  })

  test("should initialize with Idle state", () => {
    expect(node.state).toBe(NodeState.Idle)
  })

  test("should add input port", () => {
    node.addInput("input1", "data")
    expect(node.inputs).toHaveLength(1)
    expect(node.inputs[0].name).toBe("input1")
  })

  test("should add output port", () => {
    node.addOutput("output1", "data")
    expect(node.outputs).toHaveLength(1)
    expect(node.outputs[0].name).toBe("output1")
  })

  test("should transition from Idle to Ready", () => {
    node.setup({ test: "value" })
    expect(node.state).toBe(NodeState.Ready)
  })

  test("should run node", async () => {
    node.addInput("input", "data")
    node.addOutput("output", "data")
    node.setup({})
    const context: ExecutionContext = { input: { input: { test: "value" } }, state: {} }
    const result = await node.run(context)
    expect(node.state).toBe(NodeState.Completed)
    expect(result).toHaveProperty("output")
    const output = Array.isArray(result.output) ? (result.output as DataRecord[])[0] : (result.output as DataRecord)
    expect(output.test).toBe("value")
  })

  test("should handle errors during execution", async () => {
    class ErrorNode extends BaseNode {
      protected async process(): Promise<NodeOutput> {
        throw new Error("Test error")
      }
    }

    const errorNode = new ErrorNode(properties)
    errorNode.setup({})

    await expect(errorNode.run({ input: {}, state: {} })).rejects.toThrow("Test error")
    expect(errorNode.state).toBe(NodeState.Failed)
    expect(errorNode.error).toBeDefined()
  })

  test("should reset node", () => {
    node.setup({ test: "value" })
    node.reset()
    expect(node.state).toBe(NodeState.Idle)
    expect(node.config).toEqual({})
  })

  test("should set and remove annotation", () => {
    node.setAnnotation("Test annotation")
    expect(node.annotation).toBe("Test annotation")
    node.removeAnnotation()
    expect(node.annotation).toBeUndefined()
  })

  test("should get result by port name", async () => {
    node.addInput("input", "data")
    node.addOutput("output", "data")
    node.addOutput("result", "data")
    node.setup({})
    const context: ExecutionContext = { input: { input: { test: "value" } }, state: {} }
    await node.run(context)
    const outputResult = node.getResult("output")
    const output = Array.isArray(outputResult) ? outputResult[0] : outputResult
    expect(output.test).toBe("value")
  })

  test("should get all results as port name based object", async () => {
    node.addInput("input", "data")
    node.addOutput("output", "data")
    node.setup({})
    const context: ExecutionContext = { input: { input: { test: "value" } }, state: {} }
    await node.run(context)
    const allResults = node.getAllResults()
    expect(allResults).toHaveProperty("output")
    const output = Array.isArray(allResults.output) ? (allResults.output as DataRecord[])[0] : (allResults.output as DataRecord)
    expect(output.test).toBe("value")
  })

  test("should handle empty input data", async () => {
    node.addInput("input", "data")
    node.addOutput("output", "data")
    node.setup({})
    const context: ExecutionContext = { input: {}, state: {} }
    await node.run(context)
    expect(node.state).toBe(NodeState.Completed)
    const result = node.getAllResults()
    expect(result).toEqual({})
  })
})
