/**
 * Node execution simulator for testing
 * Provides utilities to simulate node execution in test environments
 */

import type { BaseNode } from "../../../src/core/base-node"
import type { NodeProperties, NodeOutput, DataRecord } from "../../../src/interfaces"
import type { ExecutionContext } from "../../../src/interfaces/execution-state"
import { NodeState } from "../../../src/types"

/**
 * Options for node execution simulation
 */
export interface NodeExecutionOptions {
  /** Input data for the node (port name -> data) */
  inputData?: Record<string, DataRecord | DataRecord[]>
  /** Node configuration */
  config?: Record<string, unknown>
  /** Execution state */
  state?: Record<string, unknown>
}

/**
 * Result of node execution simulation
 */
export interface NodeExecutionResult {
  /** Output data from the node */
  output: NodeOutput
  /** Final node state */
  state: NodeState
  /** Error if execution failed */
  error?: Error
  /** Execution duration in milliseconds */
  duration: number
}

/**
 * Simulates node execution for testing
 * @param node - Node instance to execute
 * @param options - Execution options
 * @returns Execution result
 */
export async function simulateNodeExecution(
  node: BaseNode,
  options: NodeExecutionOptions = {},
): Promise<NodeExecutionResult> {
  const startTime = Date.now()

  // Configure node if config provided
  if (options.config) {
    node.setup(options.config)
  }

  // Prepare execution context
  const context: ExecutionContext = {
    input: options.inputData || {},
    state: options.state || {},
  }

  try {
    // Execute node
    const output = await node.run(context)
    const endTime = Date.now()

    return {
      output,
      state: node.getState(),
      duration: endTime - startTime,
    }
  } catch (error) {
    const endTime = Date.now()

    return {
      output: {},
      state: node.getState(),
      error: error instanceof Error ? error : new Error(String(error)),
      duration: endTime - startTime,
    }
  }
}

/**
 * Creates mock input data for testing
 * @param portName - Name of the input port
 * @param data - Data to use (single record or array)
 * @returns Mock input data structure
 */
export function createMockInputData(
  portName: string,
  data: DataRecord | DataRecord[],
): Record<string, DataRecord | DataRecord[]> {
  return {
    [portName]: data,
  }
}

/**
 * Creates multiple mock input data entries
 * @param inputs - Map of port names to data
 * @returns Mock input data structure
 */
export function createMockInputs(
  inputs: Record<string, DataRecord | DataRecord[]>,
): Record<string, DataRecord | DataRecord[]> {
  return inputs
}

/**
 * Validates node output structure
 * @param output - Node output to validate
 * @param expectedPorts - Expected output port names
 * @returns Validation result
 */
export function validateNodeOutput(
  output: NodeOutput,
  expectedPorts: string[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check all expected ports exist
  for (const port of expectedPorts) {
    if (!(port in output)) {
      errors.push(`Expected output port '${port}' not found`)
    }
  }

  // Check output values are arrays or single records
  for (const [port, value] of Object.entries(output)) {
    if (value !== null && value !== undefined && !Array.isArray(value) && typeof value !== "object") {
      errors.push(`Output port '${port}' has invalid type (expected array or object)`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validates node state transitions
 * @param initialState - Initial node state
 * @param finalState - Final node state
 * @param expectedTransition - Expected state transition
 * @returns Validation result
 */
export function validateStateTransition(
  initialState: NodeState,
  finalState: NodeState,
  expectedTransition: NodeState[],
): { valid: boolean; error?: string } {
  if (!expectedTransition.includes(finalState)) {
    return {
      valid: false,
      error: `Invalid state transition from ${initialState} to ${finalState}. Expected one of: ${expectedTransition.join(", ")}`,
    }
  }

  return { valid: true }
}

/**
 * Creates a test node instance
 * @param NodeClass - Node class constructor
 * @param properties - Node properties
 * @returns Node instance
 */
export function createTestNode(
  NodeClass: new (properties: NodeProperties) => BaseNode,
  properties: Partial<NodeProperties> = {},
): BaseNode {
  const defaultProperties: NodeProperties = {
    id: properties.id || "test-node-1",
    name: properties.name || "TestNode",
    type: properties.type || "test-node",
    version: properties.version || 1,
    ...properties,
  }

  return new NodeClass(defaultProperties)
}

