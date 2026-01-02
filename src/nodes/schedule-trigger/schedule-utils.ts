import type {
  ScheduleConfig,
  MinuteScheduleConfig,
  HourScheduleConfig,
  DayScheduleConfig,
  MonthScheduleConfig,
  YearScheduleConfig,
  IntervalScheduleConfig,
} from "../../interfaces/schedule"
import { ScheduleValidationError } from "../../interfaces/schedule"

/**
 * Validates a schedule configuration
 * @param config - Schedule configuration to validate
 * @throws ScheduleValidationError if the configuration is invalid
 */
export function validateScheduleConfig(config: ScheduleConfig): void {
  switch (config.type) {
    case "minute":
      validateMinuteSchedule(config)
      break
    case "hour":
      validateHourSchedule(config)
      break
    case "day":
      validateDaySchedule(config)
      break
    case "month":
      validateMonthSchedule(config)
      break
    case "year":
      validateYearSchedule(config)
      break
    case "interval":
      validateIntervalSchedule(config)
      break
    default:
      throw new ScheduleValidationError(`Unknown schedule type: ${(config as ScheduleConfig).type}`)
  }
}

/**
 * Validates minute-based schedule configuration
 * @param config - Minute schedule configuration
 * @throws ScheduleValidationError if invalid
 */
function validateMinuteSchedule(config: MinuteScheduleConfig): void {
  if (config.second < 0 || config.second > 59) {
    throw new ScheduleValidationError(`Second value must be between 0 and 59, got ${config.second}`)
  }
}

/**
 * Validates hour-based schedule configuration
 * @param config - Hour schedule configuration
 * @throws ScheduleValidationError if invalid
 */
function validateHourSchedule(config: HourScheduleConfig): void {
  if (config.minute < 0 || config.minute > 59) {
    throw new ScheduleValidationError(`Minute value must be between 0 and 59, got ${config.minute}`)
  }
  if (config.second < 0 || config.second > 59) {
    throw new ScheduleValidationError(`Second value must be between 0 and 59, got ${config.second}`)
  }
}

/**
 * Validates day-based schedule configuration
 * @param config - Day schedule configuration
 * @throws ScheduleValidationError if invalid
 */
function validateDaySchedule(config: DayScheduleConfig): void {
  if (config.hour < 0 || config.hour > 23) {
    throw new ScheduleValidationError(`Hour value must be between 0 and 23, got ${config.hour}`)
  }
  if (config.minute < 0 || config.minute > 59) {
    throw new ScheduleValidationError(`Minute value must be between 0 and 59, got ${config.minute}`)
  }
  if (config.second < 0 || config.second > 59) {
    throw new ScheduleValidationError(`Second value must be between 0 and 59, got ${config.second}`)
  }
}

/**
 * Validates month-based schedule configuration
 * @param config - Month schedule configuration
 * @throws ScheduleValidationError if invalid
 */
function validateMonthSchedule(config: MonthScheduleConfig): void {
  if (config.day < 1 || config.day > 31) {
    throw new ScheduleValidationError(`Day value must be between 1 and 31, got ${config.day}`)
  }
  if (config.hour < 0 || config.hour > 23) {
    throw new ScheduleValidationError(`Hour value must be between 0 and 23, got ${config.hour}`)
  }
  if (config.minute < 0 || config.minute > 59) {
    throw new ScheduleValidationError(`Minute value must be between 0 and 59, got ${config.minute}`)
  }
  if (config.second < 0 || config.second > 59) {
    throw new ScheduleValidationError(`Second value must be between 0 and 59, got ${config.second}`)
  }
}

/**
 * Validates year-based schedule configuration
 * @param config - Year schedule configuration
 * @throws ScheduleValidationError if invalid
 */
