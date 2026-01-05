# Retry Strategies

Configuring retry mechanisms for nodes in Workflow Engine.

## Retry Overview

Retry mechanisms allow nodes to automatically retry on failure, making workflows more resilient to transient errors.

## Basic Retry Configuration

### Enable Retry

```typescript
const node = new MyNode({
  // ... other properties
  retryOnFail: true,
  maxRetries: 3,
})
```

## Retry Strategies

### Fixed Delay

Retry after a fixed delay:

```typescript
const node = new MyNode({
  // ... other properties
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: 1000, // 1 second delay between retries
})
```

### Exponential Backoff

Retry with increasing delays:

```typescript
const node = new MyNode({
  // ... other properties
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: {
    baseDelay: 1000,    // Start with 1 second
    maxDelay: 10000,    // Maximum 10 seconds
  },
})
```

## Retry Behavior

### Retry Attempts

- First attempt: Initial execution
- Retry attempts: Up to `maxRetries` additional attempts
- Total attempts: `maxRetries + 1`

### Retry Conditions

Retries occur when:
- Node execution fails (throws error)
- Node state is `Failed`
- `retryOnFail` is `true`
- Retry attempts remaining (`maxRetries` not exceeded)

## When to Use Retry

### Use Retry For

- **Transient errors**: Network timeouts, temporary service unavailability
- **Rate limiting**: API rate limit errors
- **Temporary failures**: Database connection issues, file system errors

### Don't Use Retry For

- **Validation errors**: Invalid input data
- **Authentication errors**: Invalid credentials
- **Permanent errors**: Missing resources, invalid configuration

## Best Practices

1. **Set appropriate max retries**: Don't retry too many times
2. **Use exponential backoff**: For rate-limited APIs
3. **Log retry attempts**: Track retry behavior
4. **Consider timeout**: Set appropriate timeouts
5. **Handle final failure**: Plan for when all retries fail

## Example

```typescript
const httpNode = new HttpRequestNode({
  id: "http-1",
  name: "api-call",
  nodeType: "http-request",
  version: 1,
  position: [0, 0],
  retryOnFail: true,
  maxRetries: 3,
  retryDelay: {
    baseDelay: 1000,
    maxDelay: 10000,
  },
})
```

## Related Documentation

- [Error Handling](./error-handling.md)
- [Working with Nodes](./working-with-nodes.md)
- [Building Workflows](./building-workflows.md)

