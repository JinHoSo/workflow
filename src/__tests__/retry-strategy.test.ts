import { Workflow } from "../core/workflow"
import { BaseNode } from "../core/base-node"
import { ManualTrigger } from "../triggers/manual-trigger"
import { ExecutionEngine } from "../execution/execution-engine"
import type { NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import { NodeState } from "../types"
import { WorkflowState } from "../interfaces"

class FailingNode extends BaseNode {
  private attemptCount = 0
  private maxFailures: number

  constructor(
    properties: import("../interfaces").NodeProperties,
    maxFailures: number = 2,
  ) {
    super(properties)
    this.maxFailures = maxFailures
    this.addInput("input", "data")
    this.addOutput("output", "data")
  }

  protected async process(_context: ExecutionContext): Promise<NodeOutput> {
    this.attemptCount++
    if (this.attemptCount <= this.maxFailures) {
      throw new Error(`Attempt ${this.attemptCount} failed`)
    }
    return { output: { value: this.attemptCount } }
  }

  reset(): void {
    super.reset()
    this.attemptCount = 0
  }
}

describe("Retry Strategy", () => {
  test("should retry on failure with exponential backoff", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const failingNode = new FailingNode(
      {
        id: "node-1",
        name: "failing-node",
        nodeType: "test",
        version: 1,
        position: [100, 0],
        retryOnFail: true,
        maxRetries: 3,
        retryDelay: { baseDelay: 10, maxDelay: 100 },
      },
      2, // Fail 2 times before succeeding
    )

    workflow.addNode(trigger)
    workflow.addNode(failingNode)
    workflow.linkNodes("trigger", "output", "failing-node", "input")

    trigger.setup({})
    failingNode.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    const startTime = Date.now()
    trigger.trigger()

    // Wait for execution
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 200) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    const duration = Date.now() - startTime

    // Should have retried (with delays)
    expect(duration).toBeGreaterThan(10)
    expect(failingNode.state).toBe(NodeState.Completed)
    const result = failingNode.getResult("output")
    const resultData = Array.isArray(result) ? result[0] : result
    expect(resultData.value).toBe(3) // 3rd attempt succeeded
  })

  test("should fail after max retries", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const failingNode = new FailingNode(
      {
        id: "node-1",
        name: "failing-node",
        nodeType: "test",
        version: 1,
        position: [100, 0],
        retryOnFail: true,
        maxRetries: 2,
        retryDelay: 10,
      },
      10, // Always fail
    )

    workflow.addNode(trigger)
    workflow.addNode(failingNode)
    workflow.linkNodes("trigger", "output", "failing-node", "input")

    trigger.setup({})
    failingNode.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    trigger.trigger()

    // Wait for execution
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 200) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    // Should fail after max retries
    expect(workflow.state).toBe(WorkflowState.Failed)
    expect(failingNode.state).toBe(NodeState.Failed)
    expect(failingNode.error).toBeDefined()
  })

  test("should not retry if retryOnFail is false", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const failingNode = new FailingNode(
      {
        id: "node-1",
        name: "failing-node",
        nodeType: "test",
        version: 1,
        position: [100, 0],
        retryOnFail: false,
      },
      1,
    )

    workflow.addNode(trigger)
    workflow.addNode(failingNode)
    workflow.linkNodes("trigger", "output", "failing-node", "input")

    trigger.setup({})
    failingNode.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    trigger.trigger()

    // Wait for execution
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    // Should fail immediately without retry
    expect(workflow.state).toBe(WorkflowState.Failed)
    expect(failingNode.state).toBe(NodeState.Failed)
  })

  test("should use fixed delay retry strategy", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const failingNode = new FailingNode(
      {
        id: "node-1",
        name: "failing-node",
        nodeType: "test",
        version: 1,
        position: [100, 0],
        retryOnFail: true,
        maxRetries: 2,
        retryDelay: 20, // Fixed delay
      },
      1, // Fail 1 time before succeeding
    )

    workflow.addNode(trigger)
    workflow.addNode(failingNode)
    workflow.linkNodes("trigger", "output", "failing-node", "input")

    trigger.setup({})
    failingNode.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    const startTime = Date.now()
    trigger.trigger()

    // Wait for execution
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 200) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    const duration = Date.now() - startTime

    // Should have retried with fixed delay (~20ms)
    expect(duration).toBeGreaterThan(15)
    expect(failingNode.state).toBe(NodeState.Completed)
  })

  test("should respect max retries limit", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const failingNode = new FailingNode(
      {
        id: "node-1",
        name: "failing-node",
        nodeType: "test",
        version: 1,
        position: [100, 0],
        retryOnFail: true,
        maxRetries: 1, // Only 1 retry allowed
        retryDelay: 10,
      },
      5, // Always fail
    )

    workflow.addNode(trigger)
    workflow.addNode(failingNode)
    workflow.linkNodes("trigger", "output", "failing-node", "input")

    trigger.setup({})
    failingNode.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    trigger.trigger()

    // Wait for execution
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 200) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    // Should fail after max retries (1 initial + 1 retry = 2 total attempts)
    expect(workflow.state).toBe(WorkflowState.Failed)
    expect(failingNode.state).toBe(NodeState.Failed)
  })
})

