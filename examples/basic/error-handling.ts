/**
 * Error Handling Example
 *
 * This example demonstrates error handling in workflows.
 */

import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { JavaScriptExecutionNode } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"
import { NodeState } from "@workflow/interfaces"

async function main() {
  // Create workflow
  const workflow = new Workflow("error-handling-workflow")

  // Create trigger
  // nodeType is automatically set from class definition
  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    version: 1,
    position: [0, 0],
  })

  // Create node that may fail
  // nodeType is automatically set from class definition
  // isTrigger defaults to false, so it can be omitted
  const mayFailNode = new JavaScriptExecutionNode({
    id: "may-fail-1",
    name: "may-fail",
    version: 1,
    position: [100, 0],
    continueOnFail: true, // Continue even if this node fails
  })

  mayFailNode.setup({
    code: `
      const value = input().value || 0;
      if (value < 0) {
        throw new Error("Value must be positive");
      }
      return { value: value * 2 };
    `,
  })

  // Create error handler node
  // nodeType is automatically set from class definition
  // isTrigger defaults to false, so it can be omitted
  const errorHandlerNode = new JavaScriptExecutionNode({
    id: "error-handler-1",
    name: "error-handler",
    version: 1,
    position: [200, 0],
  })

  errorHandlerNode.setup({
    code: `
      const input = input();
      if (input.error) {
        return { message: "Error handled: " + input.error.message };
      }
      return { message: "Success: " + input.value };
    `,
  })

  // Add nodes to workflow
  workflow.addNode(trigger)
  workflow.addNode(mayFailNode)
  workflow.addNode(errorHandlerNode)

  // Connect nodes
  workflow.linkNodes("trigger", "output", "may-fail", "input")
  workflow.linkNodes("may-fail", "output", "error-handler", "input")

  // Create execution engine
  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  // Test with valid input
  console.log("Test 1: Valid input")
  trigger.trigger({ output: { value: 5 } })
  await new Promise(resolve => setTimeout(resolve, 200))

  if (mayFailNode.state === NodeState.Completed) {
    const result = errorHandlerNode.getResult("output")
    console.log("Result:", result)
  }

  // Reset workflow
  workflow.reset()

  // Test with invalid input (will cause error)
  console.log("\nTest 2: Invalid input (negative value)")
  trigger.trigger({ output: { value: -5 } })
  await new Promise(resolve => setTimeout(resolve, 200))

  if (mayFailNode.state === NodeState.Failed) {
    console.log("Node failed as expected:", mayFailNode.error?.message)
    // Error handler can still process
    const result = errorHandlerNode.getResult("output")
    console.log("Error handler result:", result)
  }
}

main().catch(console.error)

