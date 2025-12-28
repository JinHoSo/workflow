import { Workflow } from "../core/workflow"
import { WorkflowNodeBase } from "../core/base-node"
import type { NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"

class TestNode extends WorkflowNodeBase {
  protected process(context: ExecutionContext): NodeOutput {
    return context.input
  }
}

describe("Workflow", () => {
  let workflow: Workflow

  beforeEach(() => {
    workflow = new Workflow("test-workflow")
  })

  test("should create workflow with id", () => {
    expect(workflow.id).toBe("test-workflow")
  })

  test("should add node", () => {
    const node = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
    workflow.addNode(node)
    expect(workflow.nodes["node1"]).toBe(node)
  })

  test("should link nodes", () => {
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

    expect(workflow.linksBySource["node1"]["input"]).toBeDefined()
    expect(workflow.linksByTarget["node2"]["input"]).toBeDefined()
  })

  test("should reject link with type mismatch", () => {
    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
    node1.addOutput("output", "data1")

    const node2 = new TestNode({
      id: "node-2",
      name: "node2",
      nodeType: "test",
      version: 1,
      position: [100, 0],
    })
    node2.addInput("input", "data2")

    workflow.addNode(node1)
    workflow.addNode(node2)

    expect(() => {
      workflow.linkNodes("node1", "output", "node2", "input")
    }).toThrow("Port type mismatch")
  })

  test("should allow multiple nodes to link to the same input", () => {
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
    node2.addOutput("output", "data")

    const node3 = new TestNode({
      id: "node-3",
      name: "node3",
      nodeType: "test",
      version: 1,
      position: [200, 0],
    })
    node3.addInput("input", "data")

    workflow.addNode(node1)
    workflow.addNode(node2)
    workflow.addNode(node3)

    // node1과 node2가 모두 node3의 input에 연결
    workflow.linkNodes("node1", "output", "node3", "input")
    workflow.linkNodes("node2", "output", "node3", "input")

    // node3의 input에 2개의 link가 있어야 함
    expect(workflow.linksByTarget["node3"]["input"]).toHaveLength(2)
    expect(workflow.linksByTarget["node3"]["input"][0].targetNode).toBe("node1")
    expect(workflow.linksByTarget["node3"]["input"][1].targetNode).toBe("node2")
    expect(workflow.linksByTarget["node3"]["input"][0].outputPortName).toBe("output")
    expect(workflow.linksByTarget["node3"]["input"][1].outputPortName).toBe("output")
  })

  test("should allow same node's different outputs to link to same input", () => {
    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
    node1.addOutput("output1", "data")
    node1.addOutput("output2", "data")

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

    // node1의 output1과 output2가 모두 node2의 input에 연결
    workflow.linkNodes("node1", "output1", "node2", "input")
    workflow.linkNodes("node1", "output2", "node2", "input")

    // node2의 input에 2개의 link가 있어야 함
    expect(workflow.linksByTarget["node2"]["input"]).toHaveLength(2)
    expect(workflow.linksByTarget["node2"]["input"][0].outputPortName).toBe("output1")
    expect(workflow.linksByTarget["node2"]["input"][1].outputPortName).toBe("output2")
  })

  test("should correctly identify output ports by name when multiple nodes link to same input", () => {
    // 여러 노드가 같은 input에 연결될 때, 각 link가 올바른 output 포트 이름을 가지고 있는지 확인
    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
    node1.addOutput("output1", "data")
    node1.addOutput("output2", "data")

    const node2 = new TestNode({
      id: "node-2",
      name: "node2",
      nodeType: "test",
      version: 1,
      position: [100, 0],
    })
    node2.addOutput("output", "data")

    const node3 = new TestNode({
      id: "node-3",
      name: "node3",
      nodeType: "test",
      version: 1,
      position: [200, 0],
    })
    node3.addInput("input", "data")

    workflow.addNode(node1)
    workflow.addNode(node2)
    workflow.addNode(node3)

    // node1의 output1과 output2, 그리고 node2의 output이 모두 node3의 input에 연결
    workflow.linkNodes("node1", "output1", "node3", "input")
    workflow.linkNodes("node1", "output2", "node3", "input")
    workflow.linkNodes("node2", "output", "node3", "input")

    // node3의 input에 3개의 link가 있어야 함
    expect(workflow.linksByTarget["node3"]["input"]).toHaveLength(3)

    // 각 link가 올바른 output 포트 이름을 가지고 있는지 확인
    const links = workflow.linksByTarget["node3"]["input"]
    const outputPortNames = links.map((link) => link.outputPortName).sort()
    expect(outputPortNames).toEqual(["output", "output1", "output2"])

    // 각 link가 올바른 source 노드를 가리키는지 확인
    const sourceNodes = links.map((link) => link.targetNode).sort()
    expect(sourceNodes).toEqual(["node1", "node1", "node2"])
  })
})
