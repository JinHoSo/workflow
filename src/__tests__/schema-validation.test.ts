import { JavaScriptNode } from "../nodes/javascript-execution-node"
import { HttpRequestNode } from "../nodes/http-request-node"
import { ManualTrigger } from "../triggers/manual-trigger"
import { ScheduleTrigger } from "../triggers/schedule-trigger"

describe("Schema Validation", () => {
  describe("JavaScriptNode", () => {
    test("should validate valid configuration", () => {
      const node = new JavaScriptNode({
        id: "node-1",
        name: "js-node",
        nodeType: "javascript",
        version: 1,
        position: [0, 0],
      })

      expect(() => {
        node.setup({ code: "return { value: 1 }" })
      }).not.toThrow()
    })

    test("should reject invalid configuration", () => {
      const node = new JavaScriptNode({
        id: "node-1",
        name: "js-node",
        nodeType: "javascript",
        version: 1,
        position: [0, 0],
      })

      expect(() => {
        node.setup({ invalid: "property" } as any)
      }).toThrow()
    })

    test("should reject missing required field", () => {
      const node = new JavaScriptNode({
        id: "node-1",
        name: "js-node",
        nodeType: "javascript",
        version: 1,
        position: [0, 0],
      })

      expect(() => {
        node.setup({} as any)
      }).toThrow()
    })
  })

  describe("HttpRequestNode", () => {
    test("should validate valid configuration", () => {
      const node = new HttpRequestNode({
        id: "node-1",
        name: "http-node",
        nodeType: "http-request",
        version: 1,
        position: [0, 0],
      })

      expect(() => {
        node.setup({
          method: "GET",
          url: "https://example.com",
        })
      }).not.toThrow()
    })

    test("should reject invalid HTTP method", () => {
      const node = new HttpRequestNode({
        id: "node-1",
        name: "http-node",
        nodeType: "http-request",
        version: 1,
        position: [0, 0],
      })

      expect(() => {
        node.setup({
          method: "INVALID",
          url: "https://example.com",
        } as any)
      }).toThrow()
    })

    test("should validate URL format", () => {
      const node = new HttpRequestNode({
        id: "node-1",
        name: "http-node",
        nodeType: "http-request",
        version: 1,
        position: [0, 0],
      })

      expect(() => {
        node.setup({
          method: "GET",
          url: "not-a-valid-url",
        })
      }).toThrow()
    })
  })

  describe("ManualTrigger", () => {
    test("should validate valid configuration", () => {
      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "manual-trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      expect(() => {
        trigger.setup({})
      }).not.toThrow()
    })

    test("should accept initialData", () => {
      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "manual-trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      expect(() => {
        trigger.setup({ initialData: { output: { value: 1 } } })
      }).not.toThrow()
    })
  })

  describe("ScheduleTrigger", () => {
    test("should validate minute schedule", () => {
      const trigger = new ScheduleTrigger({
        id: "trigger-1",
        name: "schedule-trigger",
        nodeType: "schedule-trigger",
        version: 1,
        position: [0, 0],
      })

      expect(() => {
        trigger.setup({
          schedule: {
            type: "minute",
            second: 30,
          },
        })
      }).not.toThrow()
    })

    test("should reject invalid second value", () => {
      const trigger = new ScheduleTrigger({
        id: "trigger-1",
        name: "schedule-trigger",
        nodeType: "schedule-trigger",
        version: 1,
        position: [0, 0],
      })

      expect(() => {
        trigger.setup({
          schedule: {
            type: "minute",
            second: 100, // Invalid: should be 0-59
          },
        } as any)
      }).toThrow()
    })

    test("should validate interval schedule", () => {
      const trigger = new ScheduleTrigger({
        id: "trigger-1",
        name: "schedule-trigger",
        nodeType: "schedule-trigger",
        version: 1,
        position: [0, 0],
      })

      expect(() => {
        trigger.setup({
          schedule: {
            type: "interval",
            intervalMs: 1000,
          },
        })
      }).not.toThrow()
    })
  })
})

