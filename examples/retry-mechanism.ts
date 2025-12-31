/**
 * Retry Mechanism Example
 *
 * This example demonstrates using retry configuration for handling transient failures.
 */

import { Workflow } from "../src/core/workflow"
import { ManualTrigger } from "../src/triggers/manual-trigger"
import { HttpRequestNode } from "../src/nodes/http-request-node"
import { ExecutionEngine } from "../src/execution/execution-engine"
import { WorkflowState } from "../src/interfaces"

async function retryMechanismExample() {
  const workflow = new Workflow("retry-example")

  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    nodeType: "manual-trigger",
    version: 1,
    position: [0, 0],
  })
  trigger.setup({})

  // HTTP request node with retry configuration
  const httpNode = new HttpRequestNode({
    id: "node-1",
    name: "api-call",
    nodeType: "http-request",
    version: 1,
    position: [100, 0],
    retryOnFail: true,
    maxRetries: 3,
    retryDelay: {
      baseDelay: 1000,  // Start with 1 second
      maxDelay: 10000,  // Cap at 10 seconds
    },
    continueOnFail: true, // Continue workflow even if all retries fail
  })
  httpNode.setup({
    method: "GET",
    url: "https://api.example.com/data",
  })

  workflow.addNode(trigger)
  workflow.addNode(httpNode)
  workflow.linkNodes("trigger", "output", "api-call", "input")

  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  trigger.trigger()

  while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  console.log("Workflow completed")
}

retryMechanismExample().catch(console.error)

