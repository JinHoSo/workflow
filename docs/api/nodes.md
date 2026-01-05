# Node Types API Reference

API documentation for built-in node types.

## Table of Contents

- [ManualTrigger](#manualtrigger)
  - [Constructor](#constructor)
  - [Methods](#methods)
- [ScheduleTrigger](#scheduletrigger)
  - [Constructor](#constructor-1)
  - [Configuration](#configuration)
  - [Methods](#methods-1)
- [JavaScriptExecutionNode](#javascriptexecutionnode)
  - [Constructor](#constructor-2)
  - [Configuration](#configuration-1)
  - [JavaScript API](#javascript-api)
- [HttpRequestNode](#httprequestnode)
  - [Constructor](#constructor-3)
  - [Configuration](#configuration-2)
  - [Output Ports](#output-ports)

## ManualTrigger

Manually trigger workflow execution.

### Constructor

```typescript
new ManualTrigger(properties: NodeProperties)
```

**Example:**
```typescript
// nodeType is automatically set from class definition
const trigger = new ManualTrigger({
  id: "trigger-1",
  name: "trigger",
  version: 1,
  position: [0, 0],
})
```

### Methods

#### `trigger(data?: NodeOutput): void`

Triggers the workflow execution with optional initial data.

**Parameters:**
- `data?: NodeOutput` - Optional initial data

**Example:**
```typescript
trigger.trigger({ output: { value: 5 } })
```

#### `setExecutionEngine(engine: ExecutionEngine): void`

Sets the execution engine for workflow execution.

**Parameters:**
- `engine: ExecutionEngine` - Execution engine instance

**Example:**
```typescript
trigger.setExecutionEngine(engine)
```

## ScheduleTrigger

Schedule workflow execution at specific times.

### Constructor

```typescript
new ScheduleTrigger(properties: NodeProperties)
```

**Example:**
```typescript
// nodeType is automatically set from class definition
const trigger = new ScheduleTrigger({
  id: "schedule-1",
  name: "schedule",
  version: 1,
  position: [0, 0],
})
```

### Configuration

```typescript
trigger.setup({
  schedule: "0 0 * * *", // Cron expression
  timezone: "UTC",
})
```

### Methods

#### `activate(): void`

Activates the schedule trigger.

**Example:**
```typescript
trigger.activate()
```

#### `deactivate(): void`

Deactivates the schedule trigger.

**Example:**
```typescript
trigger.deactivate()
```

#### `getNextExecutionTime(): Date | undefined`

Gets the next scheduled execution time.

**Returns:** `Date | undefined` - Next execution time or undefined

**Example:**
```typescript
const nextTime = trigger.getNextExecutionTime()
```

#### `setExecutionEngine(engine: ExecutionEngine): void`

Sets the execution engine for workflow execution.

**Parameters:**
- `engine: ExecutionEngine` - Execution engine instance

**Example:**
```typescript
trigger.setExecutionEngine(engine)
```

## JavaScriptExecutionNode

Executes JavaScript code.

### Constructor

```typescript
new JavaScriptExecutionNode(properties: NodeProperties)
```

**Example:**
```typescript
// nodeType is automatically set from class definition
// isTrigger defaults to false, so it can be omitted
const node = new JavaScriptExecutionNode({
  id: "js-1",
  name: "js-node",
  version: 1,
  position: [100, 0],
})
```

### Configuration

```typescript
node.setup({
  code: `
    const value = input().value || 0;
    return { value: value * 2 };
  `,
})
```

### JavaScript API

The following functions are available in JavaScript code:

#### `input(portName?: string): DataRecord | DataRecord[]`

Get input data.

**Parameters:**
- `portName?: string` - Optional port name (defaults to "input")

**Returns:** `DataRecord | DataRecord[]` - Input data

**Example:**
```typescript
const data = input()
const portData = input("port-name")
```

#### `inputAll(): NodeInput`

Get all input data.

**Returns:** `NodeInput` - All input data

**Example:**
```typescript
const allInputs = inputAll()
```

#### `output(data: DataRecord | DataRecord[], portName?: string): void`

Set output data.

**Parameters:**
- `data: DataRecord | DataRecord[]` - Output data
- `portName?: string` - Optional port name (defaults to "output")

**Example:**
```typescript
output({ value: 10 })
output([{ value: 10 }], "output-port")
```

#### `state(nodeName: string, portName: string): DataRecord | DataRecord[] | undefined`

Access execution state.

**Parameters:**
- `nodeName: string` - Name of the node
- `portName: string` - Name of the port

**Returns:** `DataRecord | DataRecord[] | undefined` - State data or undefined

**Example:**
```typescript
const previousOutput = state("previous-node", "output")
```

## HttpRequestNode

Makes HTTP requests.

### Constructor

```typescript
new HttpRequestNode(properties: NodeProperties)
```

**Example:**
```typescript
const node = new HttpRequestNode({
  id: "http-1",
  name: "http-node",
  nodeType: "http-request",
  version: 1,
  position: [100, 0],
  isTrigger: false,
})
```

### Configuration

```typescript
interface HttpRequestConfiguration {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
  url: string // Must be valid URI
  headers?: { [key: string]: string }
  queryParameters?: { [key: string]: string }
  body?: unknown
  bodyFormat?: "json" | "form-data" | "text" | "raw"
  authType?: "none" | "basic" | "bearer" | "custom"
  basicAuthUsername?: string
  basicAuthPassword?: string
  bearerToken?: string
  customAuthHeaders?: { [key: string]: string }
  timeout?: number
}
```

**Example:**
```typescript
node.setup({
  method: "GET",
  url: "https://api.example.com/data",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
})
```

### Output Ports

- `output`: Successful response data
- `error`: Error information (if request fails)

## Related Documentation

- [Core API](./core.md) - Core workflow APIs
- [Execution API](./execution.md) - Execution engine APIs
- [Working with Nodes](../guides/working-with-nodes.md) - Node usage guide