function validateYearSchedule(config: YearScheduleConfig): void {
  if (config.month < 1 || config.month > 12) {
    throw new ScheduleValidationError(`Month value must be between 1 and 12, got ${config.month}`)
  }
  if (config.day < 1 || config.day > 31) {
    throw new ScheduleValidationError(`Day value must be between 1 and 31, got ${config.day}`)
  }
  if (config.hour < 0 || config.hour > 23) {
    throw new ScheduleValidationError(`Hour value must be between 0 and 23, got ${config.hour}`)
  }
  if (config.minute < 0 || config.minute > 59) {
    throw new ScheduleValidationError(`Minute value must be between 0 and 59, got ${config.minute}`)
  }
  if (config.second < 0 || config.second > 59) {
    throw new ScheduleValidationError(`Second value must be between 0 and 59, got ${config.second}`)
  }

  // Validate that the day is valid for the specified month
  const testDate = new Date(2000, config.month - 1, config.day)
  if (testDate.getDate() !== config.day || testDate.getMonth() !== config.month - 1) {
    throw new ScheduleValidationError(
      `Invalid day ${config.day} for month ${config.month} (e.g., February only has 28/29 days)`,
    )
  }
}

/**
 * Validates interval-based schedule configuration
 * @param config - Interval schedule configuration
 * @throws ScheduleValidationError if invalid
 */
function validateIntervalSchedule(config: IntervalScheduleConfig): void {
  if (config.intervalMs <= 0) {
    throw new ScheduleValidationError(`Interval must be greater than 0, got ${config.intervalMs}`)
  }
  if (config.intervalMs > 365 * 24 * 60 * 60 * 1000) {
    throw new ScheduleValidationError(`Interval must be less than 1 year, got ${config.intervalMs}`)
  }
}

/**
 * Calculates the next execution time for a minute-based schedule
 * @param config - Minute schedule configuration
 * @param currentTime - Current time (defaults to now)
 * @returns Date object representing the next execution time
 */
export function nextMinuteExecution(
  config: MinuteScheduleConfig,
  currentTime: Date = new Date(),
): Date {
  const next = new Date(currentTime)
  next.setUTCSeconds(config.second, 0)

  // If the scheduled second has already passed this minute, schedule for next minute
  if (next <= currentTime) {
    next.setUTCMinutes(next.getUTCMinutes() + 1)
  }

  return next
}

/**
 * Calculates the next execution time for an hour-based schedule
 * @param config - Hour schedule configuration
 * @param currentTime - Current time (defaults to now)
 * @returns Date object representing the next execution time
 */
export function nextHourExecution(
  config: HourScheduleConfig,
  currentTime: Date = new Date(),
): Date {
  const next = new Date(currentTime)
  next.setUTCMinutes(config.minute, config.second, 0)

  // If the scheduled time has already passed this hour, schedule for next hour
  if (next <= currentTime) {
    next.setUTCHours(next.getUTCHours() + 1)
  }

  return next
}

/**
 * Calculates the next execution time for a day-based schedule
 * @param config - Day schedule configuration
 * @param currentTime - Current time (defaults to now)
 * @returns Date object representing the next execution time
 */
export function nextDayExecution(
  config: DayScheduleConfig,
  currentTime: Date = new Date(),
): Date {
  const next = new Date(currentTime)
  next.setUTCHours(config.hour, config.minute, config.second, 0)

  // If the scheduled time has already passed today, schedule for tomorrow
  if (next <= currentTime) {
    next.setUTCDate(next.getUTCDate() + 1)
  }

  return next
}

/**
 * Calculates the next execution time for a month-based schedule
 * @param config - Month schedule configuration
 * @param currentTime - Current time (defaults to now)
 * @returns Date object representing the next execution time
 */
