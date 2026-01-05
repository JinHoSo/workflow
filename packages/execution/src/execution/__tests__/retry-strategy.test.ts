/**
 * Tests for RetryStrategy
 * Tests exponential backoff, fixed delay, and retry strategy creation
 */

import {
  ExponentialBackoffRetryStrategy,
  FixedDelayRetryStrategy,
  createRetryStrategy,
} from "../retry-strategy"

describe("RetryStrategy", () => {
  describe("ExponentialBackoffRetryStrategy", () => {
    it("should calculate exponential delay", () => {
      const strategy = new ExponentialBackoffRetryStrategy(1000, 30000)
      expect(strategy.calculateDelay(1)).toBe(1000)
      expect(strategy.calculateDelay(2)).toBe(2000)
      expect(strategy.calculateDelay(3)).toBe(4000)
      expect(strategy.calculateDelay(4)).toBe(8000)
    })

    it("should cap delay at max delay", () => {
      const strategy = new ExponentialBackoffRetryStrategy(1000, 5000)
      expect(strategy.calculateDelay(10)).toBeLessThanOrEqual(5000)
    })

    it("should determine if retry should be attempted", () => {
      const strategy = new ExponentialBackoffRetryStrategy()
      expect(strategy.shouldRetry(1, 3)).toBe(true)
      expect(strategy.shouldRetry(2, 3)).toBe(true)
      expect(strategy.shouldRetry(3, 3)).toBe(true)
      expect(strategy.shouldRetry(4, 3)).toBe(false)
    })

    it("should use default values", () => {
      const strategy = new ExponentialBackoffRetryStrategy()
      expect(strategy.calculateDelay(1)).toBe(1000)
    })
  })

  describe("FixedDelayRetryStrategy", () => {
    it("should calculate fixed delay", () => {
      const strategy = new FixedDelayRetryStrategy(2000)
      expect(strategy.calculateDelay(1)).toBe(2000)
      expect(strategy.calculateDelay(2)).toBe(2000)
      expect(strategy.calculateDelay(10)).toBe(2000)
    })

    it("should determine if retry should be attempted", () => {
      const strategy = new FixedDelayRetryStrategy()
      expect(strategy.shouldRetry(1, 3)).toBe(true)
      expect(strategy.shouldRetry(3, 3)).toBe(true)
      expect(strategy.shouldRetry(4, 3)).toBe(false)
    })

    it("should use default delay", () => {
      const strategy = new FixedDelayRetryStrategy()
      expect(strategy.calculateDelay(1)).toBe(1000)
    })
  })

  describe("createRetryStrategy", () => {
    it("should create fixed delay strategy from number", () => {
      const strategy = createRetryStrategy(2000)
      expect(strategy).toBeInstanceOf(FixedDelayRetryStrategy)
      expect(strategy.calculateDelay(1)).toBe(2000)
    })

    it("should create exponential backoff strategy from object", () => {
      const strategy = createRetryStrategy({ baseDelay: 1000, maxDelay: 10000 })
      expect(strategy).toBeInstanceOf(ExponentialBackoffRetryStrategy)
    })

    it("should create default fixed delay strategy when no config provided", () => {
      const strategy = createRetryStrategy()
      expect(strategy).toBeInstanceOf(FixedDelayRetryStrategy)
      expect(strategy.calculateDelay(1)).toBe(1000)
    })

    it("should create exponential backoff with default values", () => {
      const strategy = createRetryStrategy({})
      expect(strategy).toBeInstanceOf(ExponentialBackoffRetryStrategy)
    })
  })
})

