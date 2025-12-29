import { BaseNode } from "../core/base-node"
import type { NodeOutput } from "../interfaces"
import type { WorkflowTrigger } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import { NodeState } from "../types"

/**
 * Abstract base class for all trigger nodes
 * Triggers are special nodes that initiate workflow execution
 * Subclasses must implement activate() to define trigger-specific behavior
 * Note: run() here is different from WorkflowNodeBase.run() - it triggers workflow, not node execution
 */
export abstract class WorkflowTriggerBase extends BaseNode implements WorkflowTrigger {
  /**
   * Triggers the workflow execution
   * This method is separate from WorkflowNodeBase.run() as triggers have different semantics
   * @param data - Optional initial data to pass to the workflow (port name based)
   */
  trigger(data?: NodeOutput): void {
    if (this.state === NodeState.Idle) {
      throw new Error("Trigger must be configured before execution")
    }
    const executionData = data ?? this.getDefaultData()
    this.activate(executionData)
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
}
