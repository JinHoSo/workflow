/**
 * Tests for BaseTrigger (TriggerNodeBase) class
 * Tests trigger-specific behavior, workflow execution integration, and state management
 */

import { TriggerNodeBase } from "../base-trigger"
import type { NodeProperties, ExecutionContext, NodeOutput } from "@workflow/interfaces"
import { NodeState, WorkflowState } from "@workflow/interfaces"
import type { ExecutionEngine } from "@workflow/execution"

/**
 * Test trigger implementation for testing TriggerNodeBase functionality
 */
class TestTrigger extends TriggerNodeBase {
  private activatedData?: NodeOutput
  private activationCount = 0

  protected activate(data: NodeOutput): void {
    this.activatedData = data
    this.activationCount++
    // Simulate workflow execution initiation
    if (this.executionEngine) {
      // In real implementation, this would start workflow execution
    }
  }

  getActivatedData(): NodeOutput | undefined {
    return this.activatedData
  }

  getActivationCount(): number {
    return this.activationCount
  }
}

/**
 * Mock ExecutionEngine for testing
 */
class MockExecutionEngine {
  private state = WorkflowState.Idle

  getWorkflowState(): WorkflowState {
    return this.state
  }

  setState(state: WorkflowState): void {
    this.state = state
  }
}

// Type assertion helper to make mock compatible
function createMockEngine(): ExecutionEngine {
  return new MockExecutionEngine() as unknown as ExecutionEngine
}

describe("TriggerNodeBase", () => {
  let trigger: TestTrigger
  let properties: NodeProperties

  beforeEach(() => {
    properties = {
      id: "test-trigger-1",
      name: "TestTrigger",
      nodeType: "test-trigger",
      version: 1,
      position: [0, 0],
      isTrigger: false, // Will be set to true by constructor
    }
    trigger = new TestTrigger(properties)
  })

  describe("constructor", () => {
    it("should initialize trigger with isTrigger set to true", () => {
      expect(trigger.properties.isTrigger).toBe(true)
    })

    it("should initialize in Idle state", () => {
      expect(trigger.getState()).toBe(NodeState.Idle)
    })

    it("should extend BaseNode", () => {
      expect(trigger).toBeInstanceOf(TriggerNodeBase)
    })
  })

  describe("execution engine", () => {
    it("should set execution engine", () => {
      const engine = createMockEngine()
      trigger.setExecutionEngine(engine)
      expect(trigger).toBeDefined()
    })

    it("should check workflow state before triggering", () => {
      const engine = createMockEngine()
      const mock = engine as unknown as MockExecutionEngine
      mock.setState(WorkflowState.Running)
      trigger.setExecutionEngine(engine)
      expect(() => {
        trigger.trigger()
      }).toThrow("Workflow is already executing")
    })

    it("should allow triggering when workflow is Idle", () => {
      const engine = createMockEngine()
      const mock = engine as unknown as MockExecutionEngine
      mock.setState(WorkflowState.Idle)
      trigger.setExecutionEngine(engine)
      expect(() => {
        trigger.trigger()
      }).not.toThrow()
    })

    it("should allow triggering when workflow is Completed", () => {
      const engine = createMockEngine()
      const mock = engine as unknown as MockExecutionEngine
      mock.setState(WorkflowState.Completed)
      trigger.setExecutionEngine(engine)
      expect(() => {
        trigger.trigger()
      }).not.toThrow()
    })
  })

  describe("trigger activation", () => {
    it("should activate trigger with default data", () => {
      trigger.addOutput("output", "object")
      trigger.trigger()
      expect(trigger.getActivationCount()).toBe(1)
      expect(trigger.getActivatedData()).toBeDefined()
    })

    it("should activate trigger with provided data", () => {
      const data: NodeOutput = {
        output: [{ value: "test" }],
      }
      trigger.trigger(data)
      expect(trigger.getActivationCount()).toBe(1)
      expect(trigger.getActivatedData()).toEqual(data)
    })

    it("should call activate method when triggered", () => {
      trigger.addOutput("output", "object")
      trigger.trigger()
      expect(trigger.getActivationCount()).toBe(1)
    })
  })

  describe("process method", () => {
    it("should process trigger execution", async () => {
      trigger.addOutput("output", "object")
      const context: ExecutionContext = {
        input: {
          output: [{ value: "test" }],
        },
        state: {},
      }
      const result = await trigger.run(context)
      expect(result).toHaveProperty("output")
    })

    it("should return default data when no input provided", async () => {
      trigger.addOutput("output", "object")
      const context: ExecutionContext = {
        input: {},
        state: {},
      }
      const result = await trigger.run(context)
      expect(result).toHaveProperty("output")
    })

    it("should normalize input data to array", async () => {
      trigger.addOutput("output", "object")
      const context: ExecutionContext = {
        input: {
          output: { value: "test" },
        },
        state: {},
      }
      const result = await trigger.run(context)
      expect(result).toHaveProperty("output")
    })
  })

  describe("reset", () => {
    it("should reset trigger to Idle state", async () => {
      trigger.addOutput("output", "object")
      const context: ExecutionContext = {
        input: {},
        state: {},
      }
      await trigger.run(context)
      trigger.reset()
      expect(trigger.getState()).toBe(NodeState.Idle)
      expect(trigger.error).toBeUndefined()
    })

    it("should preserve configuration after reset", () => {
      trigger.setup({ key: "value" })
      trigger.reset()
      expect(trigger.config).toEqual({ key: "value" })
    })

    it("should clear result data on reset", async () => {
      trigger.addOutput("output", "object")
      const context: ExecutionContext = {
        input: {},
        state: {},
      }
      await trigger.run(context)
      trigger.reset()
      expect(trigger.getAllResults()).toEqual({})
    })
  })

  describe("default data", () => {
    it("should return default data structure", () => {
      trigger.addOutput("output", "object")
      const defaultData = trigger["getDefaultData"]()
      expect(defaultData).toHaveProperty("output")
    })

    it("should use first output port name for default data", () => {
      trigger.addOutput("customOutput", "object")
      const defaultData = trigger["getDefaultData"]()
      expect(defaultData).toHaveProperty("customOutput")
    })
  })
})

