import type { WorkflowNode } from "../interfaces"

export interface ErrorInfo {
  message: string
  stack?: string
  nodeId: string
  nodeName: string
}

export interface ErrorHandlingProtocol {
  handleError(node: WorkflowNode, error: Error): void
  propagateError(node: WorkflowNode, error: Error): ErrorInfo
  shouldStopExecution(node: WorkflowNode, error: Error): boolean
}
