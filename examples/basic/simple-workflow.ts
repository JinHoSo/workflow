/**
 * Simple Workflow Example
 *
 * This example demonstrates creating a basic workflow with a trigger and a single node.
 */

import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { JavaScriptExecutionNode } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"

async function main() {
  // Create workflow
  const workflow = new Workflow("simple-workflow")

  // Create trigger
  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    nodeType: "manual-trigger",
    version: 1,
    position: [0, 0],
  })

  // Create JavaScript node
  const jsNode = new JavaScriptExecutionNode({
    id: "js-1",
    name: "js-node",
    nodeType: "javascript",
    version: 1,
    position: [100, 0],
    isTrigger: false,
  })

  // Configure JavaScript node
  jsNode.setup({
    code: `
      const value = input().value || 0;
      return { value: value * 2 };
    `,
  })

  // Add nodes to workflow
  workflow.addNode(trigger)
  workflow.addNode(jsNode)

  // Link nodes
  workflow.linkNodes("trigger", "output", "js-node", "input")

  // Create execution engine
  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  // Execute workflow
  trigger.trigger({ output: { value: 5 } })

  // Wait for execution
  await new Promise(resolve => setTimeout(resolve, 100))

  // Get result
  const result = jsNode.getResult("output")
  console.log("Result:", result) // { value: 10 }
}

main().catch(console.error)

