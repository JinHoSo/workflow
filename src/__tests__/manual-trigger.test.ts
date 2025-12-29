import { ManualTrigger } from "../triggers/manual-trigger"
import { JavaScriptNode } from "../nodes/javascript-execution-node"
import { Workflow } from "../core/workflow"
import { ExecutionEngine } from "../execution/execution-engine"
import { NodeState } from "../types"
import { WorkflowState } from "../interfaces"
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

  test("should have isTrigger property set to true", () => {
    expect(trigger.properties.isTrigger).toBe(true)
  })

  test("should trigger workflow execution", async () => {
    const workflow = new Workflow("test-workflow")
    workflow.addNode(trigger)
    trigger.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    trigger.trigger()
    // Wait for execution
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(trigger.state).toBe(NodeState.Completed)
  })

  test("should trigger with custom data", async () => {
    const workflow = new Workflow("test-workflow")
    workflow.addNode(trigger)
    trigger.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    const customData: NodeOutput = { output: { test: "value" } }
    trigger.trigger(customData)
    // Wait for execution
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(trigger.state).toBe(NodeState.Completed)
  })

  test("should use initialData from configuration", async () => {
    const workflow = new Workflow("test-workflow")
    workflow.addNode(trigger)
    const initialData: NodeOutput = { output: { initial: "data" } }
    trigger.setup({ initialData })

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    trigger.trigger()
    // Wait for execution
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(trigger.state).toBe(NodeState.Completed)
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
    trigger.setExecutionEngine(engine)

    // trigger 실행 (ExecutionEngine이 자동으로 워크플로우를 리셋하고 실행함)
    trigger.trigger()
    // Wait for async execution to complete
    await new Promise((resolve) => setTimeout(resolve, 1000))

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
    trigger.setExecutionEngine(engine)
    trigger.trigger({ output: { value: 5 } })
    // Wait for async execution to complete
    await new Promise((resolve) => setTimeout(resolve, 10))

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
    trigger.setExecutionEngine(engine)
    trigger.trigger()
    // Wait for async execution to complete
    await new Promise((resolve) => setTimeout(resolve, 10))

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
    trigger.setExecutionEngine(engine)
    trigger.trigger({
      output: [
        { value: 2 },
        { value: 3 },
        { value: 4 },
      ],
    })
    // Wait for async execution to complete
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(transformNode.state).toBe(NodeState.Completed)
    const result = transformNode.getResult("output")
    expect(result).toHaveLength(3)
    const resultArray = Array.isArray(result) ? result : [result]
    expect(resultArray).toHaveLength(3)
    expect(resultArray[0]).toEqual({ original: 2, doubled: 4, squared: 4 })
    expect(resultArray[1]).toEqual({ original: 3, doubled: 6, squared: 9 })
    expect(resultArray[2]).toEqual({ original: 4, doubled: 8, squared: 16 })
  })

  test("should reset workflow state between multiple executions", async () => {
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
    jsNode.setup({
      code: `
        const value = input().value || 0;
        return { value: value + 1 };
      `,
    })

    workflow.addNode(trigger)
    workflow.addNode(jsNode)
    workflow.linkNodes("trigger", "output", "js-node", "input")

    trigger.setup({})

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    // First execution
    trigger.trigger({ output: { value: 10 } })
    // Wait for workflow execution to complete
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 100) {
      await new Promise((resolve) => setTimeout(resolve, 20))
      attempts++
    }

    expect(workflow.state).toBe(WorkflowState.Completed)
    expect(jsNode.state).toBe(NodeState.Completed)
    const firstResult = jsNode.getResult("output")
    const firstData = Array.isArray(firstResult) ? firstResult[0] : firstResult
    expect(firstData.value).toBe(11)

    // Second execution - should start with clean state
    // Wait a bit more to ensure workflow state is fully settled
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Verify workflow is still Completed (it will be reset to Idle when execute() is called)
    // But we need to wait for the previous execution to fully complete
    // The workflow state should be Completed at this point, and will be reset to Idle
    // when the next execute() is called
    expect(workflow.state).toBe(WorkflowState.Completed)

    trigger.trigger({ output: { value: 20 } })
    // Wait for workflow execution to complete
    attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    // Node should have been reset and executed again
    expect(jsNode.state).toBe(NodeState.Completed)
    const secondResult = jsNode.getResult("output")
    const secondData = Array.isArray(secondResult) ? secondResult[0] : secondResult
    expect(secondData.value).toBe(21) // Should be 20 + 1, not 11 + 1
  })

  test("should clear node outputs between executions", async () => {
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
    jsNode.setup({
      code: `
        return { value: 100 };
      `,
    })

    workflow.addNode(trigger)
    workflow.addNode(jsNode)
    workflow.linkNodes("trigger", "output", "js-node", "input")

    trigger.setup({})
    jsNode.setup({ code: jsNode.config.code as string })

    const engine = new ExecutionEngine(workflow)
    trigger.setExecutionEngine(engine)

    // First execution
    trigger.trigger()
    // Wait for workflow execution to complete
    let attempts = 0
    while (workflow.state !== WorkflowState.Completed && workflow.state !== WorkflowState.Failed && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      attempts++
    }

    const firstResult = jsNode.getResult("output")
    const firstData = Array.isArray(firstResult) ? firstResult[0] : firstResult
    expect(firstData.value).toBe(100)

    // Reset workflow manually to verify outputs are cleared
    workflow.reset()

    // After reset, node outputs should be cleared
    const afterResetResult = jsNode.getResult("output")
    expect(afterResetResult).toEqual([])
    expect(jsNode.state).toBe(NodeState.Idle)
  })
})
