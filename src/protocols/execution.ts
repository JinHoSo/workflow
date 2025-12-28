import type { WorkflowNode } from "../interfaces"
import type { NodeInput, NodeOutput } from "../interfaces"

export interface ExecutionProtocolContext {
  node: WorkflowNode
  inputData: NodeInput
  workflowId: string
}

export interface ExecutionProtocol {
  executeNode(context: ExecutionProtocolContext): Promise<NodeOutput> | NodeOutput
  validateExecution(node: WorkflowNode): boolean
}
