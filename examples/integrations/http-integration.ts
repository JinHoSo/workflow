/**
 * HTTP Integration Example
 *
 * This example demonstrates making HTTP requests in a workflow.
 */

import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { HttpRequestNode } from "@workflow/nodes"
import { JavaScriptExecutionNode } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"

async function main() {
  // Create workflow
  const workflow = new Workflow("http-integration-workflow")

  // Create trigger
  // nodeType is automatically set from class definition
  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    version: 1,
    position: [0, 0],
  })

  // Create HTTP request node
  // nodeType is automatically set from class definition
  // isTrigger defaults to false, so it can be omitted
  const httpNode = new HttpRequestNode({
    id: "http-1",
    name: "http-request",
    version: 1,
    position: [100, 0],
  })

  // Configure HTTP request
  httpNode.setup({
    method: "GET",
    url: "https://api.github.com/users/octocat",
    headers: {
      "User-Agent": "Workflow-Engine",
    },
    timeout: 5000,
  })

  // Create processing node
  // nodeType is automatically set from class definition
  // isTrigger defaults to false, so it can be omitted
  const processNode = new JavaScriptExecutionNode({
    id: "process-1",
    name: "process",
    version: 1,
    position: [200, 0],
  })

  processNode.setup({
    code: `
      const response = input();
      if (response.error) {
        return { error: response.error.message };
      }

      const data = response.body || {};
      return {
        username: data.login,
        name: data.name,
        followers: data.followers,
        publicRepos: data.public_repos
      };
    `,
  })

  // Add nodes to workflow
  workflow.addNode(trigger)
  workflow.addNode(httpNode)
  workflow.addNode(processNode)

  // Link nodes
  workflow.linkNodes("trigger", "output", "http-request", "input")
  workflow.linkNodes("http-request", "output", "process", "input")

  // Create execution engine
  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  // Execute workflow
  console.log("Executing HTTP integration workflow...")
  trigger.trigger({ output: {} })

  // Wait for execution
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Get result
  const result = processNode.getResult("output")
  console.log("Processed result:", result)
}

main().catch(console.error)

