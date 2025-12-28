import { ManualTrigger } from "../triggers/manual-trigger"
import { JavaScriptNode } from "../nodes/javascript-execution-node"
import { Workflow } from "../core/workflow"
import { ExecutionEngine } from "../execution/execution-engine"
import { NodeState } from "../types"
import type { NodeProperties, NodeOutput } from "../interfaces"

describe("ManualTrigger", () => {
  let trigger: ManualTrigger
  let properties: NodeProperties

  beforeEach(() => {
    properties = {
      id: "trigger-1",
      name: "manual-trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    }
    trigger = new ManualTrigger(properties)
  })

  test("should trigger workflow execution", () => {
    let executedData: NodeOutput | undefined
    trigger.setCallback((data) => {
      executedData = data
    })
    trigger.setup({})
    trigger.trigger()
    expect(executedData).toBeDefined()
    expect(trigger.state).toBe(NodeState.Completed)
  })

  test("should trigger with custom data", () => {
    const customData: NodeOutput = { output: { test: "value" } }
    let executedData: NodeOutput | undefined
    trigger.setCallback((data) => {
      executedData = data
    })
    trigger.setup({})
    trigger.trigger(customData)
    expect(executedData).toEqual(customData)
    expect(trigger.state).toBe(NodeState.Completed)
  })

  test("should use initialData from configuration", () => {
    const initialData: NodeOutput = { output: { initial: "data" } }
    let executedData: NodeOutput | undefined
    trigger.setCallback((data) => {
      executedData = data
    })
    trigger.setup({ initialData })
    trigger.trigger()
    expect(executedData).toEqual(initialData)
  })

  test("should throw error if not configured", () => {
    expect(() => {
      trigger.trigger()
    }).toThrow("Trigger must be configured before execution")
  })

  test("should execute workflow: manual-trigger -> js-node1 (1+1) -> js-node2 (input+3)", async () => {
    const workflow = new Workflow("test-workflow")

    // manual-trigger 생성
    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    // javascript execution node1: const a = 1+1 실행 후 a를 리턴
    const jsNode1 = new JavaScriptNode({
      id: "js-node-1",
      name: "js-node1",
      nodeType: "javascript",
      version: 1,
      position: [100, 0],
    })
    jsNode1.setup({
      code: `
        const a = 1 + 1;
        return { value: a };
      `,
    })

    // javascript execution node2: node1 결과를 input으로 받아 input + 3 실행 후 리턴
    const jsNode2 = new JavaScriptNode({
      id: "js-node-2",
      name: "js-node2",
      nodeType: "javascript",
      version: 1,
      position: [200, 0],
    })
    jsNode2.setup({
      code: `
        const inputValue = input().value;
        return { value: inputValue + 3 };
      `,
    })

    // workflow에 노드들 추가
    workflow.addNode(trigger)
    workflow.addNode(jsNode1)
    workflow.addNode(jsNode2)

    // 노드들 연결: trigger -> js-node1 -> js-node2
    workflow.linkNodes("trigger", "output", "js-node1", "input")
    workflow.linkNodes("js-node1", "output", "js-node2", "input")

    // 노드들 설정
    trigger.setup({})

    // ExecutionEngine으로 실행
    const engine = new ExecutionEngine(workflow)

    // trigger 실행 (이미 실행되어 Completed 상태가 됨)
    trigger.trigger()

    // ExecutionEngine 실행 (trigger는 이미 실행되었으므로 건너뛰고 연결된 노드들만 실행)
    await engine.execute("trigger")

    // 결과 확인
    // js-node1: 1+1 = 2
    expect(jsNode1.state).toBe(NodeState.Completed)
    const node1Result = jsNode1.getResult("output")
    // Single item or array check
    const node1Data = Array.isArray(node1Result) ? node1Result[0] : node1Result
    expect(node1Data.value).toBe(2)

    // js-node2: 2 + 3 = 5
    expect(jsNode2.state).toBe(NodeState.Completed)
    const node2Result = jsNode2.getResult("output")
    // Single item or array check
    const node2Data = Array.isArray(node2Result) ? node2Result[0] : node2Result
    expect(node2Data.value).toBe(5)
  })

  test("should handle workflow with multiple output ports", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const jsNode = new JavaScriptNode({
      id: "js-node-1",
      name: "js-node",
      nodeType: "javascript",
      version: 1,
      position: [100, 0],
    })
    jsNode.addOutput("result", "data")
    jsNode.addOutput("error", "data")
    jsNode.setup({
      code: `
        const value = input().value;
        if (value < 0) {
          output({ message: "Negative value" }, "error");
          output({ value: 0 }, "result");
        } else {
          output({ value: value * 2 }, "result");
        }
      `,
    })

    workflow.addNode(trigger)
    workflow.addNode(jsNode)
    workflow.linkNodes("trigger", "output", "js-node", "input")

    trigger.setup({})
    jsNode.setup({ code: jsNode.config.code as string })

    const engine = new ExecutionEngine(workflow)
    trigger.trigger({ output: { value: 5 } })
    await engine.execute("trigger")

    expect(jsNode.state).toBe(NodeState.Completed)
    const result = jsNode.getResult("result")
    const resultData = Array.isArray(result) ? result[0] : result
    expect(resultData.value).toBe(10)
    const error = jsNode.getResult("error")
    const errorData = Array.isArray(error) ? error : error === undefined ? [] : [error]
    expect(errorData).toHaveLength(0)
  })

  test("should handle workflow with multiple input ports", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const jsNode1 = new JavaScriptNode({
      id: "js-node-1",
      name: "js-node1",
      nodeType: "javascript",
      version: 1,
      position: [100, 0],
    })
    jsNode1.setup({ code: "return { value: 10 }" })

    const jsNode2 = new JavaScriptNode({
      id: "js-node-2",
      name: "js-node2",
      nodeType: "javascript",
      version: 1,
      position: [200, 0],
    })
    jsNode2.setup({ code: "return { value: 20 }" })

    const jsNode3 = new JavaScriptNode({
      id: "js-node-3",
      name: "js-node3",
      nodeType: "javascript",
      version: 1,
      position: [300, 0],
    })
    jsNode3.addInput("input1", "data")
    jsNode3.addInput("input2", "data")
    jsNode3.setup({
      code: `
        const value1 = input("input1").value;
        const value2 = input("input2").value;
        return { sum: value1 + value2 };
      `,
    })

    workflow.addNode(trigger)
    workflow.addNode(jsNode1)
    workflow.addNode(jsNode2)
    workflow.addNode(jsNode3)

    workflow.linkNodes("trigger", "output", "js-node1", "input")
    workflow.linkNodes("trigger", "output", "js-node2", "input")
    workflow.linkNodes("js-node1", "output", "js-node3", "input1")
    workflow.linkNodes("js-node2", "output", "js-node3", "input2")

    trigger.setup({})
    jsNode1.setup({ code: "return { value: 10 }" })
    jsNode2.setup({ code: "return { value: 20 }" })
    jsNode3.setup({ code: jsNode3.config.code as string })

    const engine = new ExecutionEngine(workflow)
    trigger.trigger()
    await engine.execute("trigger")

    expect(jsNode3.state).toBe(NodeState.Completed)
    const result = jsNode3.getResult("output")
    const resultData = Array.isArray(result) ? result[0] : result
    expect(resultData.sum).toBe(30)
  })

  test("should handle complex data transformation", async () => {
    const workflow = new Workflow("test-workflow")

    const trigger = new ManualTrigger({
      id: "trigger-1",
      name: "trigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    })

    const transformNode = new JavaScriptNode({
      id: "transform-1",
      name: "transform",
      nodeType: "javascript",
      version: 1,
      position: [100, 0],
    })
    transformNode.setup({
      code: `
        const items = inputAll().input;
        const transformed = items.map(item => ({
          original: item.value,
          doubled: item.value * 2,
          squared: item.value * item.value
        }));
        transformed.forEach(item => output(item));
      `,
    })

    workflow.addNode(trigger)
    workflow.addNode(transformNode)
    workflow.linkNodes("trigger", "output", "transform", "input")

    trigger.setup({})
    transformNode.setup({ code: transformNode.config.code as string })

    const engine = new ExecutionEngine(workflow)
    trigger.trigger({
      output: [
        { value: 2 },
        { value: 3 },
        { value: 4 },
      ],
    })
    await engine.execute("trigger")

    expect(transformNode.state).toBe(NodeState.Completed)
    const result = transformNode.getResult("output")
    expect(result).toHaveLength(3)
    const resultArray = Array.isArray(result) ? result : [result]
    expect(resultArray).toHaveLength(3)
    expect(resultArray[0]).toEqual({ original: 2, doubled: 4, squared: 4 })
    expect(resultArray[1]).toEqual({ original: 3, doubled: 6, squared: 9 })
    expect(resultArray[2]).toEqual({ original: 4, doubled: 8, squared: 16 })
  })
})
