import type { Node } from "../interfaces"
import type { ExecutionProtocol } from "./execution"
import type { DataFlowProtocol } from "./data-flow"
import type { ErrorHandlingProtocol } from "./error-handling"
import { BaseNode } from "../core/base-node"
import { NodeState } from "../types"

/**
 * Protocol compliance validation result
 */
export interface ProtocolComplianceResult {
  /** Whether the node is compliant with all protocols */
  compliant: boolean
  /** List of compliance issues found */
  issues: ProtocolComplianceIssue[]
}

/**
 * Protocol compliance issue
 */
export interface ProtocolComplianceIssue {
  /** Protocol that has the issue */
  protocol: "execution" | "data-flow" | "error-handling"
  /** Issue description */
  message: string
  /** Severity of the issue */
  severity: "error" | "warning"
}

/**
 * Validates protocol compliance for nodes and protocol implementations
 */
export class ProtocolValidator {
  /**
   * Validates that a node is compliant with execution protocol
   * @param node - Node to validate
   * @param executionProtocol - Execution protocol instance
   * @returns Compliance result
   */
  validateExecutionCompliance(
    node: Node,
    executionProtocol: ExecutionProtocol,
  ): ProtocolComplianceResult {
    const issues: ProtocolComplianceIssue[] = []

    // Check if node is a BaseNode instance (required for execution protocol)
    if (!(node instanceof BaseNode)) {
      issues.push({
        protocol: "execution",
        message: `Node ${node.properties.name} is not a BaseNode instance and cannot be executed via ExecutionProtocol`,
        severity: "error",
      })
    }

    // Validate execution readiness
    if (!executionProtocol.validateExecution(node)) {
      if (node.state !== NodeState.Idle) {
        issues.push({
          protocol: "execution",
          message: `Node ${node.properties.name} is not in Idle state (current: ${node.state})`,
          severity: "error",
        })
      }
      if (node.properties.disabled) {
        issues.push({
          protocol: "execution",
          message: `Node ${node.properties.name} is disabled`,
          severity: "warning",
        })
      }
    }

    // Check if node has required methods for execution
    if (node instanceof BaseNode) {
      if (typeof node.run !== "function") {
        issues.push({
          protocol: "execution",
          message: `Node ${node.properties.name} does not have a run() method`,
          severity: "error",
        })
      }
      if (typeof node.setState !== "function") {
        issues.push({
          protocol: "execution",
          message: `Node ${node.properties.name} does not have a setState() method`,
          severity: "error",
        })
      }
    }

    return {
      compliant: issues.filter((i) => i.severity === "error").length === 0,
      issues,
    }
  }

  /**
   * Validates that a node is compliant with data flow protocol
   * @param node - Node to validate
   * @param dataFlowProtocol - Data flow protocol instance
   * @returns Compliance result
   */
  validateDataFlowCompliance(
    node: Node,
    _dataFlowProtocol: DataFlowProtocol,
  ): ProtocolComplianceResult {
    const issues: ProtocolComplianceIssue[] = []

    // Check if node has input ports defined
    if (!node.inputs || node.inputs.length === 0) {
      // This is a warning, not an error, as some nodes (like triggers) may not have inputs
      if (!node.properties.isTrigger) {
        issues.push({
          protocol: "data-flow",
          message: `Node ${node.properties.name} has no input ports defined`,
          severity: "warning",
        })
      }
    }

    // Check if node has output ports defined
    if (!node.outputs || node.outputs.length === 0) {
      issues.push({
        protocol: "data-flow",
        message: `Node ${node.properties.name} has no output ports defined`,
        severity: "error",
      })
    }

    // Validate port data types are strings (required for protocol)
    for (const input of node.inputs || []) {
      if (typeof input.dataType !== "string") {
        issues.push({
          protocol: "data-flow",
          message: `Node ${node.properties.name} input port "${input.name}" has invalid dataType`,
          severity: "error",
        })
      }
    }

    for (const output of node.outputs || []) {
      if (typeof output.dataType !== "string") {
        issues.push({
          protocol: "data-flow",
          message: `Node ${node.properties.name} output port "${output.name}" has invalid dataType`,
          severity: "error",
        })
      }
    }

    return {
      compliant: issues.filter((i) => i.severity === "error").length === 0,
      issues,
    }
  }

  /**
   * Validates that a node is compliant with error handling protocol
   * @param node - Node to validate
   * @param errorHandlingProtocol - Error handling protocol instance
   * @returns Compliance result
   */
  validateErrorHandlingCompliance(
    node: Node,
    _errorHandlingProtocol: ErrorHandlingProtocol,
  ): ProtocolComplianceResult {
    const issues: ProtocolComplianceIssue[] = []
    const nodeName = node.properties.name

    // Check if node has error property (required for error handling)
    // BaseNode has error?: Error, so we check if the property exists in the object
    // For BaseNode instances, error property always exists (even if undefined)
    if (!(node instanceof BaseNode) && !("error" in node)) {
      issues.push({
        protocol: "error-handling",
        message: `Node ${nodeName} does not have an error property`,
        severity: "error",
      })
    }

    // Check if node has state property (required for error handling)
    // BaseNode always has state property
    if (!(node instanceof BaseNode) && !("state" in node)) {
      issues.push({
        protocol: "error-handling",
        message: `Node ${nodeName} does not have a state property`,
        severity: "error",
      })
    }

    // Check if node has continueOnFail property (optional but recommended)
    if (!("continueOnFail" in node.properties)) {
      issues.push({
        protocol: "error-handling",
        message: `Node ${nodeName} does not have continueOnFail property in properties`,
        severity: "warning",
      })
    }

    return {
      compliant: issues.filter((i) => i.severity === "error").length === 0,
      issues,
    }
  }

  /**
   * Validates that a node is compliant with all protocols
   * @param node - Node to validate
   * @param executionProtocol - Execution protocol instance
   * @param dataFlowProtocol - Data flow protocol instance
   * @param errorHandlingProtocol - Error handling protocol instance
   * @returns Combined compliance result
   */
  validateAllProtocols(
    node: Node,
    executionProtocol: ExecutionProtocol,
    dataFlowProtocol: DataFlowProtocol,
    errorHandlingProtocol: ErrorHandlingProtocol,
  ): ProtocolComplianceResult {
    const executionResult = this.validateExecutionCompliance(node, executionProtocol)
    const dataFlowResult = this.validateDataFlowCompliance(node, dataFlowProtocol)
    const errorHandlingResult = this.validateErrorHandlingCompliance(node, errorHandlingProtocol)

    const allIssues = [
      ...executionResult.issues,
      ...dataFlowResult.issues,
      ...errorHandlingResult.issues,
    ]

    return {
      compliant: allIssues.filter((i) => i.severity === "error").length === 0,
      issues: allIssues,
    }
  }
}

/**
 * Global protocol validator instance
 */
export const protocolValidator = new ProtocolValidator()

