import type { NodeOutput, NodeInput } from "./node-execution-data"

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
 * Context passed to nodes during execution
 * Contains both input data and execution state for referencing previous nodes
 */
export interface ExecutionContext {
  /** Input data from connected nodes (port name based) */
  input: NodeInput
  /** Execution state containing all previous node outputs */
  state: ExecutionState
}

