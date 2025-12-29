/**
 * Schedule configuration types for ScheduleTrigger
 * Supports multiple interval types with second-level precision
 */

/**
 * Minute-based schedule configuration
 * Executes every minute at the specified second
 */
export interface MinuteScheduleConfig {
  /** Schedule type identifier */
  type: "minute"
  /** Second value (0-59) */
  second: number
}

/**
 * Hour-based schedule configuration
 * Executes every hour at the specified minute and second
 */
export interface HourScheduleConfig {
  /** Schedule type identifier */
  type: "hour"
  /** Minute value (0-59) */
  minute: number
  /** Second value (0-59) */
  second: number
}

/**
 * Day-based schedule configuration
 * Executes every day at the specified time
 */
export interface DayScheduleConfig {
  /** Schedule type identifier */
  type: "day"
  /** Hour value (0-23) */
  hour: number
  /** Minute value (0-59) */
  minute: number
  /** Second value (0-59) */
  second: number
}

/**
 * Month-based schedule configuration
 * Executes on the specified day of each month at the specified time
 */
export interface MonthScheduleConfig {
  /** Schedule type identifier */
  type: "month"
  /** Day of month (1-31) */
  day: number
  /** Hour value (0-23) */
  hour: number
  /** Minute value (0-59) */
  minute: number
  /** Second value (0-59) */
  second: number
}

/**
 * Year-based schedule configuration
 * Executes on the specified date and time each year
 */
export interface YearScheduleConfig {
  /** Schedule type identifier */
  type: "year"
  /** Month value (1-12) */
  month: number
  /** Day of month (1-31) */
  day: number
  /** Hour value (0-23) */
  hour: number
  /** Minute value (0-59) */
  minute: number
  /** Second value (0-59) */
  second: number
}

/**
 * Interval-based schedule configuration
 * Executes at regular intervals (e.g., every 3 minutes, every 30 seconds)
 */
export interface IntervalScheduleConfig {
  /** Schedule type identifier */
  type: "interval"
  /** Interval value in milliseconds */
  intervalMs: number
}

/**
 * Union type for all schedule configuration types
 */
export type ScheduleConfig =
  | MinuteScheduleConfig
  | HourScheduleConfig
  | DayScheduleConfig
  | MonthScheduleConfig
  | YearScheduleConfig
  | IntervalScheduleConfig

/**
 * Validation error for schedule configuration
 */
export class ScheduleValidationError extends Error {
  /**
   * Creates a new ScheduleValidationError
   * @param message - Error message describing the validation failure
   */
  constructor(message: string) {
    super(message)
    this.name = "ScheduleValidationError"
  }
}

