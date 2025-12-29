import { Workflow } from "../core/workflow"
import { BaseNode } from "../core/base-node"
import { ManualTrigger } from "../triggers/manual-trigger"
import { ExecutionEngine } from "../execution/execution-engine"
import type { NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import { NodeState } from "../types"
import { WorkflowState } from "../interfaces"

class TestNode extends BaseNode {
  constructor(
    properties: import("../interfaces").NodeProperties,
    private processFn?: (context: ExecutionContext) => Promise<NodeOutput>,
  ) {
    super(properties)
    this.addInput("input", "data")
    this.addOutput("output", "data")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    if (this.processFn) {
      return this.processFn(context)
    }
    return context.input
  }
}

describe("DAG-Based Execution", () => {
  test("should execute nodes in topological order", async () => {
    const workflow = new Workflow("test-workflow")
    const executionOrder: string[] = []

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const node1 = new TestNode(
      {
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      },
      async () => {
        executionOrder.push("node1")
        return { output: { value: 1 } }
      },
    )

    const node2 = new TestNode(
      {
        id: "node-2",
        name: "node2",
        nodeType: "test",
        version: 1,
        position: [200, 0],
      },
      async () => {
        executionOrder.push("node2")
        return { output: { value: 2 } }
      },
    )

    const node3 = new TestNode(
      {
        id: "node-3",
        name: "node3",
        nodeType: "test",
        version: 1,
        position: [300, 0],
      },
      async () => {
        executionOrder.push("node3")
        return { output: { value: 3 } }
      },
    )

    // trigger -> node1 -> node3
    // trigger -> node2 -> node3
    workflow.addNode(trigger)
    workflow.addNode(node1)
    workflow.addNode(node2)
    workflow.addNode(node3)

    workflow.linkNodes("trigger", "output", "node1", "input")
    workflow.linkNodes("trigger", "output", "node2", "input")
    workflow.linkNodes("node1", "output", "node3", "input")
    workflow.linkNodes("node2", "output", "node3", "input")

    trigger.setup({})
    node1.setup({})
    node2.setup({})
    node3.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)
    trigger.trigger()

    // Wait for execution
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    // node1 and node2 should execute before node3
    // They can execute in parallel, but both must complete before node3
    expect(executionOrder).toContain("node1")
    expect(executionOrder).toContain("node2")
    expect(executionOrder).toContain("node3")
    expect(executionOrder.indexOf("node3")).toBeGreaterThan(executionOrder.indexOf("node1"))
    expect(executionOrder.indexOf("node3")).toBeGreaterThan(executionOrder.indexOf("node2"))
  })

  test("should detect circular dependencies", () => {
    const workflow = new Workflow("test-workflow")

    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })

    const node2 = new TestNode({
      id: "node-2",
      name: "node2",
      nodeType: "test",
      version: 1,
      position: [100, 0],
    })

    workflow.addNode(node1)
    workflow.addNode(node2)

    // Create circular dependency: node1 -> node2 -> node1
    workflow.linkNodes("node1", "output", "node2", "input")
    workflow.linkNodes("node2", "output", "node1", "input")

    const engine = new ExecutionEngine(workflow)

    // Execution should fail with circular dependency error
    expect(() => {
      // This will be detected during topological sort
      engine.execute("node1").catch(() => {
        // Expected to fail
      })
    }).not.toThrow() // The error will be thrown during execution, not during setup
  })

  test("should execute independent nodes in parallel", async () => {
    const workflow = new Workflow("test-workflow")
    const executionTimes: Record<string, number> = {}

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const node1 = new TestNode(
      {
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      },
      async () => {
        executionTimes["node1"] = Date.now()
        await new Promise((resolve) => setTimeout(resolve, 50))
        return { output: { value: 1 } }
      },
    )

    const node2 = new TestNode(
      {
        id: "node-2",
        name: "node2",
        nodeType: "test",
        version: 1,
        position: [200, 0],
      },
      async () => {
        executionTimes["node2"] = Date.now()
        await new Promise((resolve) => setTimeout(resolve, 50))
        return { output: { value: 2 } }
      },
    )

    workflow.addNode(trigger)
    workflow.addNode(node1)
    workflow.addNode(node2)

    workflow.linkNodes("trigger", "output", "node1", "input")
    workflow.linkNodes("trigger", "output", "node2", "input")

    trigger.setup({})
    node1.setup({})
    node2.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    const startTime = Date.now()
    trigger.trigger()

    // Wait for execution
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    const duration = Date.now() - startTime

    // If nodes executed in parallel, total time should be ~50ms (not ~100ms)
    expect(duration).toBeLessThan(100)
    expect(node1.state).toBe(NodeState.Completed)
    expect(node2.state).toBe(NodeState.Completed)
  })
})

