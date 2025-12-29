import type { Node } from "../interfaces"
import type { ErrorHandlingProtocol, ErrorInfo } from "./error-handling"
import { NodeState } from "../types"

/**
 * Default implementation of ErrorHandlingProtocol
 * Handles errors consistently across all nodes
 */
export class ErrorHandlingProtocolImpl implements ErrorHandlingProtocol {
  /**
   * Handles an error that occurred during node execution
   * @param node - Node that encountered the error
   * @param error - Error that occurred
   */
  handleError(node: Node, error: Error): void {
    // Set error on node
    node.error = error
    node.state = NodeState.Failed

    // Log error information (can be extended with logging service)
    const errorInfo = this.propagateError(node, error)
    console.error(`Node ${node.properties.name} failed:`, errorInfo.message)
  }

  /**
   * Propagates error information for downstream nodes
   * @param node - Node that encountered the error
   * @param error - Error that occurred
   * @returns Error information object
   */
  propagateError(node: Node, error: Error): ErrorInfo {
    return {
      message: error.message,
      stack: error.stack,
      nodeId: node.properties.id,
      nodeName: node.properties.name,
    }
  }

  /**
   * Determines if execution should stop when a node fails
   * @param node - Node that failed
   * @param _error - Error that occurred
   * @returns true if execution should stop, false if it should continue
   */
  shouldStopExecution(node: Node, _error: Error): boolean {
    // Stop execution if node doesn't have continueOnFail enabled
    return !node.properties.continueOnFail
  }
}

/**
 * Global error handling protocol instance
 */
export const errorHandlingProtocol = new ErrorHandlingProtocolImpl()

