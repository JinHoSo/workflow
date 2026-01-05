/**
 * Tests for ManualTrigger
 * Tests trigger activation and execution
 */

import { ManualTrigger } from "../manual-trigger/manual-trigger"
import type { NodeProperties, ExecutionContext } from "@workflow/interfaces"
import { NodeState } from "@workflow/interfaces"

describe("ManualTrigger", () => {
  let trigger: ManualTrigger
  let properties: NodeProperties

  beforeEach(() => {
    // nodeType is automatically set from class definition, so we can omit it
    properties = {
      id: "trigger-1",
      name: "ManualTrigger",
      version: 1,
      position: [0, 0] as [number, number],
    } as NodeProperties
    trigger = new ManualTrigger(properties)
  })

  describe("initialization", () => {
    it("should automatically set nodeType from class definition", () => {
      expect(trigger.properties.nodeType).toBe("manual-trigger")
    })

    it("should override user-provided nodeType with class definition", () => {
      const triggerWithWrongType = new ManualTrigger({
        ...properties,
        nodeType: "wrong-type",
      })
      expect(triggerWithWrongType.properties.nodeType).toBe("manual-trigger")
    })

    it("should create trigger with isTrigger set to true", () => {
      expect(trigger.properties.isTrigger).toBe(true)
    })

    it("should initialize in Idle state", () => {
      expect(trigger.getState()).toBe(NodeState.Idle)
    })
  })

  describe("execution", () => {
    it("should execute trigger", async () => {
      trigger.addOutput("output", "object")
      const context: ExecutionContext = {
        input: {},
        state: {},
      }
      const result = await trigger.run(context)
      expect(result).toHaveProperty("output")
      expect(trigger.getState()).toBe(NodeState.Completed)
    })
  })
})

