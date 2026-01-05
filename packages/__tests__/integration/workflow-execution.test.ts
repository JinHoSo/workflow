/**
 * Integration tests for end-to-end workflow execution
 * Tests complete workflow execution from trigger to output
 */

import { Workflow } from "@workflow/core"
import { ExecutionEngine } from "@workflow/execution"
import { BaseNode } from "@workflow/core"
import type { NodePropertiesInput, ExecutionContext, NodeOutput } from "@workflow/interfaces"
import { NodeState, WorkflowState } from "@workflow/interfaces"

/**
 * Test node implementation
 */
class TestNode extends BaseNode {
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

/**
 * Test trigger implementation
 */
class TestTrigger extends BaseNode {
  static readonly nodeType = "test-trigger"

  constructor(properties: NodePropertiesInput) {
    super({
      ...properties,
      nodeType: TestTrigger.nodeType,
      isTrigger: true,
    })
  }

  protected async process(_context: ExecutionContext): Promise<NodeOutput> {
    return { output: [{ value: "triggered" }] }
  }
}

describe("Workflow Execution Integration", () => {
  it("should execute complete workflow from trigger to output", async () => {
    const workflow = new Workflow("integration-test")
    // nodeType is automatically set from class definition, so we can omit it
    const trigger = new TestTrigger({
      id: "trigger-1",
      name: "Trigger",
      version: 1,
      position: [0, 0],
    })
    trigger.addOutput("output", "object")

    const node1 = new TestNode({
      id: "node-1",
      name: "Node1",
      nodeType: "test-node",
      version: 1,
      position: [100, 0],
    })
    node1.addInput("input", "object")
    node1.addOutput("output", "object")

    workflow.addNode(trigger)
    workflow.addNode(node1)
    workflow.linkNodes("Trigger", "output", "Node1", "input")

    const engine = new ExecutionEngine(workflow)
    await trigger.run({ input: {}, state: {} })
    trigger.setState(NodeState.Completed)

    await engine.execute("Trigger")

    expect(workflow.state).toBe(WorkflowState.Completed)
    expect(node1.getState()).toBe(NodeState.Completed)
  })

  it("should handle data flow through multiple nodes", async () => {
    const workflow = new Workflow("integration-test-2")
    const trigger = new TestTrigger({
      id: "trigger-1",
      name: "Trigger",
      nodeType: "test-trigger",
      version: 1,
      position: [0, 0],
    })
    trigger.addOutput("output", "object")

    const node1 = new TestNode({
      id: "node-1",
      name: "Node1",
      nodeType: "test-node",
      version: 1,
      position: [100, 0],
    })
    node1.addInput("input", "object")
    node1.addOutput("output", "object")

    const node2 = new TestNode({
      id: "node-2",
      name: "Node2",
      nodeType: "test-node",
      version: 1,
      position: [200, 0],
    })
    node2.addInput("input", "object")
    node2.addOutput("output", "object")

    workflow.addNode(trigger)
    workflow.addNode(node1)
    workflow.addNode(node2)
    workflow.linkNodes("Trigger", "output", "Node1", "input")
    workflow.linkNodes("Node1", "output", "Node2", "input")

    const engine = new ExecutionEngine(workflow)
    await trigger.run({ input: {}, state: {} })
    trigger.setState(NodeState.Completed)

    await engine.execute("Trigger")

    expect(workflow.state).toBe(WorkflowState.Completed)
    expect(node2.getState()).toBe(NodeState.Completed)
  })
})

