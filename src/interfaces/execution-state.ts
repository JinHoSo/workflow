import type { NodeOutput, NodeInput } from "./node-execution-data"
import { NodeState } from "../types"

/**
 * Execution state that tracks all node outputs during workflow execution
 * Similar to LangGraph's state concept - allows nodes to reference any previous node's output
 *
 * Example:
 * - node1 outputs: { output: { value: 10 } }
 * - node2 outputs: { output: { value: 20 } }
 * - node3 can access both: state.node1.output.value and state.node2.output.value
 */
export interface ExecutionState {
  /** Output data from all executed nodes, indexed by node name */
  [nodeName: string]: NodeOutput
}

/**
 * Execution metadata for a node
 * Tracks timing and status information
 */
export interface NodeExecutionMetadata {
  /** Timestamp when node execution started (milliseconds since epoch) */
  startTime: number
  /** Timestamp when node execution ended (milliseconds since epoch) */
  endTime?: number
  /** Execution duration in milliseconds */
  duration?: number
  /** Final execution status */
  status: NodeState
}

/**
 * Context passed to nodes during execution
 * Contains both input data and execution state for referencing previous nodes
 */
export interface ExecutionContext {
  /** Input data from connected nodes (port name based) */
  input: NodeInput
  /** Execution state containing all previous node outputs */
  state: ExecutionState
}

/**
 * State persistence hook interface
 * Allows external systems to persist and recover execution state
 */
export interface StatePersistenceHook {
  /**
   * Persists execution state
   * @param workflowId - Workflow identifier
   * @param state - Execution state to persist
   * @param metadata - Execution metadata
   */
  persist(workflowId: string, state: ExecutionState, metadata: Record<string, NodeExecutionMetadata>): Promise<void>

  /**
   * Recovers execution state
   * @param workflowId - Workflow identifier
   * @returns Recovered state and metadata, or undefined if not found
   */
  recover(
    workflowId: string,
  ): Promise<{ state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> } | undefined>
}

