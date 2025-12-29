import { WorkflowTriggerBase } from "./base-trigger"
import type { NodeProperties, NodeConfiguration, NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import type { ScheduleConfig } from "../interfaces/schedule"
import { LinkType } from "../types"
import { NodeState } from "../types"
import { validateScheduleConfig, calculateNextExecution } from "./schedule-utils"

/**
 * Schedule trigger node that executes workflows on a time-based schedule
 * Supports minute, hour, day, month, and year intervals with second-level precision
 */
export class ScheduleTrigger extends WorkflowTriggerBase {
  private workflowCallback?: (data: NodeOutput) => void
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

    // Automatically activate schedule after setup completes (state becomes Ready)
    if (this.scheduleConfig && this.state === NodeState.Ready) {
      this.activateSchedule()
    }
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
   */
  setCallback(callback: (data: NodeOutput) => void): void {
    this.workflowCallback = callback
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
   * @param data - Initial data for the workflow (port name based)
   */
  protected override activate(data: NodeOutput): void {
    // Reset state to Ready if needed (allows re-triggering)
    if (this.state === NodeState.Completed || this.state === NodeState.Failed) {
      this.setState(NodeState.Ready)
    }
    this.setState(NodeState.Running)
    // Set output data so connected nodes can access it
    this.resultData = data
    if (this.workflowCallback) {
      this.workflowCallback(data)
    }
    this.setState(NodeState.Completed)

    // Schedule next execution after current execution completes
    if (this.scheduleConfig) {
      this.scheduleNextExecution()
    }
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
        const executionData = this.getDefaultData()
        this.trigger(executionData)
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

