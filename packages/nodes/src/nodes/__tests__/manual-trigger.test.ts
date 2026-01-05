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
    properties = {
      id: "trigger-1",
      name: "ManualTrigger",
      nodeType: "manual-trigger",
      version: 1,
      position: [0, 0],
    }
    trigger = new ManualTrigger(properties)
  })

  describe("initialization", () => {
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

