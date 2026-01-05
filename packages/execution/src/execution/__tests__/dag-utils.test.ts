/**
 * Tests for DAG utilities
 * Tests dependency graph building, topological sort, cycle detection, and independent node identification
 */

import { buildDependencyGraph, detectCycles, topologicalSort, getIndependentNodes } from "../dag-utils"
import { Workflow, BaseNode } from "@workflow/core"
import type { NodePropertiesInput, ExecutionContext, NodeOutput } from "@workflow/interfaces"

/**
 * Test node implementation
 */
class TestNode extends BaseNode {
  static readonly nodeType = "test-node"

  constructor(properties: NodePropertiesInput) {
    super({
      ...properties,
      nodeType: TestNode.nodeType,
    })
  }

  protected async process(_context: ExecutionContext): Promise<NodeOutput> {
    return { output: [] }
  }
}

describe("DAG Utilities", () => {
  describe("buildDependencyGraph", () => {
    it("should build dependency graph from workflow", () => {
      const workflow = new Workflow("test-workflow")
      // nodeType is automatically set from class definition
      const node1Properties: NodePropertiesInput = {
        id: "1",
        name: "Node1",
        version: 1,
        position: [0, 0] as [number, number],
      }
      const node2Properties: NodePropertiesInput = {
        id: "2",
        name: "Node2",
        version: 1,
        position: [100, 0] as [number, number],
      }
      const node1 = new TestNode(node1Properties)
      const node2 = new TestNode(node2Properties)
      node1.addOutput("output", "string")
      node2.addInput("input", "string")
      workflow.addNode(node1)
      workflow.addNode(node2)
      workflow.linkNodes("Node1", "output", "Node2", "input")
      const graph = buildDependencyGraph(workflow)
      expect(graph["Node2"]).toContain("Node1")
      expect(graph["Node1"]).toEqual([])
    })

    it("should handle workflow with no connections", () => {
      const workflow = new Workflow("test-workflow")
      // nodeType is automatically set from class definition
      const node1Properties: NodePropertiesInput = {
        id: "1",
        name: "Node1",
        version: 1,
        position: [0, 0] as [number, number],
      }
      const node1 = new TestNode(node1Properties)
      workflow.addNode(node1)
      const graph = buildDependencyGraph(workflow)
      expect(graph["Node1"]).toEqual([])
    })

    it("should handle multiple dependencies", () => {
      const workflow = new Workflow("test-workflow")
      // nodeType is automatically set from class definition
      const node1Properties: NodePropertiesInput = {
        id: "1",
        name: "Node1",
        version: 1,
        position: [0, 0] as [number, number],
      }
      const node2Properties: NodePropertiesInput = {
        id: "2",
        name: "Node2",
        version: 1,
        position: [100, 0] as [number, number],
      }
      const node3Properties: NodePropertiesInput = {
        id: "3",
        name: "Node3",
        version: 1,
        position: [200, 0] as [number, number],
      }
      const node1 = new TestNode(node1Properties)
      const node2 = new TestNode(node2Properties)
      const node3 = new TestNode(node3Properties)
      node1.addOutput("output", "string")
      node2.addOutput("output", "string")
      node3.addInput("input1", "string")
      node3.addInput("input2", "string")
      workflow.addNode(node1)
      workflow.addNode(node2)
      workflow.addNode(node3)
      workflow.linkNodes("Node1", "output", "Node3", "input1")
      workflow.linkNodes("Node2", "output", "Node3", "input2")
      const graph = buildDependencyGraph(workflow)
      expect(graph["Node3"]).toContain("Node1")
      expect(graph["Node3"]).toContain("Node2")
    })
  })

  describe("detectCycles", () => {
    it("should detect no cycles in acyclic graph", () => {
      const graph = {
        Node1: [],
        Node2: ["Node1"],
        Node3: ["Node2"],
      }
      const cycles = detectCycles(graph)
      expect(cycles).toEqual([])
    })

    it("should detect simple cycle", () => {
      const graph = {
        Node1: ["Node2"],
        Node2: ["Node1"],
      }
      const cycles = detectCycles(graph)
      expect(cycles.length).toBeGreaterThan(0)
    })

    it("should detect complex cycle", () => {
      const graph = {
        Node1: ["Node2"],
        Node2: ["Node3"],
        Node3: ["Node1"],
      }
      const cycles = detectCycles(graph)
      expect(cycles.length).toBeGreaterThan(0)
    })
  })

  describe("topologicalSort", () => {
    it("should sort nodes in dependency order", () => {
      const graph = {
        Node1: [],
        Node2: ["Node1"],
        Node3: ["Node2"],
      }
      const levels = topologicalSort(graph)
      expect(levels[0]).toContain("Node1")
      expect(levels[1]).toContain("Node2")
      expect(levels[2]).toContain("Node3")
    })

    it("should group independent nodes at same level", () => {
      const graph = {
        Node1: [],
        Node2: [],
        Node3: ["Node1", "Node2"],
      }
      const levels = topologicalSort(graph)
      expect(levels[0].length).toBe(2)
      expect(levels[0]).toContain("Node1")
      expect(levels[0]).toContain("Node2")
      expect(levels[1]).toContain("Node3")
    })

    it("should throw error on circular dependencies", () => {
      const graph = {
        Node1: ["Node2"],
        Node2: ["Node1"],
      }
      expect(() => {
        topologicalSort(graph)
      }).toThrow("Circular dependencies detected")
    })
  })

  describe("getIndependentNodes", () => {
    it("should identify independent nodes at same level", () => {
      const graph = {
        Node1: [],
        Node2: [],
        Node3: [],
      }
      const level = ["Node1", "Node2", "Node3"]
      const independent = getIndependentNodes(graph, level)
      expect(independent.length).toBe(3)
    })

    it("should exclude nodes that depend on each other", () => {
      const graph = {
        Node1: ["Node2"],
        Node2: [],
        Node3: [],
      }
      const level = ["Node1", "Node2", "Node3"]
      const independent = getIndependentNodes(graph, level)
      expect(independent).not.toContain("Node1")
      expect(independent).toContain("Node2")
      expect(independent).toContain("Node3")
    })
  })
})

