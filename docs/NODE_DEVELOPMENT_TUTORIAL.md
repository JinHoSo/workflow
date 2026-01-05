# Node Development Tutorial

This tutorial walks you through creating your first workflow node.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Create a Node](#step-1-create-a-node)
- [Step 2: Understand the Generated Code](#step-2-understand-the-generated-code)
- [Step 3: Implement Node Logic](#step-3-implement-node-logic)
- [Step 4: Test the Node](#step-4-test-the-node)
- [Step 5: Validate Protocol Compliance](#step-5-validate-protocol-compliance)
- [Step 6: Use in a Workflow](#step-6-use-in-a-workflow)
- [Advanced: Processing Input Data](#advanced-processing-input-data)
- [Advanced: Error Handling](#advanced-error-handling)
- [Next Steps](#next-steps)

## Prerequisites

- Node.js >= 18.0.0
- Basic TypeScript knowledge
- Workflow Engine CLI installed

## Step 1: Create a Node

```bash
workflow create:node hello-world --template basic
cd hello-world
```

This creates:
- `hello-world.ts` - Node implementation
- `schema.ts` - Configuration schema
- `index.ts` - Exports
- `hello-world.test.ts` - Test file
- `package.json` - Package configuration

## Step 2: Understand the Generated Code

### Node File (`hello-world.ts`)

```typescript
export class HelloWorld extends BaseNode {
  protected configurationSchema = helloWorldSchema

  constructor(properties: NodeProperties) {
    super(properties)
    this.addInput("input", "any")
    this.addOutput("output", "any")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const config = this.config as HelloWorldConfiguration
    const inputData = context.input["input"] || []
    // TODO: Implement your node logic
    return { output: inputData }
  }
}
```

### Schema File (`schema.ts`)

```typescript
export const helloWorldSchema: JsonSchema = {
  type: "object",
  properties: {
    // Add your configuration properties
  },
  additionalProperties: false,
}
```

## Step 3: Implement Node Logic

Let's create a simple node that greets users:

```typescript
export interface HelloWorldConfiguration extends NodeConfiguration {
  greeting?: string
  name?: string
}

export class HelloWorld extends BaseNode {
  protected configurationSchema = helloWorldSchema

  constructor(properties: NodeProperties) {
    super(properties)
    this.addInput("input", "any")
    this.addOutput("output", "any")
  }

  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const config = this.config as HelloWorldConfiguration
    const greeting = config.greeting || "Hello"
    const name = config.name || "World"

    const message = `${greeting}, ${name}!`

    return {
      output: [{ message }],
    }
  }
}
```

Update the schema:

```typescript
export const helloWorldSchema: JsonSchema = {
  type: "object",
  properties: {
    greeting: {
      type: "string",
      description: "Greeting message",
      default: "Hello",
    },
    name: {
      type: "string",
      description: "Name to greet",
      default: "World",
    },
  },
  additionalProperties: false,
}
```

## Step 4: Test the Node

```typescript
import { HelloWorld } from "./hello-world"
import { simulateNodeExecution } from "@workflow/test-utils"

describe("HelloWorld", () => {
  it("should greet correctly", async () => {
    const node = new HelloWorld({
      id: "test-1",
      name: "HelloWorld",
      type: "hello-world",
      version: 1,
    })

    node.setup({
      greeting: "Hi",
      name: "Developer",
    })

    const result = await simulateNodeExecution(node)

    expect(result.state).toBe(NodeState.Completed)
    expect(result.output.output[0].message).toBe("Hi, Developer!")
  })
})
```

Run tests:

```bash
workflow test
```

## Step 5: Validate Protocol Compliance

```bash
workflow validate
```

This checks that your node follows all required protocols.

## Step 6: Use in a Workflow

```typescript
import { Workflow } from "workflow-engine"
import { HelloWorld } from "./hello-world"

const workflow = new Workflow("my-workflow")

const helloNode = new HelloWorld({
  id: "node-1",
  name: "Hello",
  type: "hello-world",
  version: 1,
})

helloNode.setup({
  greeting: "Hello",
  name: "User",
})

workflow.addNode(helloNode)
```

## Advanced: Processing Input Data

Nodes can process data from previous nodes:

```typescript
protected async process(context: ExecutionContext): Promise<NodeOutput> {
  const inputData = context.input["input"] || []
  const config = this.config as HelloWorldConfiguration

  // Process each input item
  const results = inputData.map((item: DataRecord) => {
    const name = item.name || config.name || "World"
    const greeting = config.greeting || "Hello"
    return {
      message: `${greeting}, ${name}!`,
      original: item,
    }
  })

  return { output: results }
}
```

## Advanced: Error Handling

```typescript
protected async process(context: ExecutionContext): Promise<NodeOutput> {
  try {
    const config = this.config as HelloWorldConfiguration

    if (!config.name) {
      throw new Error("Name is required")
    }

    // Process logic
    return { output: [] }
  } catch (error) {
    // Error is automatically handled by BaseNode
    throw error
  }
}
```

## Next Steps

- Create a plugin to package your node
- Add more complex logic
- Integrate with external APIs
- Create trigger nodes
- Build HTTP request nodes

See the [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md) for more information.

