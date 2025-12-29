import type { Node } from "../interfaces"
import type { NodeInput, NodeOutput } from "../interfaces"

export interface ExecutionProtocolContext {
  node: Node
  inputData: NodeInput
  workflowId: string
}

export interface ExecutionProtocol {
  executeNode(context: ExecutionProtocolContext): Promise<NodeOutput> | NodeOutput
  validateExecution(node: Node): boolean
}
