# Quick Start

Get up and running with Workflow Engine in 5 minutes!

## Step 1: Create a Workflow

```typescript
import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { JavaScriptExecutionNode } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"

// Create a new workflow
const workflow = new Workflow("my-first-workflow")
```

## Step 2: Add Nodes

```typescript
// Create a manual trigger
const trigger = new ManualTrigger({
  id: "trigger-1",
  name: "trigger",
  nodeType: "manual-trigger",
  version: 1,
  position: [0, 0],
})

// Create a JavaScript execution node
const jsNode = new JavaScriptExecutionNode({
  id: "js-1",
  name: "js-node",
  nodeType: "javascript",
  version: 1,
  position: [100, 0],
  isTrigger: false,
})

// Configure the JavaScript node
jsNode.setup({
  code: `
    const value = input().value || 0;
    return { value: value * 2 };
  `,
})

// Add nodes to workflow
workflow.addNode(trigger)
workflow.addNode(jsNode)
```

## Step 3: Connect Nodes

```typescript
// Link the trigger output to the JavaScript node input
workflow.linkNodes("trigger", "output", "js-node", "input")
```

## Step 4: Execute the Workflow

```typescript
// Create execution engine
const engine = new ExecutionEngine(workflow)
trigger.setExecutionEngine(engine)

// Trigger the workflow with initial data
trigger.trigger({ output: { value: 5 } })

// Wait for execution to complete
await new Promise(resolve => setTimeout(resolve, 100))

// Get the result
const result = jsNode.getResult("output")
console.log(result) // { value: 10 }
```

## Complete Example

Here's the complete example in one file:

```typescript
import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { JavaScriptExecutionNode } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"

async function main() {
  // Create workflow
  const workflow = new Workflow("quick-start-workflow")

  // Create trigger
  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    nodeType: "manual-trigger",
    version: 1,
    position: [0, 0],
  })

  // Create JavaScript node
  const jsNode = new JavaScriptExecutionNode({
    id: "js-1",
    name: "js-node",
    nodeType: "javascript",
    version: 1,
    position: [100, 0],
    isTrigger: false,
  })

  // Configure JavaScript node
  jsNode.setup({
    code: `
      const value = input().value || 0;
      return { value: value * 2 };
    `,
  })

  // Add nodes to workflow
  workflow.addNode(trigger)
  workflow.addNode(jsNode)

  // Link nodes
  workflow.linkNodes("trigger", "output", "js-node", "input")

  // Create execution engine
  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  // Execute workflow
  trigger.trigger({ output: { value: 5 } })

  // Wait for execution
  await new Promise(resolve => setTimeout(resolve, 100))

  // Get result
  const result = jsNode.getResult("output")
  console.log("Result:", result) // { value: 10 }
}

main().catch(console.error)
```

## What's Next?

Now that you've created your first workflow:

1. **Learn more**: Read [Your First Workflow](./your-first-workflow.md) for a more detailed tutorial
2. **Understand concepts**: Check out [Core Concepts](./core-concepts.md)
3. **Explore examples**: See [Examples](../../examples/) for more use cases
4. **Build workflows**: Learn about [Building Workflows](../guides/building-workflows.md)

## Common Next Steps

- **Add more nodes**: Learn about [Working with Nodes](../guides/working-with-nodes.md)
- **Use triggers**: See [Working with Triggers](../guides/working-with-triggers.md)
- **Handle errors**: Read [Error Handling](../guides/error-handling.md)
- **Create custom nodes**: Follow [Node Development Tutorial](../NODE_DEVELOPMENT_TUTORIAL.md)

