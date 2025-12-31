/**
 * Basic Workflow Example
 *
 * This example demonstrates creating a simple workflow with a trigger and a JavaScript node.
 */

import { Workflow } from "../src/core/workflow"
import { ManualTrigger } from "../src/triggers/manual-trigger"
import { JavaScriptNode } from "../src/nodes/javascript-execution-node"
import { ExecutionEngine } from "../src/execution/execution-engine"
import { WorkflowState } from "../src/interfaces"

async function basicWorkflowExample() {
  // Create a new workflow
  const workflow = new Workflow("basic-example")

  // Create a manual trigger
  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    nodeType: "manual-trigger",
    version: 1,
    position: [0, 0],
  })
  trigger.setup({})

  // Create a JavaScript node that processes data
  const jsNode = new JavaScriptNode({
    id: "node-1",
    name: "processor",
    nodeType: "javascript",
    version: 1,
    position: [100, 0],
  })
  jsNode.setup({
    code: `
      const input = input().value;
      return { result: input * 2 };
    `,
  })

  // Add nodes to workflow
  workflow.addNode(trigger)
  workflow.addNode(jsNode)

  // Link nodes: trigger -> processor
  workflow.linkNodes("trigger", "output", "processor", "input")

  // Create execution engine
  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  // Trigger workflow with initial data
  trigger.trigger({ output: { value: 5 } })

  // Wait for execution to complete
  while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  // Get result
  const result = jsNode.getResult("output")
  console.log("Result:", result) // { result: 10 }
}

// Run example
basicWorkflowExample().catch(console.error)

