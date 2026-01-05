import { BaseNode } from "./base-node"
import type { NodeOutput, NodePropertiesInput, WorkflowTrigger, ExecutionContext } from "@workflow/interfaces"
import { NodeState, WorkflowState } from "@workflow/interfaces"
import type { ExecutionEngine } from "@workflow/execution"

/**
 * Abstract base class for all trigger nodes
 * Triggers are special nodes that initiate workflow execution
 * In the unified node model, triggers are identified by the isTrigger property
 * Subclasses must implement activate() to define trigger-specific behavior
 * and process() to handle normal node execution when triggered
 */
export abstract class TriggerNodeBase extends BaseNode implements WorkflowTrigger {
  /** Execution engine for workflow execution */
  protected executionEngine?: ExecutionEngine

  /**
   * Creates a new TriggerNodeBase instance
   * Sets isTrigger property to true to identify this as a trigger node
   * @param properties - Node properties (isTrigger will be set to true)
   */
  constructor(properties: NodePropertiesInput) {
    super(properties)
    // Mark this node as a trigger in the unified model
    this.properties.isTrigger = true
  }

  /**
   * Triggers the workflow execution
   * This method initiates workflow execution and then processes the trigger node
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
   * Processes the trigger node execution
   * In unified model, triggers can be executed like regular nodes
   * This method is called by the execution engine when the trigger is executed
   * @param context - Execution context containing input data and state
   * @returns Promise that resolves to output data (port name based)
   */
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    // For triggers, process() is called after activate() has initiated workflow execution
    // Return the default data or data from context
    const outputPortName = this.outputs[0]?.name || "output"
    if (context.input[outputPortName]) {
      const inputData = context.input[outputPortName]
      const normalized = Array.isArray(inputData) ? inputData : [inputData]
      return { [outputPortName]: normalized.length === 1 ? normalized[0] : normalized }
    }
    return this.getDefaultData()
  }

  /**
   * Internal method that performs the actual trigger activation
   * Called by trigger() after validation
   * This should initiate workflow execution and set up the trigger's output data
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
