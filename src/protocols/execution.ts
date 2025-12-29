import type { Node } from "../interfaces"
import type { NodeInput, NodeOutput, ExecutionState } from "../interfaces"

/**
 * Execution protocol context containing node, input data, and execution state
 */
export interface ExecutionProtocolContext {
  /** Node to execute */
  node: Node
  /** Input data for the node (port name based) */
  inputData: NodeInput
  /** Workflow ID */
  workflowId: string
  /** Execution state from previous nodes */
  state: ExecutionState
}

/**
 * Protocol interface for node execution
 */
export interface ExecutionProtocol {
  executeNode(context: ExecutionProtocolContext): Promise<NodeOutput> | NodeOutput
  validateExecution(node: Node): boolean
}
