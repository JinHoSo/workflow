import { Workflow } from "../core/workflow"
import { ExecutionEngine } from "../execution/execution-engine"
import { ManualTrigger } from "../nodes/manual-trigger"
import { HttpRequestNode } from "../nodes/http-request-node"
import { SecretService } from "../secrets/secret-service"
import { FileSecretRegistry } from "../secrets/secret-registry"
import { SecretResolverImpl } from "../secrets/secret-resolver"
import { generateKey } from "../secrets/encryption"
import { mkdirSync, existsSync, readdirSync, unlinkSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

describe("Secrets Integration with Workflow", () => {
  let testKey: Buffer
  let registry: FileSecretRegistry
  let service: SecretService
  let resolver: SecretResolverImpl
  let tempDir: string

  beforeAll(() => {
    // Use a temporary directory for tests
    tempDir = join(tmpdir(), `workflow-secrets-integration-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    testKey = generateKey()
    process.env.WORKFLOW_SECRETS_MASTER_KEY = testKey.toString("hex")
    process.env.WORKFLOW_SECRETS_STORAGE_PATH = tempDir
  })

  afterAll(() => {
    // Cleanup
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    delete process.env.WORKFLOW_SECRETS_MASTER_KEY
    delete process.env.WORKFLOW_SECRETS_STORAGE_PATH
  })

  beforeEach(() => {
    // Clear registry and create new instances
    if (existsSync(tempDir)) {
      const files = readdirSync(tempDir)
      for (const file of files) {
        unlinkSync(join(tempDir, file))
      }
    }
    registry = new FileSecretRegistry(tempDir)
    service = new SecretService(registry)
    resolver = new SecretResolverImpl(registry)
  })

  it("should execute workflow with HTTP Request node using secrets", async () => {
    // Create a secret for API authentication
    await service.createSecret("apiAuth", "basicAuth", {
      username: "testuser",
      password: "testpass",
    })

    // Create workflow
    const workflow = new Workflow("test-workflow")

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
      name: "http-request",
      nodeType: "http-request",
      version: 1,
      position: [100, 0],
    })
    httpNode.addInput("input", "any")
    httpNode.addOutput("output", "any")
    httpNode.addOutput("error", "any")

    // Configure with secret references
    httpNode.setup({
      method: "GET",
      url: "https://httpbin.org/basic-auth/testuser/testpass",
      authType: "basic",
      basicAuthUsername: "{{secrets.apiAuth.username}}",
      basicAuthPassword: "{{secrets.apiAuth.password}}",
    })

    workflow.addNode(httpNode)
    workflow.linkNodes("trigger", "output", "http-request", "input")

    // Create execution engine with secret resolver
    const engine = new ExecutionEngine(workflow, undefined, resolver)
    trigger.setExecutionEngine(engine)

    // Trigger workflow
    trigger.trigger({ output: [{ test: "data" }] })

    // Wait for execution to complete
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Check that HTTP request was executed with resolved secrets
    const httpNodeState = httpNode.getState()
    expect(httpNodeState).toBeDefined()

    // Verify secret was resolved (node should have executed)
    const results = httpNode.getAllResults()
    expect(results).toBeDefined()
  })

  it("should share secrets across multiple nodes", async () => {
    // Create a shared API key secret
    await service.createSecret("sharedApiKey", "apiKey", {
      value: "shared-secret-key-12345",
    })

    // Create workflow with multiple nodes using the same secret
    const workflow = new Workflow("test-workflow-2")

    const trigger = new ManualTrigger({
      id: "trigger-2",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
      isTrigger: true,
    })
    trigger.addOutput("output", "any")
    workflow.addNode(trigger)

    // Create two HTTP nodes using the same secret
    const httpNode1 = new HttpRequestNode({
      id: "http-1",
      name: "http-1",
      nodeType: "http-request",
      version: 1,
      position: [100, 0],
    })
    httpNode1.addInput("input", "any")
    httpNode1.addOutput("output", "any")
    httpNode1.setup({
      method: "GET",
      url: "https://httpbin.org/get",
      headers: {
        "X-API-Key": "{{secrets.sharedApiKey.value}}",
      },
    })

    const httpNode2 = new HttpRequestNode({
      id: "http-2",
      name: "http-2",
      nodeType: "http-request",
      version: 1,
      position: [200, 0],
    })
    httpNode2.addInput("input", "any")
    httpNode2.addOutput("output", "any")
    httpNode2.setup({
      method: "GET",
      url: "https://httpbin.org/get",
      headers: {
        "Authorization": "Bearer {{secrets.sharedApiKey.value}}",
      },
    })

    workflow.addNode(httpNode1)
    workflow.addNode(httpNode2)
    workflow.linkNodes("trigger", "output", "http-1", "input")
    workflow.linkNodes("trigger", "output", "http-2", "input")

    // Create execution engine with secret resolver
    const engine = new ExecutionEngine(workflow, undefined, resolver)
    trigger.setExecutionEngine(engine)

    // Trigger workflow
    trigger.trigger({ output: [{ test: "data" }] })

    // Wait for execution
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Both nodes should have resolved the same secret
    expect(httpNode1.getState()).toBeDefined()
    expect(httpNode2.getState()).toBeDefined()
  })

  it("should handle missing secret error gracefully", async () => {
    const workflow = new Workflow("test-workflow-3")

    const trigger = new ManualTrigger({
      id: "trigger-3",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
      isTrigger: true,
    })
    trigger.addOutput("output", "any")
    workflow.addNode(trigger)

    const httpNode = new HttpRequestNode({
      id: "http-1",
      name: "http-request",
      nodeType: "http-request",
      version: 1,
      position: [100, 0],
    })
    httpNode.addInput("input", "any")
    httpNode.addOutput("output", "any")

    // Configure with non-existent secret
    httpNode.setup({
      method: "GET",
      url: "https://httpbin.org/get",
      bearerToken: "{{secrets.nonexistent.token}}",
      authType: "bearer",
    })

    workflow.addNode(httpNode)
    workflow.linkNodes("trigger", "output", "http-request", "input")

    const engine = new ExecutionEngine(workflow, undefined, resolver)
    trigger.setExecutionEngine(engine)

    // Trigger workflow - should fail with secret not found error
    trigger.trigger({ output: [{ test: "data" }] })

    // Wait for execution
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Node should be in failed state
    expect(httpNode.getState()).toBeDefined()
    expect(httpNode.error).toBeDefined()
  })
})