export function nextMonthExecution(
  config: MonthScheduleConfig,
  currentTime: Date = new Date(),
): Date {
  const currentYear = currentTime.getUTCFullYear()
  const currentMonth = currentTime.getUTCMonth()

  // Try to set the date in current month
  let next = new Date(Date.UTC(currentYear, currentMonth, config.day, config.hour, config.minute, config.second, 0))

  // If the day doesn't exist in current month (e.g., Feb 31), adjust to last day of month
  if (next.getUTCDate() !== config.day || next.getUTCMonth() !== currentMonth) {
    // Set to last day of current month
    const lastDay = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate()
    next = new Date(Date.UTC(currentYear, currentMonth, Math.min(config.day, lastDay), config.hour, config.minute, config.second, 0))
  }

  // If the scheduled time has already passed this month, schedule for next month
  if (next <= currentTime) {
    let targetMonth = currentMonth + 1
    let targetYear = currentYear
    if (targetMonth > 11) {
      targetMonth = 0
      targetYear++
    }

    // Try to set the day - if it doesn't exist, use last day of that month
    const testDate = new Date(Date.UTC(targetYear, targetMonth, config.day))
    if (testDate.getUTCDate() !== config.day || testDate.getUTCMonth() !== targetMonth) {
      // Day doesn't exist in target month, use last day of that month
      const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
      next = new Date(Date.UTC(targetYear, targetMonth, lastDay, config.hour, config.minute, config.second, 0))
    } else {
      next = new Date(Date.UTC(targetYear, targetMonth, config.day, config.hour, config.minute, config.second, 0))
    }
  }

  return next
}

/**
 * Calculates the next execution time for a year-based schedule
 * @param config - Year schedule configuration
 * @param currentTime - Current time (defaults to now)
 * @returns Date object representing the next execution time
 */
export function nextYearExecution(
  config: YearScheduleConfig,
  currentTime: Date = new Date(),
): Date {
  const currentYear = currentTime.getUTCFullYear()
  let targetYear = currentYear

  // Try to set the date in current year using UTC
  let next = new Date(Date.UTC(currentYear, config.month - 1, config.day, config.hour, config.minute, config.second, 0))

  // Check if the date is valid (handles leap years and invalid dates)
  if (next.getUTCMonth() !== config.month - 1 || next.getUTCDate() !== config.day) {
    // Date doesn't exist in current year, try next year
    targetYear = currentYear + 1
    next = new Date(Date.UTC(targetYear, config.month - 1, config.day, config.hour, config.minute, config.second, 0))

    // If still invalid, keep trying next years until valid
    while (next.getUTCMonth() !== config.month - 1 || next.getUTCDate() !== config.day) {
      targetYear++
      next = new Date(Date.UTC(targetYear, config.month - 1, config.day, config.hour, config.minute, config.second, 0))
    }
  }

  // If the scheduled time has already passed, move to next year
  if (next <= currentTime) {
    targetYear++
    next = new Date(Date.UTC(targetYear, config.month - 1, config.day, config.hour, config.minute, config.second, 0))

    // Validate date exists (handles leap years)
    while (next.getUTCMonth() !== config.month - 1 || next.getUTCDate() !== config.day) {
      targetYear++
      next = new Date(Date.UTC(targetYear, config.month - 1, config.day, config.hour, config.minute, config.second, 0))
    }
  }

  return next
}

/**
 * Calculates the next execution time for an interval-based schedule
 * @param config - Interval schedule configuration
 * @param currentTime - Current time (defaults to now)
 * @returns Date object representing the next execution time
 */
export function nextIntervalExecution(
  config: IntervalScheduleConfig,
  currentTime: Date = new Date(),
): Date {
  const next = new Date(currentTime.getTime() + config.intervalMs)
  return next
}

/**
 * Calculates the next execution time for any schedule configuration
 * @param config - Schedule configuration
 * @param currentTime - Current time (defaults to now)
 * @returns Date object representing the next execution time
 */
export function calculateNextExecution(
  config: ScheduleConfig,
  currentTime: Date = new Date(),
): Date {
  switch (config.type) {
    case "minute":
      return nextMinuteExecution(config, currentTime)
    case "hour":
      return nextHourExecution(config, currentTime)
    case "day":
      return nextDayExecution(config, currentTime)
    case "month":
      return nextMonthExecution(config, currentTime)
    case "year":
      return nextYearExecution(config, currentTime)
    case "interval":
      return nextIntervalExecution(config, currentTime)
    default:
      throw new ScheduleValidationError(`Unknown schedule type: ${(config as ScheduleConfig).type}`)
  }
}

