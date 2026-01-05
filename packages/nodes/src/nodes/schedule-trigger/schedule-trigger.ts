import { TriggerNodeBase } from "@workflow/core"
import type { NodePropertiesInput, NodeConfiguration, NodeOutput, ExecutionContext, ScheduleConfig } from "@workflow/interfaces"
import { WorkflowState } from "@workflow/interfaces"
import { LinkType, NodeState } from "@workflow/interfaces"
import { validateScheduleConfig, calculateNextExecution } from "./schedule-utils"
import type { ExecutionEngine } from "@workflow/execution"
import { scheduleTriggerSchema } from "./schema"

/**
 * Schedule trigger node that executes workflows on a time-based schedule
 * Supports minute, hour, day, month, and year intervals with second-level precision
 */
export class ScheduleTrigger extends TriggerNodeBase {
  /** Node type identifier for this class */
  static readonly nodeType = "schedule-trigger"

  private scheduleTimer?: NodeJS.Timeout
  private scheduleConfig?: ScheduleConfig
  private nextExecutionTime?: Date

  /**
   * Creates a new ScheduleTrigger
   * @param properties - Node properties (nodeType will be automatically set)
   */
  constructor(properties: NodePropertiesInput) {
    // Automatically set nodeType from class definition, overriding any user-provided value
    super({
      ...properties,
      nodeType: ScheduleTrigger.nodeType,
      isTrigger: true,
    })
    this.configurationSchema = scheduleTriggerSchema
    this.addOutput("output", "data", LinkType.Standard)
  }

  /**
   * Configures the trigger with schedule configuration
   * @param config - Configuration including schedule configuration
   */
  setup(config: NodeConfiguration): void {
    // If schedule is being changed while active, deactivate first
    if (this.scheduleTimer) {
      this.deactivateSchedule()
    }

    // Extract schedule configuration
    if (config.schedule) {
      const schedule = config.schedule as ScheduleConfig
      validateScheduleConfig(schedule)
      this.scheduleConfig = schedule
    }

    super.setup(config)

    this.activateSchedule()
  }

  /**
   * Activates the schedule trigger
   * Starts scheduling workflow executions based on the configured schedule
   */
  activateSchedule(): void {
    if (!this.scheduleConfig) {
      throw new Error("Schedule configuration is required before activation")
    }

    // Deactivate any existing schedule
    this.deactivateSchedule()

    // Calculate and schedule next execution
    this.scheduleNextExecution()
  }

  /**
   * Deactivates the schedule trigger
   * Stops all scheduled executions and cleans up resources
   */
  deactivateSchedule(): void {
    if (this.scheduleTimer) {
      clearTimeout(this.scheduleTimer)
      this.scheduleTimer = undefined
    }
    this.nextExecutionTime = undefined
  }


  /**
   * Sets the execution engine for workflow execution
   * Overrides base class to reactivate schedule after engine is set
   * @param engine - ExecutionEngine instance to use for workflow execution
   */
  setExecutionEngine(engine: ExecutionEngine): void {
    super.setExecutionEngine(engine)
    // Reactivate schedule if it's already configured
    // This ensures the schedule is active after the engine is set
    if (this.scheduleConfig) {
      this.activateSchedule()
    }
  }

  /**
   * Sets the callback function to be called when trigger activates
   * This callback should start the workflow execution
   * @param callback - Function that receives execution data and starts workflow
   * @deprecated Use setExecutionEngine instead for automatic workflow execution
   */
  setCallback(callback: (data: NodeOutput) => void): void {
    // For backward compatibility with tests
    this.setExecutionEngine({
      execute: async () => {
        callback(this.resultData || this.getDefaultData())
      },
      getWorkflowState: () => WorkflowState.Idle,
    } as unknown as ExecutionEngine)
  }

