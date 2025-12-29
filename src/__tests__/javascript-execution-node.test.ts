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
    expect(node.state).toBe(NodeState.Idle)
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

  describe("Async JavaScript Execution", () => {
    test("should execute async function that returns a value", async () => {
      node.setup({
        code: `
          const value = input().value;
          return Promise.resolve({ value: value * 2 });
        `,
      })
      const context: ExecutionContext = { input: { input: { value: 5 } }, state: {} }
      await node.run(context)
      expect(node.state).toBe(NodeState.Completed)
      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(resultData.value).toBe(10)
    })

    test("should execute async function with await", async () => {
      node.setup({
        code: `
          const value = input().value;
          const doubled = await Promise.resolve(value * 2);
          return { value: doubled };
        `,
      })
      const context: ExecutionContext = { input: { input: { value: 5 } }, state: {} }
      await node.run(context)
      expect(node.state).toBe(NodeState.Completed)
      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(resultData.value).toBe(10)
    })

    test("should handle async operation with delay", async () => {
      node.setup({
        code: `
          const value = input().value;
          await new Promise(resolve => setTimeout(resolve, 50));
          return { value: value * 2 };
        `,
      })
      const context: ExecutionContext = { input: { input: { value: 5 } }, state: {} }
      const startTime = Date.now()
      await node.run(context)
      const duration = Date.now() - startTime
      expect(node.state).toBe(NodeState.Completed)
      expect(duration).toBeGreaterThanOrEqual(50)
      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(resultData.value).toBe(10)
    })

    test("should handle multiple async operations sequentially", async () => {
      node.setup({
        code: `
          const value = input().value;
          let result = value;
          result = await Promise.resolve(result + 10);
          result = await Promise.resolve(result * 2);
          result = await Promise.resolve(result - 5);
          return { value: result };
        `,
      })
      const context: ExecutionContext = { input: { input: { value: 5 } }, state: {} }
      await node.run(context)
      expect(node.state).toBe(NodeState.Completed)
      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      // (5 + 10) * 2 - 5 = 25
      expect(resultData.value).toBe(25)
    })

    test("should handle async operations with Promise.all", async () => {
      node.setup({
        code: `
          const value = input().value;
          const promises = [
            Promise.resolve(value * 2),
            Promise.resolve(value * 3),
            Promise.resolve(value * 4)
          ];
          const results = await Promise.all(promises);
          const sum = results.reduce((acc, val) => acc + val, 0);
          return { value: sum };
        `,
      })
      const context: ExecutionContext = { input: { input: { value: 5 } }, state: {} }
      await node.run(context)
      expect(node.state).toBe(NodeState.Completed)
      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      // (5*2) + (5*3) + (5*4) = 10 + 15 + 20 = 45
      expect(resultData.value).toBe(45)
    })

    test("should handle async error in Promise", async () => {
      node.setup({
        code: `
          await Promise.resolve();
          throw new Error('Async error');
        `,
      })
      const context: ExecutionContext = { input: { input: {} }, state: {} }
      await expect(node.run(context)).rejects.toThrow("JavaScript execution failed")
      expect(node.state).toBe(NodeState.Failed)
    })

    test("should handle async error with rejected Promise", async () => {
      node.setup({
        code: `
          await Promise.reject(new Error('Promise rejected'));
        `,
      })
      const context: ExecutionContext = { input: { input: {} }, state: {} }
      await expect(node.run(context)).rejects.toThrow("JavaScript execution failed")
      expect(node.state).toBe(NodeState.Failed)
    })

    test("should handle async code with output() function", async () => {
      node.setup({
        code: `
          const value = input().value;
          await new Promise(resolve => setTimeout(resolve, 10));
          output({ value: value * 2 });
        `,
      })
      const context: ExecutionContext = { input: { input: { value: 5 } }, state: {} }
      await node.run(context)
      expect(node.state).toBe(NodeState.Completed)
      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(resultData.value).toBe(10)
    })

    test("should handle async code with multiple output() calls", async () => {
      node.setup({
        code: `
          const items = inputAll().input;
          for (const item of items) {
            await new Promise(resolve => setTimeout(resolve, 10));
            output({ doubled: item.value * 2 });
          }
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
      const startTime = Date.now()
      await node.run(context)
      const duration = Date.now() - startTime
      expect(node.state).toBe(NodeState.Completed)
      expect(duration).toBeGreaterThanOrEqual(30) // At least 30ms for 3 items
      const result = node.getResult("output")
      const resultArray = Array.isArray(result) ? result : [result]
      expect(resultArray).toHaveLength(3)
      expect(resultArray[0].doubled).toBe(2)
      expect(resultArray[1].doubled).toBe(4)
      expect(resultArray[2].doubled).toBe(6)
    })

    test("should handle async code that fetches data from state", async () => {
      node.setup({
        code: `
          const inputValue = input().value;
          await new Promise(resolve => setTimeout(resolve, 10));
          const node1Value = state("node1", "output").value;
          return { value: inputValue + node1Value };
        `,
      })
      const context: ExecutionContext = {
        input: { input: { value: 10 } },
        state: {
          node1: {
            output: { value: 20 },
          },
        },
      }
      await node.run(context)
      expect(node.state).toBe(NodeState.Completed)
      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(resultData.value).toBe(30)
    })

    test("should handle async code with conditional logic", async () => {
      node.setup({
        code: `
          const value = input().value;
          if (value > 10) {
            await new Promise(resolve => setTimeout(resolve, 50));
            return { value: value * 2 };
          } else {
            await new Promise(resolve => setTimeout(resolve, 10));
            return { value: value * 3 };
          }
        `,
      })
      const context: ExecutionContext = { input: { input: { value: 15 } }, state: {} }
      const startTime = Date.now()
      await node.run(context)
      const duration = Date.now() - startTime
      expect(node.state).toBe(NodeState.Completed)
      expect(duration).toBeGreaterThanOrEqual(50)
      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(resultData.value).toBe(30) // 15 * 2
    })
  })
})
