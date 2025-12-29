import { Workflow } from "../core/workflow"
import { BaseNode } from "../core/base-node"
import { ManualTrigger } from "../triggers/manual-trigger"
import { ExecutionEngine } from "../execution/execution-engine"
import type { NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import { NodeState } from "../types"
import { WorkflowState } from "../interfaces"

class TestNode extends BaseNode {
  constructor(properties: import("../interfaces").NodeProperties) {
    super(properties)
    this.addInput("input", "data")
    this.addOutput("output", "data")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const inputData = context.input.input
    const inputValue = Array.isArray(inputData) ? inputData[0] : inputData
    const value = (typeof inputValue === "object" && inputValue !== null && "value" in inputValue
      ? (inputValue as { value: number }).value
      : 0) as number
    return { output: { value: value * 2 } }
  }
}

describe("State Management", () => {
  test("should track node execution state", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [100, 0],
    })

    workflow.addNode(trigger)
    workflow.addNode(node1)
    workflow.linkNodes("trigger", "output", "node1", "input")

    trigger.setup({})
    node1.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    trigger.trigger({ output: { value: 5 } })

    // Wait for execution
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    // Check state manager
    const stateManager = engine.getStateManager()
    const node1State = stateManager.getNodeState("node1")
    expect(node1State).toBeDefined()
    expect(node1State?.output).toBeDefined()

    const node1Metadata = stateManager.getNodeMetadata("node1")
    expect(node1Metadata).toBeDefined()
    expect(node1Metadata?.startTime).toBeDefined()
    expect(node1Metadata?.endTime).toBeDefined()
    expect(node1Metadata?.duration).toBeGreaterThanOrEqual(0)
    expect(node1Metadata?.status).toBe(NodeState.Completed)
  })

  test("should track execution timing", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [100, 0],
    })

    workflow.addNode(trigger)
    workflow.addNode(node1)
    workflow.linkNodes("trigger", "output", "node1", "input")

    trigger.setup({})
    node1.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    trigger.trigger()

    // Wait for execution
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    const stateManager = engine.getStateManager()
    const node1Metadata = stateManager.getNodeMetadata("node1")

    expect(node1Metadata?.startTime).toBeLessThanOrEqual(node1Metadata?.endTime || 0)
    expect(node1Metadata?.duration).toBeGreaterThanOrEqual(0)
  })

  test("should export and import state", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [100, 0],
    })

    workflow.addNode(trigger)
    workflow.addNode(node1)
    workflow.linkNodes("trigger", "output", "node1", "input")

    trigger.setup({})
    node1.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    trigger.trigger({ output: { value: 10 } })

    // Wait for execution
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    // Export state
    const stateManager = engine.getStateManager()
    const exported = stateManager.export()

    expect(exported.state).toBeDefined()
    expect(exported.metadata).toBeDefined()
    expect(exported.state["node1"]).toBeDefined()

    // Import state to new manager
    const newStateManager = engine.getStateManager()
    newStateManager.clear()
    newStateManager.import(exported)

    const importedState = newStateManager.getNodeState("node1")
    expect(importedState).toEqual(exported.state["node1"])
  })
})

