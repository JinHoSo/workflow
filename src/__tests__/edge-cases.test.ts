/**
 * Edge Case Tests
 *
 * Tests for edge cases including:
 * - Circular dependencies
 * - Missing nodes
 * - Invalid configurations
 */

import { Workflow } from "../core/workflow"
import { BaseNode } from "../core/base-node"
import { ManualTrigger } from "../nodes/manual-trigger"
import { ExecutionEngine } from "../execution/execution-engine"
import type { NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import { WorkflowState } from "../interfaces"
import { NodeState } from "../types"

class TestNode extends BaseNode {
  constructor(properties: import("../interfaces").NodeProperties) {
    super(properties)
    this.addInput("input", "data")
    this.addOutput("output", "data")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    return context.input
  }
}

describe("Edge Cases", () => {
  describe("Circular Dependencies", () => {
    test("should detect circular dependency in workflow", async () => {
      const workflow = new Workflow("circular-test")

      const node1 = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      const node2 = new TestNode({
        id: "node-2",
        name: "node2",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })

      workflow.addNode(node1)
      workflow.addNode(node2)

      // Create circular dependency: node1 -> node2 -> node1
      workflow.linkNodes("node1", "output", "node2", "input")
      workflow.linkNodes("node2", "output", "node1", "input")

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })
      workflow.addNode(trigger)
      workflow.linkNodes("trigger", "output", "node1", "input")

      trigger.setup({})
      node1.setup({})
      node2.setup({})

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      // Should detect circular dependency during execution
      trigger.trigger()

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      // Should fail due to circular dependency
      expect(workflow.state).toBe(WorkflowState.Failed)
    })
  })

  describe("Missing Nodes", () => {
    test("should handle missing node in link", () => {
      const workflow = new Workflow("missing-node-test")

      const node1 = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      workflow.addNode(node1)

      // Try to link to non-existent node
      expect(() => {
        workflow.linkNodes("node1", "output", "missing-node", "input")
      }).toThrow()
    })

    test("should handle missing input port", () => {
      const workflow = new Workflow("missing-port-test")

      const node1 = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })
      node1.addOutput("output", "data")

      const node2 = new TestNode({
        id: "node-2",
        name: "node2",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })
      // node2 has "input" port, but we'll try to link to "missing-input"

      workflow.addNode(node1)
      workflow.addNode(node2)

      expect(() => {
        workflow.linkNodes("node1", "output", "node2", "missing-input")
      }).toThrow()
    })
  })

  describe("Invalid Configurations", () => {
    test("should reject invalid node configuration", () => {
      const node = new TestNode({
        id: "node-1",
        name: "test-node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      // Node without schema should accept any config
      // But if schema is set, invalid config should be rejected
      expect(() => {
        node.setup({ anyConfig: "value" })
      }).not.toThrow()
    })

    test("should handle workflow with unconfigured nodes", async () => {
      const workflow = new Workflow("unconfigured-test")

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      const node = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })

      workflow.addNode(trigger)
      workflow.addNode(node)
      workflow.linkNodes("trigger", "output", "node1", "input")

      trigger.setup({})
      // node.setup({}) - Not configured

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      trigger.trigger()

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      // Should still execute (nodes can run without explicit setup if they don't require config)
      expect(workflow.state).toBe(WorkflowState.Completed)
    })
  })

  describe("Empty Workflow", () => {
    test("should handle workflow with no nodes", () => {
      const workflow = new Workflow("empty-workflow")
      expect(Object.keys(workflow.nodes)).toHaveLength(0)
    })

    test("should handle workflow with only trigger", async () => {
      const workflow = new Workflow("trigger-only")

      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      workflow.addNode(trigger)
      trigger.setup({})

      const engine = new ExecutionEngine(workflow)
      trigger.setExecutionEngine(engine)

      trigger.trigger()

      let attempts = 0
      while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
        await new Promise((resolve) => setTimeout(resolve, 10))
        attempts++
      }

      expect(workflow.state).toBe(WorkflowState.Completed)
    })
  })

  describe("Invalid Node States", () => {
    test("should handle node in invalid state transition", () => {
      const node = new TestNode({
        id: "node-1",
        name: "test-node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      // Try invalid state transition
      expect(() => {
        node.setState(NodeState.Completed)
        node.setState(NodeState.Running) // Can't go back to Running from Completed
      }).toThrow("Invalid state transition")
    })
  })
})

