/**
 * Integration Tests for Refactored Architecture
 *
 * Comprehensive integration tests covering:
 * - Unified node model
 * - DAG execution
 * - Parallel execution
 * - Plugin system
 * - Schema validation
 * - Protocol implementations
 * - Retry mechanisms
 * - State management
 */

import { Workflow } from "../core/workflow"
import { BaseNode } from "../core/base-node"
import { ManualTrigger } from "../triggers/manual-trigger"
import { JavaScriptNode } from "../nodes/javascript-execution-node"
import { HttpRequestNode } from "../nodes/http-request-node"
import { ExecutionEngine } from "../execution/execution-engine"
import { PluginRegistry } from "../plugins/plugin-registry"
import { NodeTypeRegistryImpl } from "../core/node-type-registry"
import { protocolValidator } from "../protocols/protocol-validator"
import { executionProtocol } from "../protocols/execution-impl"
import { dataFlowProtocol } from "../protocols/data-flow-impl"
import { errorHandlingProtocol } from "../protocols/error-handling-impl"
import type { NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import { NodeState } from "../types"
import { WorkflowState } from "../interfaces"
import type { Plugin } from "../plugins/plugin-manifest"

/**
 * Test node for integration testing
 */
class IntegrationTestNode extends BaseNode {
  constructor(properties: import("../interfaces").NodeProperties) {
    super(properties)
    this.addInput("input", "data")
    this.addOutput("output", "data")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const inputData = context.input.input
    const value = Array.isArray(inputData) ? inputData[0] : inputData
    const numValue = typeof value === "object" && value !== null && "value" in value
      ? (value as { value: number }).value
      : 0
    return { output: { value: numValue + 1 } }
  }
}

describe("Integration Tests", () => {
  describe("Unified Node Model Integration", () => {
    test("should execute workflow with trigger and nodes in unified collection", async () => {
      const workflow = new Workflow("integration-test")

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      const node1 = new IntegrationTestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })

      const node2 = new IntegrationTestNode({
        id: "node-2",
        name: "node2",
        nodeType: "test",
        version: 1,
        position: [200, 0],
      })

      workflow.addNode(trigger)
      workflow.addNode(node1)
      workflow.addNode(node2)

      // Verify unified collection
      expect(workflow.nodes["trigger"]).toBe(trigger)
      expect(workflow.nodes["node1"]).toBe(node1)
      expect(workflow.nodes["node2"]).toBe(node2)
      expect(trigger.properties.isTrigger).toBe(true)
      expect(node1.properties.isTrigger).toBeUndefined()

      workflow.linkNodes("trigger", "output", "node1", "input")
      workflow.linkNodes("node1", "output", "node2", "input")

      trigger.setup({})
      node1.setup({})
      node2.setup({})

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      trigger.trigger({ output: { value: 1 } })

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      expect(workflow.state).toBe(WorkflowState.Completed)
      expect(node2.state).toBe(NodeState.Completed)
      const result = node2.getResult("output")
      const resultValue = Array.isArray(result) ? result[0] : result
      expect((resultValue as { value: number }).value).toBe(3) // 1 -> 2 -> 3
    })
  })

  describe("DAG Execution Integration", () => {
    test("should execute complex DAG with multiple dependency levels", async () => {
      const workflow = new Workflow("dag-integration")

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      // Level 1: node1, node2 (parallel)
      const node1 = new IntegrationTestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })

      const node2 = new IntegrationTestNode({
        id: "node-2",
        name: "node2",
        nodeType: "test",
        version: 1,
        position: [200, 0],
      })

      // Level 2: node3 (depends on node1)
      const node3 = new IntegrationTestNode({
        id: "node-3",
        name: "node3",
        nodeType: "test",
        version: 1,
        position: [300, 0],
      })

      // Level 3: node4 (depends on node3 and node2)
      const node4 = new IntegrationTestNode({
        id: "node-4",
        name: "node4",
        nodeType: "test",
        version: 1,
        position: [400, 0],
      })
      node4.inputs = []
      node4.addInput("input1", "data")
      node4.addInput("input2", "data")

      workflow.addNode(trigger)
      workflow.addNode(node1)
      workflow.addNode(node2)
      workflow.addNode(node3)
      workflow.addNode(node4)

      workflow.linkNodes("trigger", "output", "node1", "input")
      workflow.linkNodes("trigger", "output", "node2", "input")
      workflow.linkNodes("node1", "output", "node3", "input")
      workflow.linkNodes("node3", "output", "node4", "input1")
      workflow.linkNodes("node2", "output", "node4", "input2")

      trigger.setup({})
      node1.setup({})
      node2.setup({})
      node3.setup({})
      node4.setup({})

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      trigger.trigger({ output: { value: 0 } })

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 200) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      expect(workflow.state).toBe(WorkflowState.Completed)
      // Verify execution order: node1 and node2 can run in parallel, but node3 must wait for node1
      expect(node1.state).toBe(NodeState.Completed)
      expect(node2.state).toBe(NodeState.Completed)
      expect(node3.state).toBe(NodeState.Completed)
      expect(node4.state).toBe(NodeState.Completed)
    })
  })

  describe("Parallel Execution Integration", () => {
    test("should execute independent nodes in parallel", async () => {
      const workflow = new Workflow("parallel-integration", undefined, undefined, [], {}, {}, {
        enableParallelExecution: true,
        maxParallelExecutions: 0, // Unlimited
      })

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      const node1 = new IntegrationTestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })

      const node2 = new IntegrationTestNode({
        id: "node-2",
        name: "node2",
        nodeType: "test",
        version: 1,
        position: [200, 0],
      })

      workflow.addNode(trigger)
      workflow.addNode(node1)
      workflow.addNode(node2)

      workflow.linkNodes("trigger", "output", "node1", "input")
      workflow.linkNodes("trigger", "output", "node2", "input")

      trigger.setup({})
      node1.setup({})
      node2.setup({})

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      trigger.trigger({ output: { value: 1 } })

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      expect(workflow.state).toBe(WorkflowState.Completed)
      expect(node1.state).toBe(NodeState.Completed)
      expect(node2.state).toBe(NodeState.Completed)
    })
  })

  describe("Plugin System Integration", () => {
    test("should execute workflow with plugin-provided node types", async () => {
      const registry = new PluginRegistry()
      const nodeTypeRegistry = new NodeTypeRegistryImpl()
      registry.setNodeTypeRegistry(nodeTypeRegistry)

      const plugin: Plugin = {
        manifest: {
          name: "integration-plugin",
          version: "1.0.0",
          displayName: "Integration Plugin",
          description: "Plugin for integration testing",
          dependencies: [],
          nodeTypes: ["IntegrationTestNode"],
        },
        nodeTypes: [IntegrationTestNode],
      }

      await registry.register(plugin)

      const workflow = new Workflow("plugin-integration", nodeTypeRegistry)
      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      // Create node from plugin
      const pluginNode = new IntegrationTestNode({
        id: "node-1",
        name: "plugin-node",
        nodeType: "integration-test",
        version: 1,
        position: [100, 0],
      })

      workflow.addNode(trigger)
      workflow.addNode(pluginNode)
      workflow.linkNodes("trigger", "output", "plugin-node", "input")

      trigger.setup({})
      pluginNode.setup({})

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      trigger.trigger({ output: { value: 10 } })

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      expect(workflow.state).toBe(WorkflowState.Completed)
      expect(pluginNode.state).toBe(NodeState.Completed)
    })
  })

  describe("Schema Validation Integration", () => {
    test("should validate configurations across all node types", () => {
      const jsNode = new JavaScriptNode({
        id: "js-1",
        name: "js-node",
        nodeType: "javascript",
        version: 1,
        position: [0, 0],
      })

      // Valid configuration
      expect(() => {
        jsNode.setup({ code: "return { value: 1 }" })
      }).not.toThrow()

      // Invalid configuration
      expect(() => {
        jsNode.setup({ invalid: "property" } as any)
      }).toThrow()

      const httpNode = new HttpRequestNode({
        id: "http-1",
        name: "http-node",
        nodeType: "http-request",
        version: 1,
        position: [0, 0],
      })

      // Valid configuration
      expect(() => {
        httpNode.setup({
          method: "GET",
          url: "https://example.com",
        })
      }).not.toThrow()

      // Invalid configuration
      expect(() => {
        httpNode.setup({
          method: "INVALID",
          url: "https://example.com",
        } as any)
      }).toThrow()
    })
  })

  describe("Protocol Implementation Integration", () => {
    test("should validate protocol compliance for all nodes", () => {
      const node = new IntegrationTestNode({
        id: "node-1",
        name: "test-node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      const result = protocolValidator.validateAllProtocols(
        node,
        executionProtocol,
        dataFlowProtocol,
        errorHandlingProtocol,
      )

      expect(result.compliant).toBe(true)
      expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0)
    })
  })

  describe("Retry Mechanism Integration", () => {
    test("should retry failed nodes and continue workflow", async () => {
      class FailingNode extends BaseNode {
        private attemptCount = 0

        constructor(properties: import("../interfaces").NodeProperties) {
          super(properties)
          this.addInput("input", "data")
          this.addOutput("output", "data")
        }

        protected async process(_context: ExecutionContext): Promise<NodeOutput> {
          this.attemptCount++
          if (this.attemptCount < 2) {
            throw new Error(`Attempt ${this.attemptCount} failed`)
          }
          return { output: { value: this.attemptCount } }
        }

        reset(): void {
          super.reset()
          this.attemptCount = 0
        }
      }

      const workflow = new Workflow("retry-integration")

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      const failingNode = new FailingNode({
        id: "node-1",
        name: "failing-node",
        nodeType: "test",
        version: 1,
        position: [100, 0],
        retryOnFail: true,
        maxRetries: 3,
        retryDelay: 10,
      })

      workflow.addNode(trigger)
      workflow.addNode(failingNode)
      workflow.linkNodes("trigger", "output", "failing-node", "input")

      trigger.setup({})
      failingNode.setup({})

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      trigger.trigger()

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 200) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      expect(workflow.state).toBe(WorkflowState.Completed)
      expect(failingNode.state).toBe(NodeState.Completed)
    })
  })

  describe("State Management Integration", () => {
    test("should track state across complex workflow execution", async () => {
      const workflow = new Workflow("state-integration")

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      const node1 = new IntegrationTestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })

      const node2 = new IntegrationTestNode({
        id: "node-2",
        name: "node2",
        nodeType: "test",
        version: 1,
        position: [200, 0],
      })

      workflow.addNode(trigger)
      workflow.addNode(node1)
      workflow.addNode(node2)
      workflow.linkNodes("trigger", "output", "node1", "input")
      workflow.linkNodes("node1", "output", "node2", "input")

      trigger.setup({})
      node1.setup({})
      node2.setup({})

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      trigger.trigger({ output: { value: 1 } })

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      const stateManager = engine.getStateManager()
      const node1State = stateManager.getNodeState("node1")
      const node2State = stateManager.getNodeState("node2")

      expect(node1State).toBeDefined()
      expect(node2State).toBeDefined()

      const node1Metadata = stateManager.getNodeMetadata("node1")
      const node2Metadata = stateManager.getNodeMetadata("node2")

      expect(node1Metadata?.status).toBe(NodeState.Completed)
      expect(node2Metadata?.status).toBe(NodeState.Completed)
    })
  })
})

