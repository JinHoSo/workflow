import { TriggerNodeBase } from "./base-trigger"
import type { NodeProperties, NodeConfiguration, NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import type { ScheduleConfig } from "../interfaces/schedule"
import { LinkType } from "../types"
import { NodeState } from "../types"
import { WorkflowState } from "../interfaces"
import { validateScheduleConfig, calculateNextExecution } from "./schedule-utils"
import type { ExecutionEngine } from "../execution/execution-engine"

/**
 * Schedule trigger node that executes workflows on a time-based schedule
 * Supports minute, hour, day, month, and year intervals with second-level precision
 */
export class ScheduleTrigger extends TriggerNodeBase {
  private scheduleTimer?: NodeJS.Timeout
  private scheduleConfig?: ScheduleConfig
  private nextExecutionTime?: Date

  /**
   * Creates a new ScheduleTrigger
   * @param properties - Node properties
   */
  constructor(properties: NodeProperties) {
    super(properties)
    this.addOutput("output", "data", LinkType.Standard)
  }

  /**
   * Configures the trigger with schedule configuration
   * @param config - Configuration including schedule configuration
   */
  setup(config: NodeConfiguration): void {
    // If schedule is being changed while active, deactivate first
    if (this.scheduleTimer) {
      this.deactivate()
    }

    // Extract schedule configuration
    if (config.schedule) {
      const schedule = config.schedule as ScheduleConfig
      validateScheduleConfig(schedule)
      this.scheduleConfig = schedule
    }

    super.setup(config)

    // // Automatically activate schedule after setup completes (state is Idle)
    // if (this.scheduleConfig && this.state === NodeState.Idle) {
    //   this.activateSchedule()
    // }
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
    this.deactivate()

    // Calculate and schedule next execution
    this.scheduleNextExecution()
  }

  /**
   * Deactivates the schedule trigger
   * Stops all scheduled executions and cleans up resources
   */
  deactivate(): void {
    if (this.scheduleTimer) {
      clearTimeout(this.scheduleTimer)
      this.scheduleTimer = undefined
    }
    this.nextExecutionTime = undefined
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
    // Schedule next execution immediately, before executing the workflow
    // This ensures fixed intervals for interval type and proper timing for absolute time types
    if (this.scheduleConfig) {
      this.activateSchedule()
    }

    // Reset state to Idle if needed (allows re-triggering)
    if (this.state === NodeState.Completed || this.state === NodeState.Failed) {
      this.setState(NodeState.Idle)
    }
    this.setState(NodeState.Running)
    // Set output data so connected nodes can access it
    this.resultData = data
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
      this.scheduleTimer = setTimeout(() => {
        try {

          // Execute workflow if execution engine is set
          // ExecutionEngine.execute() will reset regular nodes, but the trigger's resultData
          // is already set and will be preserved during execution
          if (this.executionEngine) {
            // Execute workflow asynchronously but don't wait for it
            // This allows the trigger to complete immediately
            this.executionEngine.execute(this.properties.name).catch((error) => {
              // Don't set error state here - the workflow reset may have already occurred
              // and we can't transition from Completed to Failed anyway
              // Just store the error for inspection if needed
              this.error = error instanceof Error ? error : new Error(String(error))
              // Note: We don't set state to Failed because:
              // 1. The trigger is already Completed
              // 2. The workflow may have been reset, making state transitions invalid
              // 3. The error is still accessible via this.error for debugging
            })
          }

          const executionData = this.getDefaultData()
          this.activate(executionData)
        } catch (error) {
          // If workflow is already running, silently skip this execution
          // The error is expected and doesn't need to be propagated
          // The next scheduled execution will try again
        }
      }, delayMs)
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

