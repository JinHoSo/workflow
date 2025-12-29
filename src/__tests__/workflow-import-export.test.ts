import { Workflow } from "../core/workflow"
import { WorkflowNodeBase } from "../core/base-node"
import { ManualTrigger } from "../triggers/manual-trigger"
import { JavaScriptNode } from "../nodes/javascript-execution-node"
import type { NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import type { SerializedNode, NodeFactory } from "../interfaces"
import { NodeState } from "../types"

/**
 * Test node for testing import/export
 */
class TestNode extends WorkflowNodeBase {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    return context.input
  }
}

/**
 * Node factory for testing
 * Creates node instances based on nodeType
 */
function createTestNodeFactory(): NodeFactory {
  return (serializedNode: SerializedNode) => {
    const { nodeType } = serializedNode.properties
    switch (nodeType) {
      case "manual-trigger":
        return new ManualTrigger(serializedNode.properties)
      case "javascript":
        return new JavaScriptNode(serializedNode.properties)
      case "test":
        return new TestNode(serializedNode.properties)
      default:
        throw new Error(`Unknown node type: ${nodeType}`)
    }
  }
}

describe("Workflow Import/Export", () => {
  describe("Export", () => {
    test("should export workflow with basic data", () => {
      const workflow = new Workflow("test-workflow", undefined, "My Workflow")
      const json = workflow.export()
      const data = JSON.parse(json)

      expect(data.version).toBe(1)
      expect(data.id).toBe("test-workflow")
      expect(data.name).toBe("My Workflow")
      expect(Array.isArray(data.nodes)).toBe(true)
      expect(typeof data.linksBySource).toBe("object")
      expect(typeof data.settings).toBe("object")
      expect(typeof data.staticData).toBe("object")
    })

    test("should export workflow with nodes", () => {
      const workflow = new Workflow("test-workflow")
      const node = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })
      node.addInput("input", "data")
      node.addOutput("output", "data")
      node.setup({ testConfig: "value" })
      node.setAnnotation("Test annotation")

      workflow.addNode(node)

      const json = workflow.export()
      const data = JSON.parse(json)

      expect(data.nodes).toHaveLength(1)
      expect(data.nodes[0].properties.name).toBe("node1")
      expect(data.nodes[0].properties.nodeType).toBe("test")
      expect(data.nodes[0].config.testConfig).toBe("value")
      expect(data.nodes[0].inputs).toHaveLength(1)
      expect(data.nodes[0].outputs).toHaveLength(1)
      expect(data.nodes[0].annotation).toBe("Test annotation")
    })

    test("should export workflow with links", () => {
      const workflow = new Workflow("test-workflow")
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
      node2.addInput("input", "data")

      workflow.addNode(node1)
      workflow.addNode(node2)
      workflow.linkNodes("node1", "output", "node2", "input")

      const json = workflow.export()
      const data = JSON.parse(json)

      expect(data.linksBySource.node1).toBeDefined()
      expect(data.linksBySource.node1.input).toBeDefined()
      expect(data.linksBySource.node1.input[0].targetNode).toBe("node2")
      expect(data.linksBySource.node1.input[0].outputPortName).toBe("output")
    })

    test("should export workflow with settings and staticData", () => {
      const workflow = new Workflow("test-workflow")
      workflow.updateSettings({ timezone: "America/New_York", customSetting: "value" })
      workflow.setStaticData({ webhookId: "webhook-123" })

      const json = workflow.export()
      const data = JSON.parse(json)

      expect(data.settings.timezone).toBe("America/New_York")
      expect(data.settings.customSetting).toBe("value")
      expect(data.staticData.webhookId).toBe("webhook-123")
    })

    test("should export workflow with mockData", () => {
      const workflow = new Workflow("test-workflow")
      const node = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })
      workflow.addNode(node)
      workflow.setMockData({
        node1: {
          output: [{ json: { test: "data" } }],
        },
      })

      const json = workflow.export()
      const data = JSON.parse(json)

      expect(data.mockData).toBeDefined()
      expect(data.mockData.node1).toBeDefined()
      const node1Output = data.mockData.node1.output
      if (Array.isArray(node1Output) && node1Output.length > 0) {
        const firstItem = node1Output[0]
        if (firstItem && typeof firstItem === "object" && "json" in firstItem) {
          const jsonData = firstItem.json
          if (jsonData && typeof jsonData === "object" && "test" in jsonData) {
            expect(jsonData.test).toBe("data")
          }
        }
      }
    })

    test("should not export execution state", () => {
      const workflow = new Workflow("test-workflow")
      const node = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })
      workflow.addNode(node)
      node.setup({})
      // Node is now in Ready state after setup, transition to Running
      node.setState(NodeState.Running)

      const json = workflow.export()
      const data = JSON.parse(json)

      // Execution state should not be in export
      expect(data.nodes[0].state).toBeUndefined()
      expect(data.nodes[0].error).toBeUndefined()
    })
  })

  describe("Import", () => {
    test("should import workflow from valid JSON", () => {
      const originalWorkflow = new Workflow("test-workflow", undefined, "My Workflow")
      const json = originalWorkflow.export()

      const importedWorkflow = Workflow.import(json, createTestNodeFactory())

      expect(importedWorkflow.id).toBe("test-workflow")
      expect(importedWorkflow.name).toBe("My Workflow")
      expect(importedWorkflow.state).toBe(NodeState.Idle)
    })

    test("should import workflow with nodes", () => {
      const originalWorkflow = new Workflow("test-workflow")
      const node = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })
      node.addInput("input", "data")
      node.addOutput("output", "data")
      node.setup({ testConfig: "value" })
      node.setAnnotation("Test annotation")

      originalWorkflow.addNode(node)
      const json = originalWorkflow.export()

      const importedWorkflow = Workflow.import(json, createTestNodeFactory())

      expect(importedWorkflow.nodes.node1).toBeDefined()
      const importedNode = importedWorkflow.nodes.node1
      expect(importedNode.properties.name).toBe("node1")
      expect(importedNode.properties.nodeType).toBe("test")
      expect(importedNode.config.testConfig).toBe("value")
      expect(importedNode.inputs).toHaveLength(1)
      expect(importedNode.outputs).toHaveLength(1)
      expect(importedNode.annotation).toBe("Test annotation")
    })

    test("should import workflow with links", () => {
      const originalWorkflow = new Workflow("test-workflow")
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
      node2.addInput("input", "data")

      originalWorkflow.addNode(node1)
      originalWorkflow.addNode(node2)
      originalWorkflow.linkNodes("node1", "output", "node2", "input")

      const json = originalWorkflow.export()
      const importedWorkflow = Workflow.import(json, createTestNodeFactory())

      expect(importedWorkflow.linksBySource.node1).toBeDefined()
      expect(importedWorkflow.linksBySource.node1.input).toBeDefined()
      expect(importedWorkflow.linksBySource.node1.input[0].targetNode).toBe("node2")
      expect(importedWorkflow.linksByTarget.node2).toBeDefined()
      expect(importedWorkflow.linksByTarget.node2.input).toBeDefined()
    })

    test("should import workflow with settings and staticData", () => {
      const originalWorkflow = new Workflow("test-workflow")
      originalWorkflow.updateSettings({ timezone: "America/New_York", customSetting: "value" })
      originalWorkflow.setStaticData({ webhookId: "webhook-123" })

      const json = originalWorkflow.export()
      const importedWorkflow = Workflow.import(json, createTestNodeFactory())

      expect(importedWorkflow.settings.timezone).toBe("America/New_York")
      expect(importedWorkflow.settings.customSetting).toBe("value")
      expect(importedWorkflow.staticData.webhookId).toBe("webhook-123")
    })

    test("should import workflow with mockData", () => {
      const originalWorkflow = new Workflow("test-workflow")
      const node = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })
      originalWorkflow.addNode(node)
      originalWorkflow.setMockData({
        node1: {
          output: [{ json: { test: "data" } }],
        },
      })

      const json = originalWorkflow.export()
      const importedWorkflow = Workflow.import(json, createTestNodeFactory())

      expect(importedWorkflow.mockData).toBeDefined()
      expect(importedWorkflow.mockData?.node1).toBeDefined()
      const node1MockData = importedWorkflow.mockData?.node1.output
      if (Array.isArray(node1MockData) && node1MockData.length > 0) {
        const firstItem = node1MockData[0]
        if (firstItem && typeof firstItem === "object" && "json" in firstItem) {
          const jsonData = firstItem.json
          if (jsonData && typeof jsonData === "object" && "test" in jsonData) {
            expect(jsonData.test).toBe("data")
          }
        }
      }
    })

    test("should reject invalid JSON", () => {
      const invalidJson = "{ invalid json }"

      expect(() => {
        Workflow.import(invalidJson, createTestNodeFactory())
      }).toThrow("Invalid JSON format")
    })

    test("should reject JSON with missing required fields", () => {
      const invalidData = {
        version: 1,
        // missing id
        nodes: [],
        linksBySource: {},
        settings: {},
        staticData: {},
      }

      expect(() => {
        Workflow.import(JSON.stringify(invalidData), createTestNodeFactory())
      }).toThrow("Missing or invalid id field")
    })

    test("should reject JSON with unsupported version", () => {
      const invalidData = {
        version: 2, // unsupported version
        id: "test-workflow",
        nodes: [],
        linksBySource: {},
        settings: {},
        staticData: {},
      }

      expect(() => {
        Workflow.import(JSON.stringify(invalidData), createTestNodeFactory())
      }).toThrow("Unsupported export format version: 2")
    })

    test("should reject import with invalid link references", () => {
      const invalidData = {
        version: 1,
        id: "test-workflow",
        nodes: [
          {
            properties: {
              id: "node-1",
              name: "node1",
              nodeType: "test",
              version: 1,
              position: [0, 0],
            },
            config: {},
            inputs: [],
            outputs: [],
          },
        ],
        linksBySource: {
          node1: {
            input: [
              {
                targetNode: "non-existent-node",
                linkType: "standard",
                outputPortName: "output",
              },
            ],
          },
        },
        settings: {},
        staticData: {},
      }

      expect(() => {
        Workflow.import(JSON.stringify(invalidData), createTestNodeFactory())
      }).toThrow("Link references non-existent target node: non-existent-node")
    })

    test("should handle round-trip export/import", () => {
      // Create original workflow
      const originalWorkflow = new Workflow("test-workflow", undefined, "My Workflow")
      originalWorkflow.updateSettings({ timezone: "America/New_York" })
      originalWorkflow.setStaticData({ webhookId: "webhook-123" })

      const node1 = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })
      node1.addOutput("output", "data")
      node1.setup({ config1: "value1" })

      const node2 = new TestNode({
        id: "node-2",
        name: "node2",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })
      node2.addInput("input", "data")
      node2.setup({ config2: "value2" })

      originalWorkflow.addNode(node1)
      originalWorkflow.addNode(node2)
      originalWorkflow.linkNodes("node1", "output", "node2", "input")

      // Export and import
      const json = originalWorkflow.export()
      const importedWorkflow = Workflow.import(json, createTestNodeFactory())

      // Verify all data is preserved
      expect(importedWorkflow.id).toBe(originalWorkflow.id)
      expect(importedWorkflow.name).toBe(originalWorkflow.name)
      expect(importedWorkflow.settings.timezone).toBe(originalWorkflow.settings.timezone)
      expect(importedWorkflow.staticData.webhookId).toBe(originalWorkflow.staticData.webhookId)

      expect(Object.keys(importedWorkflow.nodes)).toHaveLength(2)
      expect(importedWorkflow.nodes.node1).toBeDefined()
      expect(importedWorkflow.nodes.node2).toBeDefined()
      expect(importedWorkflow.nodes.node1.config.config1).toBe("value1")
      expect(importedWorkflow.nodes.node2.config.config2).toBe("value2")

      expect(importedWorkflow.linksBySource.node1).toBeDefined()
      expect(importedWorkflow.linksBySource.node1.input[0].targetNode).toBe("node2")
    })
  })
})

