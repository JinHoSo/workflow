import { TriggerNodeBase } from "./base-trigger"
import type { NodeProperties, NodeConfiguration, NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import type { ExecutionEngine } from "../execution/execution-engine"
import { LinkType } from "../types"
import { NodeState } from "../types"
import { WorkflowState } from "../interfaces"
import { manualTriggerSchema } from "../schemas/manual-trigger-schema"

/**
 * Manual trigger node that allows programmatic workflow execution
 * Can be called directly via trigger() method to start workflow execution
 */
export class ManualTrigger extends TriggerNodeBase {
  private workflowCallback?: (data: NodeOutput) => void

  /**
   * Creates a new ManualTrigger
   * @param properties - Node properties
   */
  constructor(properties: NodeProperties) {
    super({ ...properties, isTrigger: true })
    this.configurationSchema = manualTriggerSchema
    this.addOutput("output", "data", LinkType.Standard)
  }

  /**
   * Gets default data for execution
   * Uses configured initialData if available, otherwise returns empty data
   * @returns Default execution data (port name based)
   */
  protected override getDefaultData(): NodeOutput {
    if (this.config.initialData) {
      return this.config.initialData as NodeOutput
    }
    return { output: {} }
  }

  /**
   * Configures the trigger with optional initial data
   * @param config - Configuration including optional initialData
   */
  setup(config: NodeConfiguration): void {
    if (config.initialData) {
      this.config.initialData = config.initialData
    }
    super.setup(config)
  }


  /**
   * Sets the callback function to be called when trigger activates
   * This callback should start the workflow execution
   * @param callback - Function that receives execution data and starts workflow
   * @deprecated Use setExecutionEngine instead for automatic workflow execution
   */
  setCallback(callback: (data: NodeOutput) => void): void {
    // For backward compatibility with tests
    this.workflowCallback = callback
    this.setExecutionEngine({
      execute: async () => {
        callback(this.resultData || this.getDefaultData())
      },
      getWorkflowState: () => WorkflowState.Idle,
    } as unknown as ExecutionEngine)
  }

  /**
   * Performs the actual trigger activation
   * Sets trigger output data and executes workflow via ExecutionEngine
   * @param data - Initial data for the workflow (port name based)
   */
  protected override activate(data: NodeOutput): void {
    // If trigger is already completed, reset to Idle first to allow re-execution
    if (this.state === NodeState.Completed) {
      this.state = NodeState.Idle
    }
    this.setState(NodeState.Running)
    // Set output data so connected nodes can access it
    this.resultData = data
    this.setState(NodeState.Completed)

    // Execute workflow if execution engine is set
    // ExecutionEngine.execute() will reset regular nodes, but the trigger's resultData
    // is already set and will be preserved during execution
    if (this.executionEngine) {
      // Execute workflow asynchronously but don't wait for it
      // This allows the trigger to complete immediately
      // Note: ExecutionEngine.execute() will set workflow state to Failed on error
      this.executionEngine.execute(this.properties.name).catch((error) => {
        // Store the error for inspection
        this.error = error instanceof Error ? error : new Error(String(error))
        // ExecutionEngine.execute() already sets workflow state to Failed on error,
        // so we don't need to set it here
      })
    } else if (this.workflowCallback) {
      // Fallback to callback for backward compatibility
      this.workflowCallback(data)
    }
  }

  /**
   * Internal processing method (required by BaseNode)
   * For triggers, this processes the trigger node execution after activation
   * @param context - Execution context containing input data and state
   * @returns Promise that resolves to output data (port name based)
   */
  protected override async process(context: ExecutionContext): Promise<NodeOutput> {
    // For manual triggers, return the result data that was set during activate()
    // If resultData is already set (from activate()), use it
    if (Object.keys(this.resultData).length > 0) {
      return this.resultData
    }
    // Otherwise, return input data or default data
    const outputPortName = this.outputs[0]?.name || "output"
    if (context.input[outputPortName]) {
      const inputData = context.input[outputPortName]
      const normalized = Array.isArray(inputData) ? inputData : [inputData]
      return { [outputPortName]: normalized.length === 1 ? normalized[0] : normalized }
    }
    return this.getDefaultData()
  }
}
