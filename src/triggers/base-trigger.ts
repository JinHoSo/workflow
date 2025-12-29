import { BaseNode } from "../core/base-node"
import type { NodeOutput } from "../interfaces"
import type { WorkflowTrigger } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import { NodeState } from "../types"
import { WorkflowState } from "../interfaces"
import type { ExecutionEngine } from "../execution/execution-engine"

/**
 * Abstract base class for all trigger nodes
 * Triggers are special nodes that initiate workflow execution
 * Subclasses must implement activate() to define trigger-specific behavior
 * Note: run() here is different from WorkflowNodeBase.run() - it triggers workflow, not node execution
 */
export abstract class TriggerNodeBase extends BaseNode implements WorkflowTrigger {
  /** Execution engine for workflow execution */
  protected executionEngine?: ExecutionEngine

  /**
   * Triggers the workflow execution
   * This method is separate from WorkflowNodeBase.run() as triggers have different semantics
   * @param data - Optional initial data to pass to the workflow (port name based)
   * @throws Error if workflow is already executing or trigger is not configured
   */
  trigger(data?: NodeOutput): void {
    // Check if workflow is already executing (Running state only)
    // Completed state is allowed - it means previous execution finished
    if (this.executionEngine) {
      const workflowState = this.executionEngine.getWorkflowState()
      if (workflowState === WorkflowState.Running) {
        throw new Error("Workflow is already executing")
      }
    }

    const executionData = data ?? this.getDefaultData()
    this.activate(executionData)
  }

  /**
   * Sets the execution engine for workflow execution
   * @param engine - ExecutionEngine instance to use for workflow execution
   */
  setExecutionEngine(engine: ExecutionEngine): void {
    this.executionEngine = engine
  }

  /**
   * Override WorkflowNodeBase.run() to prevent direct execution
   * Triggers should use trigger() method instead
   * @param _context - Execution context (not used for triggers)
   * @returns Never returns (always throws)
   * @throws Error indicating triggers should use trigger() method
   */
  override async run(_context: ExecutionContext): Promise<NodeOutput> {
    throw new Error("Triggers should use trigger() method, not WorkflowNodeBase.run()")
  }

  /**
   * Internal method that performs the actual trigger activation
   * Called by trigger() after validation
   * @param data - Initial data for the workflow (port name based)
   */
  protected abstract activate(data: NodeOutput): void

  /**
   * Gets default data for execution
   * Override in subclasses if needed
   * @returns Default execution data (port name based)
   */
  protected getDefaultData(): NodeOutput {
    const defaultPortName = this.outputs[0]?.name || "output"
    return { [defaultPortName]: {} }
  }

  /**
   * Override reset to set state to Idle
   * Triggers should remain ready to be triggered after reset (configuration is preserved)
   */
  override reset(): void {
    this.state = NodeState.Idle
    this.error = undefined
    this.resultData = {}
    // Note: We don't clear config here because triggers need their configuration
    // to remain valid after reset (e.g., schedule config)
  }
}