  /**
   * Gets default data for execution
   * Includes schedule information and execution timestamp
   * @returns Default execution data (port name based)
   */
  protected override getDefaultData(): NodeOutput {
    const executionData: NodeOutput = {
      output: {
        timestamp: new Date().toISOString(),
        scheduleType: this.scheduleConfig?.type,
        nextExecutionTime: this.nextExecutionTime?.toISOString(),
      },
    }
    return executionData
  }

  /**
   * Performs the actual trigger activation
   * Called when the scheduled time arrives
   * Schedules the next execution immediately before executing the workflow
   * @param data - Initial data for the workflow (port name based)
   */
  protected override activate(data: NodeOutput): void {
    // Reset state to Idle if needed (allows re-triggering)
    if (this.state === NodeState.Completed || this.state === NodeState.Failed) {
      this.setState(NodeState.Idle)
    }
    this.setState(NodeState.Running)
    // Set output data so connected nodes can access it
    this.resultData = data
    // Schedule next execution immediately, before executing the workflow
    // This ensures fixed intervals for interval type and proper timing for absolute time types
    this.activateSchedule()
    this.setState(NodeState.Completed)
    this.executeEngine()
  }

  private executeEngine(): void {
    if (this.executionEngine) {
      console.log(`[ScheduleTrigger] Executing workflow at ${new Date().toISOString()}`)
      this.executionEngine.execute(this.properties.name).catch((error) => {
        this.error = error instanceof Error ? error : new Error(String(error))
        console.error(`[ScheduleTrigger] Workflow execution failed:`, error)
      })
    } else {
      console.warn(`[ScheduleTrigger] Execution engine not set, skipping workflow execution`)
    }
  }

  /**
   * Internal processing method (required by BaseNode)
   * For triggers, this processes the trigger node execution after activation
   * @param context - Execution context containing input data and state
   * @returns Promise that resolves to output data (port name based)
   */
  protected override async process(context: ExecutionContext): Promise<NodeOutput> {
    // For schedule triggers, return the result data that was set during activate()
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

  /**
   * Calculates and schedules the next execution time
   * @private
   */
  private scheduleNextExecution(): void {
    if (!this.scheduleConfig) {
      return
    }

    // Clear any existing timer first
    if (this.scheduleTimer) {
      clearTimeout(this.scheduleTimer)
      this.scheduleTimer = undefined
    }

    // Calculate next execution time
    this.nextExecutionTime = calculateNextExecution(this.scheduleConfig)

    // Calculate milliseconds until next execution
    const now = new Date()
    const delayMs = this.nextExecutionTime.getTime() - now.getTime()

    // Schedule execution (use setTimeout for one-time execution, then reschedule)
    // Only schedule if delay is positive and reasonable (not more than 1 year)
    if (delayMs > 0 && delayMs < 365 * 24 * 60 * 60 * 1000) {
      console.log(
        `[ScheduleTrigger] Scheduled next execution at ${this.nextExecutionTime?.toISOString()} (in ${Math.round(delayMs / 1000)}s)`,
      )
      this.scheduleTimer = setTimeout(() => {
        try {
          // activate() will handle workflow execution via executionEngine.execute()
          const executionData = this.getDefaultData()
          this.activate(executionData)
        } catch (error) {
          // If workflow is already running, silently skip this execution
          // The error is expected and doesn't need to be propagated
          // The next scheduled execution will try again
          console.warn(`[ScheduleTrigger] Error during scheduled execution:`, error)
        }
      }, delayMs)
    } else {
      console.warn(
        `[ScheduleTrigger] Invalid delay ${delayMs}ms, not scheduling. Next execution time: ${this.nextExecutionTime?.toISOString()}`,
      )
    }
  }

  /**
   * Gets the next scheduled execution time
   * @returns Next execution time or undefined if not scheduled
   */
  getNextExecutionTime(): Date | undefined {
    return this.nextExecutionTime
  }

  /**
   * Gets the current schedule configuration
   * @returns Schedule configuration or undefined if not configured
   */
  getScheduleConfig(): ScheduleConfig | undefined {
    return this.scheduleConfig
  }
}

