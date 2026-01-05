/**
 * Multi-Node Workflow Example
 *
 * This example demonstrates a workflow with multiple connected nodes.
 */

import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { JavaScriptExecutionNode } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"

async function main() {
  // Create workflow
  const workflow = new Workflow("multi-node-workflow")

  // Create trigger
  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    nodeType: "manual-trigger",
    version: 1,
    position: [0, 0],
  })

  // Create multiply node
  const multiplyNode = new JavaScriptExecutionNode({
    id: "multiply-1",
    name: "multiply",
    nodeType: "javascript",
    version: 1,
    position: [100, 0],
    isTrigger: false,
  })

  multiplyNode.setup({
    code: `
      const value = input().value || 0;
      return { value: value * 2 };
    `,
  })

  // Create add node
  const addNode = new JavaScriptExecutionNode({
    id: "add-1",
    name: "add",
    nodeType: "javascript",
    version: 1,
    position: [200, 0],
    isTrigger: false,
  })

  addNode.setup({
    code: `
      const value = input().value || 0;
      return { value: value + 10 };
    `,
  })

  // Add nodes to workflow
  workflow.addNode(trigger)
  workflow.addNode(multiplyNode)
  workflow.addNode(addNode)

  // Connect nodes
  workflow.linkNodes("trigger", "output", "multiply", "input")
  workflow.linkNodes("multiply", "output", "add", "input")

  // Create execution engine
  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  // Execute workflow
  trigger.trigger({ output: { value: 5 } })

  // Wait for execution
  await new Promise(resolve => setTimeout(resolve, 200))

  // Get results
  const multiplyResult = multiplyNode.getResult("output")
  const finalResult = addNode.getResult("output")

  console.log("Multiply result:", multiplyResult) // { value: 10 }
  console.log("Final result:", finalResult) // { value: 20 }
}

main().catch(console.error)

