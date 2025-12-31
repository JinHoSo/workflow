/**
 * Parallel Execution Example
 *
 * This example demonstrates parallel execution of independent nodes.
 */

import { Workflow } from "../src/core/workflow"
import { ManualTrigger } from "../src/triggers/manual-trigger"
import { JavaScriptNode } from "../src/nodes/javascript-execution-node"
import { ExecutionEngine } from "../src/execution/execution-engine"
import { WorkflowState } from "../src/interfaces"

async function parallelExecutionExample() {
  const workflow = new Workflow("parallel-example", undefined, undefined, [], {}, {}, {
    enableParallelExecution: true,
    maxParallelExecutions: 0, // Unlimited
  })

  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    nodeType: "manual-trigger",
    version: 1,
    position: [0, 0],
  })
  trigger.setup({})

  // Create multiple independent nodes
  const node1 = new JavaScriptNode({
    id: "node-1",
    name: "node1",
    nodeType: "javascript",
    version: 1,
    position: [100, 0],
  })
  node1.setup({
    code: `
      await new Promise(resolve => setTimeout(resolve, 100));
      return { value: 1 };
    `,
  })

  const node2 = new JavaScriptNode({
    id: "node-2",
    name: "node2",
    nodeType: "javascript",
    version: 1,
    position: [200, 0],
  })
  node2.setup({
    code: `
      await new Promise(resolve => setTimeout(resolve, 100));
      return { value: 2 };
    `,
  })

  // Merge node that depends on both
  const mergeNode = new JavaScriptNode({
    id: "node-3",
    name: "merge",
    nodeType: "javascript",
    version: 1,
    position: [300, 0],
  })
  mergeNode.inputs = []
  mergeNode.addInput("input1", "data")
  mergeNode.addInput("input2", "data")
  mergeNode.setup({
    code: `
      const val1 = input("input1").value;
      const val2 = input("input2").value;
      return { sum: val1 + val2 };
    `,
  })

  workflow.addNode(trigger)
  workflow.addNode(node1)
  workflow.addNode(node2)
  workflow.addNode(mergeNode)

  // Link: trigger -> node1, node2 -> merge
  workflow.linkNodes("trigger", "output", "node1", "input")
  workflow.linkNodes("trigger", "output", "node2", "input")
  workflow.linkNodes("node1", "output", "merge", "input1")
  workflow.linkNodes("node2", "output", "merge", "input2")

  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  const startTime = Date.now()
  trigger.trigger()

  while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  const duration = Date.now() - startTime
  console.log(`Execution time: ${duration}ms`) // Should be ~100ms (parallel) not ~200ms (sequential)

  const result = mergeNode.getResult("output")
  console.log("Result:", result) // { sum: 3 }
}

parallelExecutionExample().catch(console.error)

