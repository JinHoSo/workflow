import type { Node, NodeOutput } from "@workflow/interfaces"
import type { ExecutionProtocol, ExecutionProtocolContext } from "./execution"
import { BaseNode } from "@workflow/core"
import { NodeState } from "@workflow/interfaces"

/**
 * Default implementation of ExecutionProtocol
 * Handles node execution with proper state management and validation
 */
export class ExecutionProtocolImpl implements ExecutionProtocol {
  /**
   * Executes a node using the execution protocol
   * @param context - Execution protocol context containing node, input data, and state
   * @returns Promise that resolves to node output data
   */
  async executeNode(context: ExecutionProtocolContext): Promise<NodeOutput> {
    const { node, inputData, state } = context

    // Validate node is ready for execution
    if (!this.validateExecution(node)) {
      throw new Error(`Node ${node.properties.name} is not ready for execution`)
    }

    // Execute node if it's a BaseNode instance
    if (node instanceof BaseNode) {
      const executionContext = {
        input: inputData,
        state: state, // Pass execution state from context
      }

      return await node.run(executionContext)
    }

    throw new Error(`Node ${node.properties.name} is not a BaseNode instance and cannot be executed`)
  }

  /**
   * Validates that a node is ready for execution
   * @param node - Node to validate
   * @returns true if node is ready for execution
   */
  validateExecution(node: Node): boolean {
    // Node must be in Idle state to execute
    if (node.state !== NodeState.Idle) {
      return false
    }

    // Node must not be disabled
    if (node.properties.disabled) {
      return false
    }

    return true
  }
}

/**
 * Global execution protocol instance
 */
export const executionProtocol = new ExecutionProtocolImpl()

