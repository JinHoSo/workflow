/**
 * Example: Using Secrets in Workflows
 *
 * This example demonstrates how to use the secrets management system
 * to securely store and use authentication credentials in workflows.
 */

import { Workflow } from "../src/core/workflow"
import { ExecutionEngine } from "../src/execution/execution-engine"
import { ManualTrigger } from "../src/triggers/manual-trigger"
import { HttpRequestNode } from "../src/nodes/http-request-node"
import { SecretService } from "../src/secrets/secret-service"
import { FileSecretRegistry } from "../src/secrets/secret-registry"
import { SecretResolverImpl } from "../src/secrets/secret-resolver"

async function example() {
  // 1. Set up secrets storage
  // In production, set WORKFLOW_SECRETS_MASTER_KEY environment variable
  // For this example, we'll use a temporary directory
  const tempDir = "/tmp/workflow-secrets-example"
  const registry = new FileSecretRegistry(tempDir)
  const service = new SecretService(registry)
  const resolver = new SecretResolverImpl(registry)

  // 2. Create secrets
  // Create a Basic Auth secret
  await service.createSecret(
    "apiAuth",
    "basicAuth",
    {
      username: "myuser",
      password: "mypassword",
    },
    {
      description: "API authentication credentials",
      tags: ["api", "auth"],
    },
  )

  // Create an API Key secret
  await service.createSecret(
    "apiKey",
    "apiKey",
    {
      value: "sk-1234567890abcdef",
    },
    {
      description: "API key for external service",
    },
  )

  // Create a Bearer Token secret
  await service.createSecret(
    "bearerToken",
    "bearerToken",
    {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  )

  // 3. Create workflow
  const workflow = new Workflow("example-workflow")

  // Create trigger
  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    nodeType: "manual-trigger",
    version: 1,
    position: [0, 0],
    isTrigger: true,
  })
  trigger.addOutput("output", "any")
  workflow.addNode(trigger)

  // Create HTTP Request node with secret references
  const httpNode = new HttpRequestNode({
    id: "http-1",
    name: "api-call",
    nodeType: "http-request",
    version: 1,
    position: [100, 0],
  })
  httpNode.addInput("input", "any")
  httpNode.addOutput("output", "any")
  httpNode.addOutput("error", "any")

  // Configure with secret references
  // Secrets are resolved automatically during execution
  httpNode.setup({
    method: "GET",
    url: "https://api.example.com/data",
    authType: "basic",
    // Use secret references instead of hardcoded credentials
    basicAuthUsername: "{{secrets.apiAuth.username}}",
    basicAuthPassword: "{{secrets.apiAuth.password}}",
    headers: {
      "X-API-Key": "{{secrets.apiKey.value}}",
    },
  })

  workflow.addNode(httpNode)
  workflow.linkNodes("trigger", "output", "api-call", "input")

  // 4. Create execution engine with secret resolver
  const engine = new ExecutionEngine(workflow, undefined, resolver)
  trigger.setExecutionEngine(engine)

  // 5. Execute workflow
  // Secrets are automatically resolved when the node executes
  trigger.trigger({ output: [{ requestId: "123" }] })

  // 6. List all secrets
  const secrets = await service.listSecrets()
  console.log("Available secrets:", secrets.map((s) => s.metadata.name))

  // 7. Update a secret
  await service.updateSecret("apiKey", {
    value: "sk-new-api-key-12345",
  })

  // 8. Get a secret (decrypted)
  const apiKeySecret = await service.getSecret("apiKey")
  console.log("API Key value:", (apiKeySecret.data as { value: string }).value)

  // 9. Delete a secret
  // await service.deleteSecret("oldSecret")
}

// Run example
if (require.main === module) {
  example().catch(console.error)
}

export { example }

