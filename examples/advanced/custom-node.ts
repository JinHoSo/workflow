/**
 * Custom Node Example
 *
 * This example demonstrates creating and using a custom node.
 */

import { BaseNode } from "@workflow/core"
import type { NodeProperties, ExecutionContext, NodeOutput, NodeConfiguration } from "@workflow/interfaces"
import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"

/**
 * Custom node that multiplies input value by a configured multiplier
 */
class MultiplyNode extends BaseNode {
  constructor(properties: NodeProperties) {
    super(properties)
    this.addInput("input", "any")
    this.addOutput("output", "any")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const inputData = context.input["input"] || []
    const config = this.config as MultiplyNodeConfiguration
    const multiplier = config.multiplier || 1

    const results = inputData.map((item: { value?: number }) => {
      const value = item.value || 0
      return {
        value: value * multiplier,
        original: value,
        multiplier,
      }
    })

    return { output: results }
  }
}

/**
 * Configuration interface for MultiplyNode
 */
interface MultiplyNodeConfiguration extends NodeConfiguration {
  multiplier?: number
}

async function main() {
  // Create workflow
  const workflow = new Workflow("custom-node-workflow")

  // Create trigger
  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    nodeType: "manual-trigger",
    version: 1,
    position: [0, 0],
  })

  // Create custom node
  const multiplyNode = new MultiplyNode({
    id: "multiply-1",
    name: "multiply",
    nodeType: "multiply",
    version: 1,
    position: [100, 0],
    isTrigger: false,
  })

  // Configure custom node
  multiplyNode.setup({
    multiplier: 5,
  })

  // Add nodes to workflow
  workflow.addNode(trigger)
  workflow.addNode(multiplyNode)

  // Link nodes
  workflow.linkNodes("trigger", "output", "multiply", "input")

  // Create execution engine
  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  // Execute workflow
  console.log("Executing workflow with custom node...")
  trigger.trigger({ output: { value: 10 } })

  // Wait for execution
  await new Promise(resolve => setTimeout(resolve, 100))

  // Get result
  const result = multiplyNode.getResult("output")
  console.log("Result:", result)
  // Expected: { value: 50, original: 10, multiplier: 5 }
}

main().catch(console.error)

