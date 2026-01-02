/**
 * Stress Tests
 *
 * Tests for stress scenarios including:
 * - Complex workflows with many nodes
 * - Deep dependency chains
 */

import { Workflow } from "../core/workflow"
import { BaseNode } from "../core/base-node"
import { ManualTrigger } from "../nodes/manual-trigger"
import { ExecutionEngine } from "../execution/execution-engine"
import type { NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import { NodeState } from "../types"
import { WorkflowState } from "../interfaces"

/**
 * Simple test node
 */
class SimpleNode extends BaseNode {
  constructor(properties: import("../interfaces").NodeProperties) {
    super(properties)
    this.addInput("input", "data")
    this.addOutput("output", "data")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const inputData = context.input.input
    const value = Array.isArray(inputData) ? inputData[0] : inputData
    const numValue = typeof value === "object" && value !== null && "value" in value
      ? (value as { value: number }).value
      : 0
    return { output: { value: numValue + 1 } }
  }
}

describe("Stress Tests", () => {
  describe("Complex Workflows with Many Nodes", () => {
    test("should execute workflow with 50 nodes", async () => {
      const workflow = new Workflow("many-nodes-test", undefined, undefined, [], {}, {}, {
        enableParallelExecution: true,
        maxParallelExecutions: 0,
      })

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })
      workflow.addNode(trigger)
      trigger.setup({})

      // Create 50 nodes in a chain
      const nodes: SimpleNode[] = []
      for (let i = 0; i < 50; i++) {
        const node = new SimpleNode({
          id: `node-${i}`,
          name: `node${i}`,
          nodeType: "test",
          version: 1,
          position: [i * 10, 0],
        })
        nodes.push(node)
        workflow.addNode(node)
        node.setup({})

        if (i === 0) {
          workflow.linkNodes("trigger", "output", `node${i}`, "input")
        } else {
          workflow.linkNodes(`node${i - 1}`, "output", `node${i}`, "input")
        }
      }

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      const startTime = Date.now()
      trigger.trigger({ output: { value: 0 } })

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      const duration = Date.now() - startTime

      expect(workflow.state).toBe(WorkflowState.Completed)
      expect(nodes[49].state).toBe(NodeState.Completed)
      const result = nodes[49].getResult("output")
      const resultValue = Array.isArray(result) ? result[0] : result
      expect((resultValue as { value: number }).value).toBe(50)

      // Should complete in reasonable time
      expect(duration).toBeLessThan(5000) // 5 seconds max
    }, 10000) // 10 second timeout

    test("should execute workflow with 100 parallel nodes", async () => {
      const workflow = new Workflow("parallel-nodes-test", undefined, undefined, [], {}, {}, {
        enableParallelExecution: true,
        maxParallelExecutions: 0,
      })

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })
      workflow.addNode(trigger)
      trigger.setup({})

      // Create 100 parallel nodes
      const nodes: SimpleNode[] = []
      for (let i = 0; i < 100; i++) {
        const node = new SimpleNode({
          id: `node-${i}`,
          name: `node${i}`,
          nodeType: "test",
          version: 1,
          position: [i * 10, 0],
        })
        nodes.push(node)
        workflow.addNode(node)
        node.setup({})
        workflow.linkNodes("trigger", "output", `node${i}`, "input")
      }

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      const startTime = Date.now()
      trigger.trigger({ output: { value: 1 } })

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      const duration = Date.now() - startTime

      expect(workflow.state).toBe(WorkflowState.Completed)
      // All nodes should complete
      for (const node of nodes) {
        expect(node.state).toBe(NodeState.Completed)
      }

      // Should complete in reasonable time (parallel execution should be faster)
      expect(duration).toBeLessThan(10000) // 10 seconds max
    }, 15000) // 15 second timeout
  })

  describe("Deep Dependency Chains", () => {
    test("should execute workflow with 100-level deep chain", async () => {
      const workflow = new Workflow("deep-chain-test")

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })
      workflow.addNode(trigger)
      trigger.setup({})

      // Create 100-level deep chain
      const nodes: SimpleNode[] = []
      for (let i = 0; i < 100; i++) {
        const node = new SimpleNode({
          id: `node-${i}`,
          name: `node${i}`,
          nodeType: "test",
          version: 1,
          position: [i * 10, 0],
        })
        nodes.push(node)
        workflow.addNode(node)
        node.setup({})

        if (i === 0) {
          workflow.linkNodes("trigger", "output", `node${i}`, "input")
        } else {
          workflow.linkNodes(`node${i - 1}`, "output", `node${i}`, "input")
        }
      }

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      const startTime = Date.now()
      trigger.trigger({ output: { value: 0 } })

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      const duration = Date.now() - startTime

      expect(workflow.state).toBe(WorkflowState.Completed)
      expect(nodes[99].state).toBe(NodeState.Completed)
      const result = nodes[99].getResult("output")
      const resultValue = Array.isArray(result) ? result[0] : result
      expect((resultValue as { value: number }).value).toBe(100)

      // Should complete in reasonable time
      expect(duration).toBeLessThan(10000) // 10 seconds max
    }, 15000) // 15 second timeout

    test("should execute workflow with complex branching and merging", async () => {
      const workflow = new Workflow("branching-test", undefined, undefined, [], {}, {}, {
        enableParallelExecution: true,
        maxParallelExecutions: 0,
      })

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })
      workflow.addNode(trigger)
      trigger.setup({})

      // Create branching structure: trigger -> [node1, node2, node3] -> node4
      const node1 = new SimpleNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })
      const node2 = new SimpleNode({
        id: "node-2",
        name: "node2",
        nodeType: "test",
        version: 1,
        position: [200, 0],
      })
      const node3 = new SimpleNode({
        id: "node-3",
        name: "node3",
        nodeType: "test",
        version: 1,
        position: [300, 0],
      })

      class MergeNode extends BaseNode {
        constructor(properties: import("../interfaces").NodeProperties) {
          super(properties)
          this.addInput("input1", "data")
          this.addInput("input2", "data")
          this.addInput("input3", "data")
          this.addOutput("output", "data")
        }

        protected async process(context: ExecutionContext): Promise<NodeOutput> {
          const val1 = Array.isArray(context.input.input1) ? context.input.input1[0] : context.input.input1
          const val2 = Array.isArray(context.input.input2) ? context.input.input2[0] : context.input.input2
          const val3 = Array.isArray(context.input.input3) ? context.input.input3[0] : context.input.input3
          const v1 = typeof val1 === "object" && val1 !== null && "value" in val1 ? (val1 as { value: number }).value : 0
          const v2 = typeof val2 === "object" && val2 !== null && "value" in val2 ? (val2 as { value: number }).value : 0
          const v3 = typeof val3 === "object" && val3 !== null && "value" in val3 ? (val3 as { value: number }).value : 0
          return { output: { value: v1 + v2 + v3 } }
        }
      }

      const node4 = new MergeNode({
        id: "node-4",
        name: "node4",
        nodeType: "test",
        version: 1,
        position: [400, 0],
      })

      workflow.addNode(node1)
      workflow.addNode(node2)
      workflow.addNode(node3)
      workflow.addNode(node4)

      workflow.linkNodes("trigger", "output", "node1", "input")
      workflow.linkNodes("trigger", "output", "node2", "input")
      workflow.linkNodes("trigger", "output", "node3", "input")
      workflow.linkNodes("node1", "output", "node4", "input1")
      workflow.linkNodes("node2", "output", "node4", "input2")
      workflow.linkNodes("node3", "output", "node4", "input3")

      node1.setup({})
      node2.setup({})
      node3.setup({})
      node4.setup({})

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      trigger.trigger({ output: { value: 1 } })

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 200) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      expect(workflow.state).toBe(WorkflowState.Completed)
      expect(node4.state).toBe(NodeState.Completed)
      const result = node4.getResult("output")
      const resultValue = Array.isArray(result) ? result[0] : result
      // node1, node2, node3 each add 1, so 2+2+2 = 6
      expect((resultValue as { value: number }).value).toBe(6)
    })
  })
})

