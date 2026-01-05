/**
 * Tests for type validation utilities (if any exist)
 * Interfaces package primarily contains type definitions
 */

import { NodeState } from "../types/node-status"
import { WorkflowState } from "../interfaces/workflow"
import { LinkType } from "../types/connection-type"

describe("Interfaces Package", () => {
  describe("type definitions", () => {
    it("should export NodeState enum", () => {
      expect(NodeState).toBeDefined()
      expect(NodeState.Idle).toBeDefined()
      expect(NodeState.Running).toBeDefined()
      expect(NodeState.Completed).toBeDefined()
      expect(NodeState.Failed).toBeDefined()
    })

    it("should export WorkflowState enum", () => {
      expect(WorkflowState).toBeDefined()
      expect(WorkflowState.Idle).toBeDefined()
      expect(WorkflowState.Running).toBeDefined()
      expect(WorkflowState.Completed).toBeDefined()
      expect(WorkflowState.Failed).toBeDefined()
    })

    it("should export LinkType enum", () => {
      expect(LinkType).toBeDefined()
      expect(LinkType.Standard).toBeDefined()
    })
  })
})

