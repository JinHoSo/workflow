import type { Node } from "../interfaces"

export interface ErrorInfo {
  message: string
  stack?: string
  nodeId: string
  nodeName: string
}

export interface ErrorHandlingProtocol {
  handleError(node: Node, error: Error): void
  propagateError(node: Node, error: Error): ErrorInfo
  shouldStopExecution(node: Node, error: Error): boolean
}
