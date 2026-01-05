/**
 * Scheduled Workflow Example
 *
 * This example demonstrates a workflow triggered on a schedule.
 */

import { Workflow } from "@workflow/core"
import { ScheduleTrigger } from "@workflow/nodes"
import { JavaScriptExecutionNode } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"

async function main() {
  // Create workflow
  const workflow = new Workflow("scheduled-workflow")

  // Create schedule trigger
  const trigger = new ScheduleTrigger({
    id: "schedule-1",
    name: "schedule",
    nodeType: "schedule-trigger",
    version: 1,
    position: [0, 0],
  })

  // Configure schedule (every minute for demo)
  trigger.setup({
    schedule: "* * * * *", // Every minute
    timezone: "UTC",
  })

  // Create processing node
  const processNode = new JavaScriptExecutionNode({
    id: "process-1",
    name: "process",
    nodeType: "javascript",
    version: 1,
    position: [100, 0],
    isTrigger: false,
  })

  processNode.setup({
    code: `
      const timestamp = new Date().toISOString();
      return {
        message: "Workflow executed at " + timestamp,
        value: Math.random() * 100
      };
    `,
  })

  // Add nodes to workflow
  workflow.addNode(trigger)
  workflow.addNode(processNode)

  // Link nodes
  workflow.linkNodes("schedule", "output", "process", "input")

  // Create execution engine
  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  // Activate schedule
  console.log("Activating schedule trigger...")
  trigger.activate()

  // Get next execution time
  const nextTime = trigger.getNextExecutionTime()
  console.log("Next execution time:", nextTime)

  // Wait for a few executions
  console.log("Waiting for scheduled executions...")
  await new Promise(resolve => setTimeout(resolve, 65000)) // Wait 65 seconds

  // Deactivate schedule
  console.log("Deactivating schedule trigger...")
  trigger.deactivate()
}

main().catch(console.error)

