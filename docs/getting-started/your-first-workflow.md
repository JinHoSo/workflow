# Your First Workflow

This tutorial walks you through building a complete workflow from scratch. You'll learn how to create nodes, connect them, and execute a workflow.

## Table of Contents

- [What We'll Build](#what-well-build)
- [Step 1: Set Up the Project](#step-1-set-up-the-project)
- [Step 2: Create the Workflow](#step-2-create-the-workflow)
- [Step 3: Create Nodes](#step-3-create-nodes)
- [Step 4: Add Nodes to Workflow](#step-4-add-nodes-to-workflow)
- [Step 5: Connect Nodes](#step-5-connect-nodes)
- [Step 6: Execute the Workflow](#step-6-execute-the-workflow)
- [Complete Example](#complete-example)
- [Understanding the Flow](#understanding-the-flow)
- [Next Steps](#next-steps)
- [Tips](#tips)
- [Common Issues](#common-issues)

## What We'll Build

We'll create a workflow that:
1. Takes a number as input
2. Multiplies it by 2
3. Adds 10 to the result
4. Outputs the final value

## Step 1: Set Up the Project

Create a new TypeScript file (e.g., `my-workflow.ts`):

```typescript
import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { JavaScriptExecutionNode } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"
```

## Step 2: Create the Workflow

```typescript
// Create a new workflow instance
const workflow = new Workflow("my-first-workflow")
```

## Step 3: Create Nodes

### Create a Trigger

```typescript
// nodeType is automatically set from class definition
const trigger = new ManualTrigger({
  id: "trigger-1",
  name: "trigger",
  version: 1,
  position: [0, 0],
})
```

### Create JavaScript Nodes

```typescript
// Node 1: Multiply by 2
// nodeType is automatically set from class definition
// isTrigger defaults to false, so it can be omitted
const multiplyNode = new JavaScriptExecutionNode({
  id: "multiply-1",
  name: "multiply",
  version: 1,
  position: [100, 0],
})

multiplyNode.setup({
  code: `
    const value = input().value || 0;
    return { value: value * 2 };
  `,
})

// Node 2: Add 10
// nodeType is automatically set from class definition
// isTrigger defaults to false, so it can be omitted
const addNode = new JavaScriptExecutionNode({
  id: "add-1",
  name: "add",
  version: 1,
  position: [200, 0],
})

addNode.setup({
  code: `
    const value = input().value || 0;
    return { value: value + 10 };
  `,
})
```

## Step 4: Add Nodes to Workflow

```typescript
workflow.addNode(trigger)
workflow.addNode(multiplyNode)
workflow.addNode(addNode)
```

## Step 5: Connect Nodes

```typescript
// Connect trigger to multiply node
workflow.linkNodes("trigger", "output", "multiply", "input")

// Connect multiply node to add node
workflow.linkNodes("multiply", "output", "add", "input")
```

## Step 6: Execute the Workflow

```typescript
// Create execution engine
const engine = new ExecutionEngine(workflow)
trigger.setExecutionEngine(engine)

// Execute with input value of 5
trigger.trigger({ output: { value: 5 } })

// Wait for execution to complete
await new Promise(resolve => setTimeout(resolve, 200))

// Get the final result
const result = addNode.getResult("output")
console.log("Final result:", result) // { value: 20 }
// Calculation: (5 * 2) + 10 = 20
```

## Complete Example

Here's the complete workflow:

```typescript
import { Workflow } from "@workflow/core"
import { ManualTrigger } from "@workflow/nodes"
import { JavaScriptExecutionNode } from "@workflow/nodes"
import { ExecutionEngine } from "@workflow/execution"

async function runWorkflow() {
  // Create workflow
  const workflow = new Workflow("my-first-workflow")

  // Create trigger
  const trigger = new ManualTrigger({
    id: "trigger-1",
    name: "trigger",
    nodeType: "manual-trigger",
    version: 1,
    position: [0, 0],
  })

  // Create multiply node
  const multiplyNode = new JavaScriptExecutionNode({
    id: "multiply-1",
    name: "multiply",
    nodeType: "javascript",
    version: 1,
    position: [100, 0],
    isTrigger: false,
  })

  multiplyNode.setup({
    code: `
      const value = input().value || 0;
      return { value: value * 2 };
    `,
  })

  // Create add node
  const addNode = new JavaScriptExecutionNode({
    id: "add-1",
    name: "add",
    nodeType: "javascript",
    version: 1,
    position: [200, 0],
    isTrigger: false,
  })

  addNode.setup({
    code: `
      const value = input().value || 0;
      return { value: value + 10 };
    `,
  })

  // Add nodes to workflow
  workflow.addNode(trigger)
  workflow.addNode(multiplyNode)
  workflow.addNode(addNode)

  // Connect nodes
  workflow.linkNodes("trigger", "output", "multiply", "input")
  workflow.linkNodes("multiply", "output", "add", "input")

  // Create execution engine
  const engine = new ExecutionEngine(workflow)
  trigger.setExecutionEngine(engine)

  // Execute workflow
  trigger.trigger({ output: { value: 5 } })

  // Wait for execution
  await new Promise(resolve => setTimeout(resolve, 200))

  // Get results
  const multiplyResult = multiplyNode.getResult("output")
  const finalResult = addNode.getResult("output")

  console.log("Multiply result:", multiplyResult) // { value: 10 }
  console.log("Final result:", finalResult) // { value: 20 }
}

runWorkflow().catch(console.error)
```

## Understanding the Flow

1. **Trigger** receives input: `{ value: 5 }`
2. **Multiply node** processes: `5 * 2 = 10`
3. **Add node** processes: `10 + 10 = 20`
4. **Final output**: `{ value: 20 }`

## Next Steps

Now that you've built your first workflow:

1. **Learn about nodes**: See [Working with Nodes](../guides/working-with-nodes.md)
2. **Understand data flow**: Read [Data Flow](../guides/data-flow.md)
3. **Handle errors**: Check [Error Handling](../guides/error-handling.md)
4. **Explore patterns**: Review [Workflow Patterns](../guides/workflow-patterns.md)
5. **Create custom nodes**: Follow [Node Development Tutorial](../NODE_DEVELOPMENT_TUTORIAL.md)

## Tips

- **Node names** must be unique within a workflow
- **Port names** must match when linking nodes
- **Execution order** is determined by the dependency graph
- **Use async/await** for asynchronous operations

## Common Issues

**Issue**: Nodes not executing
- **Solution**: Make sure nodes are connected correctly and the execution engine is set up

**Issue**: Data not flowing
- **Solution**: Check port names match in `linkNodes()` calls

**Issue**: Results not available
- **Solution**: Wait for execution to complete before accessing results

For more help, see [Troubleshooting](../TROUBLESHOOTING.md).

