import { WorkflowTriggerBase } from "./base-trigger"
import type { NodeProperties, NodeConfiguration, NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import { LinkType } from "../types"
import { NodeState } from "../types"

/**
 * Manual trigger node that allows programmatic workflow execution
 * Can be called directly via trigger() method to start workflow execution
 */
export class ManualTrigger extends WorkflowTriggerBase {
  private workflowCallback?: (data: NodeOutput) => void

  /**
   * Creates a new ManualTrigger
   * @param properties - Node properties
   */
  constructor(properties: NodeProperties) {
    super(properties)
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
   */
  setCallback(callback: (data: NodeOutput) => void): void {
    this.workflowCallback = callback
  }

  /**
   * Performs the actual trigger activation
   * Calls the workflow callback if set
   * @param data - Initial data for the workflow (port name based)
   */
  protected override activate(data: NodeOutput): void {
    this.setState(NodeState.Running)
    // Set output data so connected nodes can access it
    this.resultData = data
    if (this.workflowCallback) {
      this.workflowCallback(data)
    }
    this.setState(NodeState.Completed)
  }

  /**
   * Internal processing method (required by WorkflowNodeBase)
   * @param context - Execution context (not used for triggers)
   * @returns Promise that resolves to input data as-is
   */
  protected override async process(context: ExecutionContext): Promise<NodeOutput> {
    return context.input
  }
}
