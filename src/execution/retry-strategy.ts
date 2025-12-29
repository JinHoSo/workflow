/**
 * Retry strategy interface
 */
export interface RetryStrategy {
  /**
   * Calculates the delay before the next retry attempt
   * @param attemptNumber - Current attempt number (1-based)
   * @returns Delay in milliseconds
   */
  calculateDelay(attemptNumber: number): number

  /**
   * Determines if another retry should be attempted
   * @param attemptNumber - Current attempt number (1-based)
   * @param maxRetries - Maximum number of retries allowed
   * @returns true if another retry should be attempted
   */
  shouldRetry(attemptNumber: number, maxRetries: number): boolean
}

/**
 * Exponential backoff retry strategy
 * Delay increases exponentially: delay = baseDelay * (2 ^ (attemptNumber - 1))
 */
export class ExponentialBackoffRetryStrategy implements RetryStrategy {
  private baseDelay: number
  private maxDelay: number

  /**
   * Creates a new exponential backoff retry strategy
   * @param baseDelay - Base delay in milliseconds (default: 1000)
   * @param maxDelay - Maximum delay in milliseconds (default: 30000)
   */
  constructor(baseDelay: number = 1000, maxDelay: number = 30000) {
    this.baseDelay = baseDelay
    this.maxDelay = maxDelay
  }

  calculateDelay(attemptNumber: number): number {
    const delay = this.baseDelay * Math.pow(2, attemptNumber - 1)
    return Math.min(delay, this.maxDelay)
  }

  shouldRetry(attemptNumber: number, maxRetries: number): boolean {
    return attemptNumber <= maxRetries
  }
}

/**
 * Fixed delay retry strategy
 * Uses a constant delay between retries
 */
export class FixedDelayRetryStrategy implements RetryStrategy {
  private delay: number

  /**
   * Creates a new fixed delay retry strategy
   * @param delay - Delay in milliseconds between retries (default: 1000)
   */
  constructor(delay: number = 1000) {
    this.delay = delay
  }

  calculateDelay(_attemptNumber: number): number {
    return this.delay
  }

  shouldRetry(attemptNumber: number, maxRetries: number): boolean {
    return attemptNumber <= maxRetries
  }
}

/**
 * Creates a retry strategy based on node configuration
 * @param retryDelay - Delay configuration (number for fixed, or object for exponential)
 * @returns Retry strategy instance
 */
export function createRetryStrategy(retryDelay?: number | { baseDelay?: number; maxDelay?: number }): RetryStrategy {
  if (!retryDelay) {
    return new FixedDelayRetryStrategy(1000)
  }

  if (typeof retryDelay === "number") {
    return new FixedDelayRetryStrategy(retryDelay)
  }

  return new ExponentialBackoffRetryStrategy(retryDelay.baseDelay, retryDelay.maxDelay)
}

