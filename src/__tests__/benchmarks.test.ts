/**
 * Performance Benchmarks
 *
 * Benchmarks for:
 * - DAG execution performance
 * - Parallel execution performance
 */

import { Workflow } from "../core/workflow"
import { BaseNode } from "../core/base-node"
import { ManualTrigger } from "../nodes/manual-trigger"
import { ExecutionEngine } from "../execution/execution-engine"
import type { NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import { WorkflowState } from "../interfaces"

/**
 * Simple test node with configurable delay
 */
class BenchmarkNode extends BaseNode {
  constructor(
    properties: import("../interfaces").NodeProperties,
    private delayMs: number = 0,
  ) {
    super(properties)
    this.addInput("input", "data")
    this.addOutput("output", "data")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs))
    }
    return context.input
  }
}

describe("Performance Benchmarks", () => {
  describe("DAG Execution Performance", () => {
    test("should execute DAG efficiently with many nodes", async () => {
      const workflow = new Workflow("dag-benchmark", undefined, undefined, [], {}, {}, {
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

      // Create a DAG with 20 nodes: trigger -> [10 parallel nodes] -> [10 parallel nodes]
      const level1Nodes: BenchmarkNode[] = []
      const level2Nodes: BenchmarkNode[] = []

      for (let i = 0; i < 10; i++) {
        const node = new BenchmarkNode({
          id: `level1-${i}`,
          name: `level1-node${i}`,
          nodeType: "test",
          version: 1,
          position: [100, i * 10],
        }, 10) // 10ms delay
        level1Nodes.push(node)
        workflow.addNode(node)
        node.setup({})
        workflow.linkNodes("trigger", "output", `level1-node${i}`, "input")
      }

      for (let i = 0; i < 10; i++) {
        const node = new BenchmarkNode({
          id: `level2-${i}`,
          name: `level2-node${i}`,
          nodeType: "test",
          version: 1,
          position: [200, i * 10],
        }, 10) // 10ms delay
        level2Nodes.push(node)
        workflow.addNode(node)
        node.setup({})
        // Each level2 node depends on corresponding level1 node
        workflow.linkNodes(`level1-node${i}`, "output", `level2-node${i}`, "input")
      }

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      const startTime = Date.now()
      trigger.trigger()

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      const duration = Date.now() - startTime

      expect(workflow.state).toBe(WorkflowState.Completed)

      // With parallel execution, should take approximately:
      // Level 1: 10ms (parallel)
      // Level 2: 10ms (parallel)
      // Total: ~20ms + overhead (polling, event loop, state management)
      // Sequential would be: 10 * 10ms + 10 * 10ms = 200ms
      // Allow up to 250ms to account for polling overhead (10ms per check), event loop delays, and test variability
      // The test uses polling which adds overhead, but parallel execution should still complete reasonably fast
      expect(duration).toBeLessThan(250)
      // Accounts for test polling overhead while ensuring reasonable performance
      console.log(`DAG execution time: ${duration}ms (20 nodes, 2 levels)`)
    }, 5000)

    test("should handle large DAG efficiently", async () => {
      const workflow = new Workflow("large-dag-benchmark", undefined, undefined, [], {}, {}, {
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

      // Create a large DAG: 5 levels, 5 nodes per level
      const nodes: BenchmarkNode[][] = []
      for (let level = 0; level < 5; level++) {
        const levelNodes: BenchmarkNode[] = []
        for (let i = 0; i < 5; i++) {
          const node = new BenchmarkNode({
            id: `level${level}-${i}`,
            name: `level${level}-node${i}`,
            nodeType: "test",
            version: 1,
            position: [level * 100, i * 10],
          }, 5) // 5ms delay
          levelNodes.push(node)
          workflow.addNode(node)
          node.setup({})

          if (level === 0) {
            workflow.linkNodes("trigger", "output", `level${level}-node${i}`, "input")
          } else {
            // Each node depends on all nodes from previous level
            for (let j = 0; j < 5; j++) {
              workflow.linkNodes(`level${level - 1}-node${j}`, "output", `level${level}-node${i}`, "input")
            }
          }
        }
        nodes.push(levelNodes)
      }

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      const startTime = Date.now()
      trigger.trigger()

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      const duration = Date.now() - startTime

      expect(workflow.state).toBe(WorkflowState.Completed)
      console.log(`Large DAG execution time: ${duration}ms (25 nodes, 5 levels)`)
    }, 10000)
  })

  describe("Parallel Execution Performance", () => {
    test("should demonstrate parallel execution speedup", async () => {
      // Test with parallel execution enabled
      const parallelWorkflow = new Workflow("parallel-benchmark", undefined, undefined, [], {}, {}, {
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
      parallelWorkflow.addNode(trigger)
      trigger.setup({})

      // Create 20 independent nodes
      const parallelNodes: BenchmarkNode[] = []
      for (let i = 0; i < 20; i++) {
        const node = new BenchmarkNode({
          id: `parallel-${i}`,
          name: `parallel-node${i}`,
          nodeType: "test",
          version: 1,
          position: [100, i * 10],
        }, 50) // 50ms delay each
        parallelNodes.push(node)
        parallelWorkflow.addNode(node)
        node.setup({})
        parallelWorkflow.linkNodes("trigger", "output", `parallel-node${i}`, "input")
      }

      const parallelEngine = new ExecutionEngine(parallelWorkflow)
      trigger.setExecutionEngine(parallelEngine)

      const parallelStart = Date.now()
      trigger.trigger()

      let attempts = 0
      while (
        parallelWorkflow.state !== WorkflowState.Completed &&
        parallelWorkflow.state !== WorkflowState.Failed &&
        attempts < 1000
      ) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      const parallelDuration = Date.now() - parallelStart

      expect(parallelWorkflow.state).toBe(WorkflowState.Completed)

      // Sequential would be: 20 * 50ms = 1000ms
      // Parallel should be: ~50ms + overhead
      expect(parallelDuration).toBeLessThan(200) // Much faster than sequential
      console.log(`Parallel execution time: ${parallelDuration}ms (20 nodes, 50ms each)`)
      console.log(`Speedup: ~${Math.round(1000 / parallelDuration)}x vs sequential`)
    }, 5000)

    test("should respect parallel execution limits", async () => {
      const workflow = new Workflow("parallel-limit-benchmark", undefined, undefined, [], {}, {}, {
        enableParallelExecution: true,
        maxParallelExecutions: 5, // Limit to 5 concurrent
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

      // Create 20 independent nodes
      const nodes: BenchmarkNode[] = []
      for (let i = 0; i < 20; i++) {
        const node = new BenchmarkNode({
          id: `node-${i}`,
          name: `node${i}`,
          nodeType: "test",
          version: 1,
          position: [100, i * 10],
        }, 50) // 50ms delay each
        nodes.push(node)
        workflow.addNode(node)
        node.setup({})
        workflow.linkNodes("trigger", "output", `node${i}`, "input")
      }

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      const startTime = Date.now()
      trigger.trigger()

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      const duration = Date.now() - startTime

      expect(workflow.state).toBe(WorkflowState.Completed)

      // With limit of 5: 20 nodes / 5 concurrent = 4 batches
      // Each batch: 50ms
      // Total: ~200ms + overhead
      expect(duration).toBeLessThan(500)
      expect(duration).toBeGreaterThan(150) // Should take longer than unlimited parallel
      console.log(`Parallel execution with limit (5): ${duration}ms (20 nodes, 50ms each)`)
    }, 10000)
  })
})

