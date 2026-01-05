/**
 * Retry Mechanism Example
 *
 * This example demonstrates retry mechanisms for nodes.
 */

import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { JavaScriptExecutionNode } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"

async function main() {
  // Create workflow
  const workflow = new Workflow("retry-mechanism-workflow")

  // Create trigger
  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    nodeType: "manual-trigger",
    version: 1,
    position: [0, 0],
  })

  // Create node with retry configuration
  let attemptCount = 0
  const retryNode = new JavaScriptExecutionNode({
    id: "retry-1",
    name: "retry-node",
    nodeType: "javascript",
    version: 1,
    position: [100, 0],
    isTrigger: false,
    retryOnFail: true,
    maxRetries: 3,
    retryDelay: {
      baseDelay: 500, // Start with 500ms
      maxDelay: 2000, // Maximum 2 seconds
    },
  })

  retryNode.setup({
    code: `
      attemptCount = (attemptCount || 0) + 1;
      const value = input().value || 0;

      // Simulate transient failure (succeed after 2 attempts)
      if (attemptCount < 2) {
        throw new Error("Transient error, attempt " + attemptCount);
      }

      return { value: value * 2, attempts: attemptCount };
    `,
  })

  // Add nodes to workflow
  workflow.addNode(trigger)
  workflow.addNode(retryNode)

  // Connect nodes
  workflow.linkNodes("trigger", "output", "retry-node", "input")

  // Create execution engine
  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  // Execute workflow
  console.log("Executing workflow with retry mechanism...")
  trigger.trigger({ output: { value: 5 } })

  // Wait for execution (with retries, may take longer)
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Get result
  const result = retryNode.getResult("output")
  console.log("Final result:", result)
  console.log("Attempts made:", result?.[0]?.attempts)
}

main().catch(console.error)

