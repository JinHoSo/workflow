# Retry Configuration Guide

This guide explains how to configure retry mechanisms for nodes in workflows.

## Overview

The retry mechanism allows nodes to automatically retry execution when they fail, with configurable retry strategies and limits. This is useful for handling transient errors, network issues, or temporary service unavailability.

## Configuration

Retry configuration is done through node properties:

```typescript
interface NodeProperties {
  // Enable retry on failure
  retryOnFail?: boolean

  // Maximum number of retry attempts (default: 3)
  maxRetries?: number

  // Delay configuration between retries
  retryDelay?: number | { baseDelay?: number; maxDelay?: number }
}
```

## Retry Strategies

### Fixed Delay Strategy

Use a constant delay between retry attempts:

```typescript
const node = new MyNode({
  id: "node-1",
  name: "my-node",
  nodeType: "my-type",
  version: 1,
  position: [0, 0],
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: 1000, // Fixed 1 second delay
})
```

### Exponential Backoff Strategy

Use exponential backoff for retry delays:

```typescript
const node = new MyNode({
  id: "node-1",
  name: "my-node",
  nodeType: "my-type",
  version: 1,
  position: [0, 0],
  retryOnFail: true,
  maxRetries: 5,
  retryDelay: {
    baseDelay: 1000,    // Start with 1 second
    maxDelay: 30000,    // Cap at 30 seconds
  },
})
```

With exponential backoff, delays increase as: `baseDelay * (2 ^ (attemptNumber - 1))`, capped at `maxDelay`.

## Examples

### Basic Retry Configuration

```typescript
import { JavaScriptNode } from "./nodes/javascript-execution-node"

const node = new JavaScriptNode({
  id: "node-1",
  name: "api-call",
  nodeType: "javascript",
  version: 1,
  position: [0, 0],
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: 2000, // 2 second fixed delay
})

node.setup({
  code: `
    // API call that might fail
    const response = await fetch('https://api.example.com/data')
    return { data: await response.json() }
  `,
})
```

### Exponential Backoff for API Calls

```typescript
const node = new HttpRequestNode({
  id: "node-1",
  name: "http-request",
  nodeType: "http-request",
  version: 1,
  position: [0, 0],
  retryOnFail: true,
  maxRetries: 5,
  retryDelay: {
    baseDelay: 1000,   // 1 second
    maxDelay: 60000,   // 1 minute max
  },
})

node.setup({
  method: "GET",
  url: "https://api.example.com/data",
})
```

### Disabling Retry

```typescript
const node = new MyNode({
  id: "node-1",
  name: "my-node",
  nodeType: "my-type",
  version: 1,
  position: [0, 0],
  retryOnFail: false, // No retry
})
```

## Retry Behavior

1. **Initial Attempt**: The node executes normally
2. **On Failure**: If `retryOnFail` is `true` and attempts remain, the node waits for the configured delay
3. **Retry**: The node executes again with the same input
4. **Exhaustion**: If all retries fail, the node's error is propagated and workflow execution may fail (unless `continueOnFail` is set)

## Best Practices

1. **Use exponential backoff** for external API calls to avoid overwhelming services
2. **Set appropriate maxRetries** based on the expected failure rate and acceptable delay
3. **Consider maxDelay** to prevent extremely long waits
4. **Use fixed delay** for quick retries on transient errors
5. **Combine with continueOnFail** to allow workflow to continue even if a node fails after retries

## Integration with Error Handling

Retry works in conjunction with the error handling protocol:

```typescript
const node = new MyNode({
  id: "node-1",
  name: "my-node",
  nodeType: "my-type",
  version: 1,
  position: [0, 0],
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: 1000,
  continueOnFail: true, // Continue workflow even if all retries fail
})
```

## See Also

- [Error Handling Protocol](./PROTOCOLS.md#error-handling-protocol)
- [Execution Engine](../src/execution/execution-engine.ts)
- [Retry Strategy Implementation](../src/execution/retry-strategy.ts)

