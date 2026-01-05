# Working with Triggers

Learn how to use triggers to start workflow execution in Workflow Engine.

## Table of Contents

- [Trigger Overview](#trigger-overview)
- [Trigger Types](#trigger-types)
  - [ManualTrigger](#manualtrigger)
  - [ScheduleTrigger](#scheduletrigger)
  - [WebhookTrigger](#webhooktrigger)
- [Setting Up Triggers](#setting-up-triggers)
- [Schedule Configuration](#schedule-configuration)
  - [Cron Expressions](#cron-expressions)
  - [Examples](#examples)
- [Trigger Data](#trigger-data)
  - [Passing Initial Data](#passing-initial-data)
  - [Accessing Trigger Data](#accessing-trigger-data)
- [Multiple Triggers](#multiple-triggers)
- [Best Practices](#best-practices)

## Trigger Overview

Triggers are special nodes that initiate workflow execution. They can be activated manually, on a schedule, or by external events.

## Trigger Types

### ManualTrigger

Manually trigger workflow execution programmatically.

```typescript
const trigger = new ManualTrigger({
  id: "trigger-1",
  name: "trigger",
  nodeType: "manual-trigger",
  version: 1,
  position: [0, 0],
})

// Set execution engine
trigger.setExecutionEngine(engine)

// Trigger workflow
trigger.trigger({ output: { value: 5 } })
```

### ScheduleTrigger

Schedule workflow execution at specific times using cron expressions.

```typescript
const trigger = new ScheduleTrigger({
  id: "schedule-1",
  name: "schedule",
  nodeType: "schedule-trigger",
  version: 1,
  position: [0, 0],
})

// Configure schedule
trigger.setup({
  schedule: "0 0 * * *", // Every day at midnight
  timezone: "UTC",
})

// Activate schedule
trigger.setExecutionEngine(engine)
trigger.activate()

// Get next execution time
const nextTime = trigger.getNextExecutionTime()
console.log("Next execution:", nextTime)
```

### WebhookTrigger

Trigger workflows via HTTP requests (if implemented).

```typescript
const trigger = new WebhookTrigger({
  id: "webhook-1",
  name: "webhook",
  nodeType: "webhook-trigger",
  version: 1,
  position: [0, 0],
})

// Configure webhook
trigger.setup({
  path: "/webhook/my-workflow",
  method: "POST",
})
```

## Setting Up Triggers

### Step 1: Create Trigger

```typescript
const trigger = new ManualTrigger({
  id: "trigger-1",
  name: "trigger",
  nodeType: "manual-trigger",
  version: 1,
  position: [0, 0],
})
```

### Step 2: Add to Workflow

```typescript
workflow.addNode(trigger)
```

### Step 3: Set Execution Engine

```typescript
const engine = new ExecutionEngine(workflow)
trigger.setExecutionEngine(engine)
```

### Step 4: Activate Trigger

```typescript
// For manual trigger
trigger.trigger({ output: { data: "value" } })

// For schedule trigger
trigger.activate()
```

## Schedule Configuration

### Cron Expressions

Schedule triggers use cron expressions:

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, 0 or 7 is Sunday)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

### Examples

```typescript
// Every minute
"* * * * *"

// Every hour
"0 * * * *"

// Every day at midnight
"0 0 * * *"

// Every Monday at 9 AM
"0 9 * * 1"

// Every month on the 1st at noon
"0 12 1 * *"
```

## Trigger Data

### Passing Initial Data

Triggers can pass initial data to the workflow:

```typescript
trigger.trigger({
  output: {
    value: 5,
    timestamp: Date.now(),
  },
})
```

### Accessing Trigger Data

Downstream nodes can access trigger data:

```typescript
// In JavaScript node
const triggerData = input()
console.log(triggerData.value) // 5
```

## Multiple Triggers

A workflow can have multiple triggers:

```typescript
const manualTrigger = new ManualTrigger({...})
const scheduleTrigger = new ScheduleTrigger({...})

workflow.addNode(manualTrigger)
workflow.addNode(scheduleTrigger)

// Both triggers can activate the workflow
```

## Best Practices

1. **Use descriptive names**: Name triggers clearly
2. **Handle trigger data**: Validate and process trigger data
3. **Error handling**: Handle errors in trigger activation
4. **Schedule carefully**: Use appropriate schedules for scheduled triggers
5. **Test triggers**: Test trigger activation before deployment

## Related Documentation

- [Building Workflows](./building-workflows.md)
- [Working with Nodes](./working-with-nodes.md)
- [Node Types API](../api/nodes.md)

