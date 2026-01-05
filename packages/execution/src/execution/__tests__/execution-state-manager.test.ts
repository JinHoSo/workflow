/**
 * Tests for ExecutionStateManager
 * Tests state tracking, metadata management, and persistence
 */

import { ExecutionStateManager } from "../execution-state-manager"
import { NodeState } from "@workflow/interfaces"
import type { NodeOutput, NodeExecutionMetadata } from "@workflow/interfaces"

describe("ExecutionStateManager", () => {
  let manager: ExecutionStateManager

  beforeEach(() => {
    manager = new ExecutionStateManager()
  })

  describe("state management", () => {
    it("should initialize with empty state", () => {
      const state = manager.getState()
      expect(Object.keys(state)).toHaveLength(0)
    })

    it("should set node state", () => {
      const output: NodeOutput = { output: [{ value: "test" }] }
      manager.setNodeState("Node1", output)
      const nodeState = manager.getNodeState("Node1")
      expect(nodeState).toEqual(output)
    })

    it("should get node state", () => {
      const output: NodeOutput = { output: [{ value: "test" }] }
      manager.setNodeState("Node1", output)
      const retrieved = manager.getNodeState("Node1")
      expect(retrieved).toEqual(output)
    })

    it("should return undefined for non-existent node", () => {
      const state = manager.getNodeState("NonExistent")
      expect(state).toBeUndefined()
    })

    it("should get all state", () => {
      manager.setNodeState("Node1", { output: [] })
      manager.setNodeState("Node2", { output: [] })
      const state = manager.getState()
      expect(Object.keys(state).length).toBe(2)
    })
  })

  describe("metadata management", () => {
    it("should record node start", () => {
      manager.recordNodeStart("Node1")
      const metadata = manager.getNodeMetadata("Node1")
      expect(metadata).toBeDefined()
      expect(metadata?.status).toBe(NodeState.Running)
      expect(metadata?.startTime).toBeDefined()
    })

    it("should record node end", () => {
      manager.recordNodeStart("Node1")
      manager.recordNodeEnd("Node1", NodeState.Completed)
      const metadata = manager.getNodeMetadata("Node1")
      expect(metadata?.status).toBe(NodeState.Completed)
      expect(metadata?.endTime).toBeDefined()
      expect(metadata?.duration).toBeDefined()
    })

    it("should calculate duration", () => {
      manager.recordNodeStart("Node1")
      // Wait a bit to ensure duration > 0
      const startTime = Date.now()
      while (Date.now() - startTime < 10) {
        // Wait
      }
      manager.recordNodeEnd("Node1", NodeState.Completed)
      const metadata = manager.getNodeMetadata("Node1")
      expect(metadata?.duration).toBeGreaterThan(0)
    })

    it("should set node metadata", () => {
      const metadata: NodeExecutionMetadata = {
        startTime: Date.now(),
        endTime: Date.now() + 100,
        duration: 100,
        status: NodeState.Completed,
      }
      manager.setNodeMetadata("Node1", metadata)
      const retrieved = manager.getNodeMetadata("Node1")
      expect(retrieved).toEqual(metadata)
    })

    it("should get all metadata", () => {
      manager.recordNodeStart("Node1")
      manager.recordNodeStart("Node2")
      const allMetadata = manager.getAllMetadata()
      expect(allMetadata.size).toBe(2)
    })
  })

  describe("clear", () => {
    it("should clear all state", () => {
      manager.setNodeState("Node1", { output: [] })
      manager.recordNodeStart("Node1")
      manager.clear()
      expect(manager.getNodeState("Node1")).toBeUndefined()
      expect(manager.getNodeMetadata("Node1")).toBeUndefined()
    })
  })
})

