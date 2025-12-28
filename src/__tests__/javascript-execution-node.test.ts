import { JavaScriptNode } from "../nodes/javascript-execution-node"
import { NodeState } from "../types"
import type { NodeProperties, DataRecord } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"

describe("JavaScriptNode", () => {
  let node: JavaScriptNode
  let properties: NodeProperties

  beforeEach(() => {
    properties = {
      id: "js-1",
      name: "js-node",
      nodeType: "javascript",
      version: 1,
      position: [0, 0],
    }
    node = new JavaScriptNode(properties)
  })

  test("should configure with valid JavaScript code", () => {
    node.setup({ code: "return { value: input().value * 2 }" })
    expect(node.state).toBe(NodeState.Ready)
  })

  test("should throw error when code is missing", () => {
    expect(() => {
      node.setup({})
    }).toThrow("JavaScript code is required")
  })

  test("should execute JavaScript code with return value", async () => {
    node.setup({ code: "return { value: input().value * 2 }" })
    const context: ExecutionContext = { input: { input: { value: 5 } }, state: {} }
    await node.run(context)
    expect(node.state).toBe(NodeState.Completed)
    const result = node.getResult("output")
    const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
    expect(resultData.value).toBe(10)
  })

  test("should execute JavaScript code with output() function", async () => {
    node.setup({ code: "output({ value: input().value * 2 })" })
    const context: ExecutionContext = { input: { input: { value: 5 } }, state: {} }
    await node.run(context)
    expect(node.state).toBe(NodeState.Completed)
    const result = node.getResult("output")
    const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
    expect(resultData.value).toBe(10)
  })

  test("should throw error for invalid JavaScript syntax", () => {
    expect(() => {
      node.setup({ code: "invalid syntax {[" })
    }).toThrow("Invalid JavaScript syntax")
  })

  test("should handle execution errors", async () => {
    node.setup({ code: "throw new Error('Test error')" })
    const context: ExecutionContext = { input: { input: {} }, state: {} }
    await expect(node.run(context)).rejects.toThrow("JavaScript execution failed")
    expect(node.state).toBe(NodeState.Failed)
  })

  test("should handle multiple input items", async () => {
    node.setup({
      code: `
        const items = inputAll().input;
        const sum = items.reduce((acc, item) => acc + item.value, 0);
        return { value: sum };
      `,
    })
    const context: ExecutionContext = {
      input: {
        input: [
          { value: 5 },
          { value: 10 },
          { value: 15 },
        ],
      },
      state: {},
    }
    await node.run(context)
    expect(node.state).toBe(NodeState.Completed)
    const result = node.getResult("output")
    const resultArray = Array.isArray(result) ? result : [result]
    expect(resultArray[0].value).toBe(30)
  })

  test("should support multiple output ports", async () => {
    node.addOutput("result", "data")
    node.addOutput("error", "data")
    node.setup({
      code: `
        const value = input().value;
        if (value < 0) {
          output({ message: "Negative value" }, "error");
          return { value: 0 };
        }
        return { value: value * 2 };
      `,
    })
    const context: ExecutionContext = { input: { input: { value: 5 } }, state: {} }
    await node.run(context)
    expect(node.state).toBe(NodeState.Completed)
    const result = node.getResult("output")
    const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
    expect(resultData.value).toBe(10)
    const error = node.getResult("error")
    expect(error).toHaveLength(0)
  })

  test("should handle multiple output items via output() function", async () => {
    node.setup({
      code: `
        const items = inputAll().input;
        items.forEach(item => {
          output({ doubled: item.value * 2 });
        });
      `,
    })
    const context: ExecutionContext = {
      input: {
        input: [
          { value: 1 },
          { value: 2 },
          { value: 3 },
        ],
      },
      state: {},
    }
    await node.run(context)
    expect(node.state).toBe(NodeState.Completed)
    const result = node.getResult("output")
    const resultArray = Array.isArray(result) ? result : [result]
    expect(resultArray).toHaveLength(3)
    expect(resultArray[0].doubled).toBe(2)
    expect(resultArray[1].doubled).toBe(4)
    expect(resultArray[2].doubled).toBe(6)
  })

  test("should handle input index out of range error", async () => {
    node.setup({
      code: `
        const value = input("input", 10).value; // Index 10 doesn't exist
        return { value };
      `,
    })
    const context: ExecutionContext = { input: { input: { value: 5 } }, state: {} }
    await expect(node.run(context)).rejects.toThrow("Input index 10 is out of range")
  })

  test("should handle missing input port error", async () => {
    node.setup({
      code: `
        const value = input("nonexistent", 0).value;
        return { value };
      `,
    })
    const context: ExecutionContext = { input: { input: { value: 5 } }, state: {} }
    await expect(node.run(context)).rejects.toThrow("Input index 0 is out of range for port")
  })
})
