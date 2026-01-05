/**
 * Tests for Workflow class
 * Tests node management, connection management, state management, and import/export
 */

import { Workflow } from "../workflow"
import { BaseNode } from "../base-node"
import { NodeTypeRegistryImpl } from "../node-type-registry"
import type { NodeProperties, ExecutionContext, NodeOutput } from "@workflow/interfaces"
import { NodeState, WorkflowState } from "@workflow/interfaces"

/**
 * Test node implementation
 */
class TestNode extends BaseNode {
  protected async process(_context: ExecutionContext): Promise<NodeOutput> {
    return { output: [] }
  }
}

describe("Workflow", () => {
  let workflow: Workflow
  let node1: TestNode
  let node2: TestNode

  beforeEach(() => {
    workflow = new Workflow("test-workflow-1", undefined, "Test Workflow")
    const properties1: NodeProperties = {
      id: "node-1",
      name: "Node1",
      nodeType: "test-node",
      version: 1,
      position: [0, 0],
    }
    const properties2: NodeProperties = {
      id: "node-2",
      name: "Node2",
      nodeType: "test-node",
      version: 1,
      position: [100, 0],
    }
    node1 = new TestNode(properties1)
    node2 = new TestNode(properties2)
  })

  describe("constructor", () => {
    it("should create workflow with id", () => {
      expect(workflow.id).toBe("test-workflow-1")
    })

    it("should create workflow with name", () => {
      expect(workflow.name).toBe("Test Workflow")
    })

    it("should initialize with empty nodes", () => {
      expect(Object.keys(workflow.nodes)).toHaveLength(0)
    })

    it("should initialize in Idle state", () => {
      expect(workflow.state).toBe(WorkflowState.Idle)
    })

    it("should create node type registry if not provided", () => {
      expect(workflow.nodeTypeRegistry).toBeDefined()
    })

    it("should accept initial nodes", () => {
      const workflowWithNodes = new Workflow("test-2", undefined, undefined, [node1, node2])
      expect(Object.keys(workflowWithNodes.nodes)).toHaveLength(2)
    })
  })

  describe("node management", () => {
    it("should add node to workflow", () => {
      workflow.addNode(node1)
      expect(workflow.nodes["Node1"]).toBe(node1)
    })

    it("should remove node from workflow", () => {
      workflow.addNode(node1)
      workflow.removeNode("Node1")
      expect(workflow.nodes["Node1"]).toBeUndefined()
    })

    it("should remove node links when removing node", () => {
      node1.addOutput("output", "string")
      node2.addInput("input", "string")
      workflow.addNode(node1)
      workflow.addNode(node2)
      workflow.linkNodes("Node1", "output", "Node2", "input")
      workflow.removeNode("Node1")
      expect(workflow.linksBySource["Node1"]).toBeUndefined()
    })

    it("should set nodes", () => {
      workflow.setNodes([node1, node2])
      expect(Object.keys(workflow.nodes)).toHaveLength(2)
      expect(workflow.nodes["Node1"]).toBe(node1)
      expect(workflow.nodes["Node2"]).toBe(node2)
    })
  })

  describe("connection management", () => {
    beforeEach(() => {
      node1.addOutput("output", "string")
      node2.addInput("input", "string")
      workflow.addNode(node1)
      workflow.addNode(node2)
    })

    it("should link nodes", () => {
      workflow.linkNodes("Node1", "output", "Node2", "input")
      expect(workflow.linksBySource["Node1"]).toBeDefined()
      expect(workflow.linksBySource["Node1"]["input"]).toBeDefined()
      expect(workflow.linksBySource["Node1"]["input"][0].targetNode).toBe("Node2")
    })

    it("should throw error when linking non-existent source node", () => {
      expect(() => {
        workflow.linkNodes("NonExistent", "output", "Node2", "input")
      }).toThrow("Source or target node not found")
    })

    it("should throw error when linking non-existent target node", () => {
      expect(() => {
        workflow.linkNodes("Node1", "output", "NonExistent", "input")
      }).toThrow("Source or target node not found")
    })

    it("should throw error when source output port not found", () => {
      expect(() => {
        workflow.linkNodes("Node1", "nonexistent", "Node2", "input")
      }).toThrow("Source output port not found")
    })

    it("should throw error when target input port not found", () => {
      expect(() => {
        workflow.linkNodes("Node1", "output", "Node2", "nonexistent")
      }).toThrow("Target input port not found")
    })

    it("should throw error when port types mismatch", () => {
      node2.addInput("input2", "number")
      expect(() => {
        workflow.linkNodes("Node1", "output", "Node2", "input2")
      }).toThrow("Port type mismatch")
    })

    it("should unlink nodes", () => {
      workflow.linkNodes("Node1", "output", "Node2", "input")
      workflow.unlinkNodes("Node1", "output", "Node2", "input")
      expect(workflow.linksBySource["Node1"]?.["input"]).toBeUndefined()
    })

    it("should throw error when unlinking non-existent link", () => {
      expect(() => {
        workflow.unlinkNodes("Node1", "output", "Node2", "input")
      }).toThrow("Link does not exist")
    })

    it("should update linksByTarget when linking", () => {
      workflow.linkNodes("Node1", "output", "Node2", "input")
      expect(workflow.linksByTarget["Node2"]).toBeDefined()
      expect(workflow.linksByTarget["Node2"]["input"]).toBeDefined()
    })
  })

  describe("state management", () => {
    it("should reset workflow to Idle state", () => {
      workflow.state = WorkflowState.Running
      workflow.reset()
      expect(workflow.state).toBe(WorkflowState.Idle)
    })

    it("should reset regular nodes but not trigger nodes", () => {
      const triggerProperties: NodeProperties = {
        id: "trigger-1",
        name: "Trigger1",
        nodeType: "trigger",
        version: 1,
        position: [0, 0],
        isTrigger: true,
      }
      const triggerNode = new TestNode(triggerProperties)
      workflow.addNode(node1)
      workflow.addNode(triggerNode)
      // Set nodes to Running first, then Completed (valid state transition)
      node1.setState(NodeState.Running)
      node1.setState(NodeState.Completed)
      triggerNode.setState(NodeState.Running)
      triggerNode.setState(NodeState.Completed)
      workflow.reset()
      expect(node1.getState()).toBe(NodeState.Idle)
      expect(triggerNode.getState()).toBe(NodeState.Completed)
    })
  })

  describe("static data and settings", () => {
    it("should set static data", () => {
      workflow.setStaticData({ key: "value" })
      expect(workflow.staticData).toEqual({ key: "value" })
    })

    it("should merge static data", () => {
      workflow.setStaticData({ key1: "value1" })
      workflow.setStaticData({ key2: "value2" })
      expect(workflow.staticData).toEqual({ key1: "value1", key2: "value2" })
    })

    it("should update settings", () => {
      workflow.updateSettings({ timezone: "UTC" })
      expect(workflow.settings).toEqual({ timezone: "UTC" })
    })

    it("should merge settings", () => {
      workflow.updateSettings({ timezone: "UTC" })
      workflow.updateSettings({ errorHandling: "stop" })
      expect(workflow.settings).toEqual({ timezone: "UTC", errorHandling: "stop" })
    })

    it("should set mock data", () => {
      const mockData = { Node1: { output: [{ test: "data" }] } }
      workflow.setMockData(mockData)
      expect(workflow.mockData).toEqual(mockData)
    })
  })

  describe("export and import", () => {
    beforeEach(() => {
      node1.addOutput("output", "string")
      node2.addInput("input", "string")
      workflow.addNode(node1)
      workflow.addNode(node2)
      workflow.linkNodes("Node1", "output", "Node2", "input")
    })

    it("should export workflow to JSON", () => {
      const exported = workflow.export()
      expect(exported).toBeDefined()
      const parsed = JSON.parse(exported)
      expect(parsed.id).toBe("test-workflow-1")
      expect(parsed.nodes).toBeDefined()
      expect(Array.isArray(parsed.nodes)).toBe(true)
    })

    it("should include nodes in export", () => {
      const exported = workflow.export()
      const parsed = JSON.parse(exported)
      expect(parsed.nodes.length).toBe(2)
    })

    it("should include links in export", () => {
      const exported = workflow.export()
      const parsed = JSON.parse(exported)
      expect(parsed.linksBySource).toBeDefined()
      expect(parsed.linksBySource["Node1"]).toBeDefined()
    })

    it("should throw error on invalid JSON import", () => {
      expect(() => {
        Workflow.import("invalid json")
      }).toThrow("Invalid JSON format")
    })

    it("should throw error on missing required fields", () => {
      const invalidData = { version: 1 }
      expect(() => {
        Workflow.import(JSON.stringify(invalidData))
      }).toThrow("Missing or invalid")
    })
  })

  describe("node type validation", () => {
    it("should validate node type availability", () => {
      workflow.addNode(node1)
      const registry = new NodeTypeRegistryImpl()
      const result = workflow.validateNodeTypeAvailability(registry)
      expect(result.valid).toBe(false)
      expect(result.missingTypes.length).toBeGreaterThan(0)
    })

    it("should get nodes with unavailable types", () => {
      workflow.addNode(node1)
      const registry = new NodeTypeRegistryImpl()
      const unavailable = workflow.getNodesWithUnavailableTypes(registry)
      expect(unavailable).toContain("Node1")
    })

    it("should remove nodes with unavailable types", () => {
      workflow.addNode(node1)
      const registry = new NodeTypeRegistryImpl()
      const removed = workflow.removeNodesWithUnavailableTypes(registry)
      expect(removed).toContain("Node1")
      expect(workflow.nodes["Node1"]).toBeUndefined()
    })
  })
})

