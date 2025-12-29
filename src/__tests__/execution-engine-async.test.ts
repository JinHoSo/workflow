import { Workflow } from "../core/workflow"
import { BaseNode } from "../core/base-node"
import { ExecutionEngine } from "../execution/execution-engine"
import { ManualTrigger } from "../triggers/manual-trigger"
import { JavaScriptNode } from "../nodes/javascript-execution-node"
import { NodeState } from "../types"
import type { NodeProperties, NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"

/**
 * Async node that simulates async operation with delay
 */
class AsyncNode extends BaseNode {
  constructor(properties: NodeProperties, private delayMs: number = 100) {
    super(properties)
    this.addInput("input", "data")
    this.addOutput("output", "data")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, this.delayMs))
    const inputData = context.input.input
    const inputValue = Array.isArray(inputData) ? inputData[0] : inputData
    const value = (typeof inputValue === "object" && inputValue !== null && "value" in inputValue
      ? (inputValue as { value: number }).value
      : 0) as number
    return { output: { value: value * 2 } }
  }
}

/**
 * Sync node that processes immediately (but still async for consistency)
 */
class SyncNode extends BaseNode {
  constructor(properties: NodeProperties) {
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
    return { output: { value: value + 10 } }
  }
}

describe("ExecutionEngine - Async Support", () => {
  test("should wait for async node before executing dependent node", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const asyncNode = new AsyncNode(
      {
        id: "async-1",
        name: "async-node",
        nodeType: "async",
        version: 1,
        position: [100, 0],
      },
      4000, // 4000ms delay
    )

    const syncNode = new SyncNode({
      id: "sync-1",
      name: "sync-node",
      nodeType: "sync",
      version: 1,
      position: [200, 0],
    })

    const finalNode = new JavaScriptNode({
      id: "final-1",
      name: "final-node",
      nodeType: "javascript",
      version: 1,
      position: [300, 0],
    })
    finalNode.setup({
      code: `
        const asyncValue = input("input1").value;
        const syncValue = input("input2").value;
        return { value: asyncValue + syncValue };
      `,
    })

    workflow.addNode(trigger)
    workflow.addNode(asyncNode)
    workflow.addNode(syncNode)
    workflow.addNode(finalNode)

    // trigger -> async-node, sync-node
    workflow.linkNodes("trigger", "output", "async-node", "input")
    workflow.linkNodes("trigger", "output", "sync-node", "input")
    // async-node, sync-node -> final-node
    finalNode.addInput("input1", "data")
    finalNode.addInput("input2", "data")
    workflow.linkNodes("async-node", "output", "final-node", "input1")
    workflow.linkNodes("sync-node", "output", "final-node", "input2")

    trigger.setup({})
    asyncNode.setup({})
    syncNode.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.trigger({ output: { value: 5 } })

    const startTime = Date.now()
    await engine.execute("trigger")
    const duration = Date.now() - startTime

    // final-node should wait for async-node (200ms delay)
    expect(duration).toBeGreaterThanOrEqual(200)
    expect(asyncNode.state).toBe(NodeState.Completed)
    expect(syncNode.state).toBe(NodeState.Completed)
    expect(finalNode.state).toBe(NodeState.Completed)

    // async-node: 5 * 2 = 10
    // sync-node: 5 + 10 = 15
    // final-node: 10 + 15 = 25
    const finalResult = finalNode.getResult("output")
    const finalValue = Array.isArray(finalResult) ? finalResult[0] : finalResult
    expect(finalValue.value).toBe(25)
  })

  test("should allow node to reference previous nodes via state", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const node1 = new JavaScriptNode({
      id: "node-1",
      name: "node1",
      nodeType: "javascript",
      version: 1,
      position: [100, 0],
    })
    node1.setup({ code: "return { value: 10 }" })

    const node2 = new JavaScriptNode({
      id: "node-2",
      name: "node2",
      nodeType: "javascript",
      version: 1,
      position: [200, 0],
    })
    node2.setup({ code: "return { value: input().value * 2 }" })

    const node3 = new JavaScriptNode({
      id: "node-3",
      name: "node3",
      nodeType: "javascript",
      version: 1,
      position: [300, 0],
    })
    // node3 references node1's output via state, even though it's not directly connected
    node3.setup({
      code: `
        const node1Value = state("node1", "output").value;
        const node2Value = input().value;
        return { value: node1Value + node2Value };
      `,
    })

    workflow.addNode(trigger)
    workflow.addNode(node1)
    workflow.addNode(node2)
    workflow.addNode(node3)

    // trigger -> node1 -> node2 -> node3
    workflow.linkNodes("trigger", "output", "node1", "input")
    workflow.linkNodes("node1", "output", "node2", "input")
    workflow.linkNodes("node2", "output", "node3", "input")

    trigger.setup({})
    node1.setup({ code: "return { value: 10 }" })
    node2.setup({ code: "return { value: input().value * 2 }" })
    node3.setup({ code: node3.config.code as string })

    const engine = new ExecutionEngine(workflow)
    trigger.trigger()
    await engine.execute("trigger")

    // node1: 10
    // node2: 10 * 2 = 20
    // node3: node1(10) + node2(20) = 30
    expect(node3.state).toBe(NodeState.Completed)
    const node3Result = node3.getResult("output")
    const node3Value = Array.isArray(node3Result) ? node3Result[0] : node3Result
    expect(node3Value.value).toBe(30)
  })

  test("should handle multiple async nodes converging to single node", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const asyncNode1 = new AsyncNode(
      {
        id: "async-1",
        name: "async-node1",
        nodeType: "async",
        version: 1,
        position: [100, 0],
      },
      150,
    )

    const asyncNode2 = new AsyncNode(
      {
        id: "async-2",
        name: "async-node2",
        nodeType: "async",
        version: 1,
        position: [200, 0],
      },
      100,
    )

    const mergeNode = new JavaScriptNode({
      id: "merge-1",
      name: "merge-node",
      nodeType: "javascript",
      version: 1,
      position: [300, 0],
    })
    // Remove default input and add custom ones
    mergeNode.inputs = []
    mergeNode.addInput("input1", "data")
    mergeNode.addInput("input2", "data")
    mergeNode.setup({
      code: `
        const value1 = input("input1").value;
        const value2 = input("input2").value;
        return { sum: value1 + value2 };
      `,
    })

    workflow.addNode(trigger)
    workflow.addNode(asyncNode1)
    workflow.addNode(asyncNode2)
    workflow.addNode(mergeNode)

    workflow.linkNodes("trigger", "output", "async-node1", "input")
    workflow.linkNodes("trigger", "output", "async-node2", "input")
    workflow.linkNodes("async-node1", "output", "merge-node", "input1")
    workflow.linkNodes("async-node2", "output", "merge-node", "input2")

    trigger.setup({})
    asyncNode1.setup({})
    asyncNode2.setup({})
    mergeNode.setup({ code: mergeNode.config.code as string })

    const engine = new ExecutionEngine(workflow)
    trigger.trigger({ output: { value: 5 } })

    const startTime = Date.now()
    await engine.execute("trigger")
    const duration = Date.now() - startTime

    // Should wait for the slowest async node (150ms)
    expect(duration).toBeGreaterThanOrEqual(150)
    expect(asyncNode1.state).toBe(NodeState.Completed)
    expect(asyncNode2.state).toBe(NodeState.Completed)
    expect(mergeNode.state).toBe(NodeState.Completed)

    // async-node1: 5 * 2 = 10
    // async-node2: 5 * 2 = 10
    // merge-node: 10 + 10 = 20
    const mergeResult = mergeNode.getResult("output")
    const mergeValue = Array.isArray(mergeResult) ? mergeResult[0] : mergeResult
    expect(mergeValue.sum).toBe(20)
  })
})

