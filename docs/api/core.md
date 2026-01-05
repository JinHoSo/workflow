# Core API Reference

API documentation for core Workflow Engine classes and functionality.

## Table of Contents

- [Workflow](#workflow)
  - [Constructor](#constructor)
  - [Methods](#methods)
  - [Properties](#properties)
- [BaseNode](#basenode)
  - [Constructor](#constructor-1)
  - [Methods](#methods-1)
  - [Properties](#properties-1)
  - [Abstract Methods](#abstract-methods)
- [NodeTypeRegistry](#nodetyperegistry)
- [NodeFactory](#nodefactory)

## Workflow

The main class for creating and managing workflows.

### Constructor

```typescript
new Workflow(id: string)
```

Creates a new workflow with the given ID.

**Parameters:**
- `id: string` - Unique workflow identifier

**Example:**
```typescript
const workflow = new Workflow("my-workflow")
```

### Methods

#### `addNode(node: Node): void`

Adds a node to the workflow. Nodes are identified by their `name` property.

**Parameters:**
- `node: Node` - The node to add

**Example:**
```typescript
const trigger = new ManualTrigger({...})
workflow.addNode(trigger)
```

#### `removeNode(nodeName: string): void`

Removes a node from the workflow and all its connections.

**Parameters:**
- `nodeName: string` - Name of the node to remove

**Example:**
```typescript
workflow.removeNode("my-node")
```

#### `linkNodes(sourceNode: string, sourcePort: string, targetNode: string, targetPort: string): void`

Creates a connection between two nodes. Validates port types match.

**Parameters:**
- `sourceNode: string` - Name of the source node
- `sourcePort: string` - Name of the source output port
- `targetNode: string` - Name of the target node
- `targetPort: string` - Name of the target input port

**Example:**
```typescript
workflow.linkNodes("trigger", "output", "js-node", "input")
```

#### `reset(): void`

Resets all nodes in the workflow to Idle state and clears their outputs.

**Example:**
```typescript
workflow.reset()
```

#### `export(): string`

Exports the workflow as JSON string.

**Returns:** `string` - JSON representation of the workflow

**Example:**
```typescript
const json = workflow.export()
```

#### `static import(json: string, nodeFactory?: NodeFactory, nodeTypeRegistry?: NodeTypeRegistry): Workflow`

Imports a workflow from JSON string.

**Parameters:**
- `json: string` - JSON representation of the workflow
- `nodeFactory?: NodeFactory` - Optional node factory for creating nodes
- `nodeTypeRegistry?: NodeTypeRegistry` - Optional node type registry

**Returns:** `Workflow` - Imported workflow instance

**Example:**
```typescript
const workflow = Workflow.import(jsonString)
```

### Properties

- `id: string` - Workflow identifier
- `nodes: { [nodeName: string]: Node }` - All nodes in the workflow
- `linksBySource: WorkflowLinks` - Links indexed by source node
- `linksByTarget: WorkflowLinks` - Links indexed by target node
- `state: WorkflowState` - Current workflow state

## BaseNode

Abstract base class for all nodes.

### Constructor

```typescript
constructor(properties: NodeProperties)
```

Creates a new node with the given properties.

**Parameters:**
- `properties: NodeProperties` - Node properties

**Example:**
```typescript
class MyNode extends BaseNode {
  constructor(properties: NodeProperties) {
    super(properties)
  }
}
```

### Methods

#### `setup(config: NodeConfiguration): void`

Configures the node with the given configuration. Validates against schema if defined.

**Parameters:**
- `config: NodeConfiguration` - Node configuration

**Example:**
```typescript
node.setup({
  myConfig: "value",
})
```

#### `async run(context: ExecutionContext): Promise<NodeOutput>`

Executes the node. This method calls `process()` internally.

**Parameters:**
- `context: ExecutionContext` - Execution context

**Returns:** `Promise<NodeOutput>` - Node output

**Example:**
```typescript
const output = await node.run(context)
```

#### `reset(): void`

Resets the node to Idle state and clears outputs.

**Example:**
```typescript
node.reset()
```

#### `addInput(name: string, dataType: string, linkType?: LinkType): void`

Adds an input port to the node.

**Parameters:**
- `name: string` - Port name
- `dataType: string` - Data type
- `linkType?: LinkType` - Optional link type

**Example:**
```typescript
node.addInput("input", "any")
```

#### `addOutput(name: string, dataType: string, linkType?: LinkType): void`

Adds an output port to the node.

**Parameters:**
- `name: string` - Port name
- `dataType: string` - Data type
- `linkType?: LinkType` - Optional link type

**Example:**
```typescript
node.addOutput("output", "any")
```

#### `getResult(outputPortName: string): DataRecord | DataRecord[]`

Gets result data for a specific output port.

**Parameters:**
- `outputPortName: string` - Output port name

**Returns:** `DataRecord | DataRecord[]` - Result data

**Example:**
```typescript
const result = node.getResult("output")
```

#### `getAllResults(): NodeOutput`

Gets all result data from all output ports.

**Returns:** `NodeOutput` - All output data

**Example:**
```typescript
const results = node.getAllResults()
```

### Properties

- `properties: NodeProperties` - Node properties
- `state: NodeState` - Current node state
- `config: NodeConfiguration` - Node configuration
- `inputs: InputPort[]` - Input ports
- `outputs: OutputPort[]` - Output ports
- `error?: Error` - Error if node failed

### Abstract Methods

#### `protected async process(context: ExecutionContext): Promise<NodeOutput>`

Process method that must be implemented by subclasses.

**Parameters:**
- `context: ExecutionContext` - Execution context

**Returns:** `Promise<NodeOutput>` - Node output

**Example:**
```typescript
protected async process(context: ExecutionContext): Promise<NodeOutput> {
  const input = context.input["input"] || []
  return { output: input }
}
```

## NodeTypeRegistry

Registry for managing node types.

### Methods

#### `register(nodeType: string, version: number, nodeClass: typeof BaseNode): void`

Registers a node type.

**Parameters:**
- `nodeType: string` - Node type name
- `version: number` - Node type version
- `nodeClass: typeof BaseNode` - Node class

**Example:**
```typescript
registry.register("my-node", 1, MyNode)
```

#### `get(nodeType: string, version?: number): typeof BaseNode | undefined`

Gets a registered node type.

**Parameters:**
- `nodeType: string` - Node type name
- `version?: number` - Optional version (defaults to latest)

**Returns:** `typeof BaseNode | undefined` - Node class or undefined

**Example:**
```typescript
const NodeClass = registry.get("my-node", 1)
```

## NodeFactory

Factory for creating node instances from serialized data.

### Methods

#### `register(nodeType: string, version: number, factory: NodeFactoryFunction): void`

Registers a factory function for a node type.

**Parameters:**
- `nodeType: string` - Node type name
- `version: number` - Node type version
- `factory: NodeFactoryFunction` - Factory function

**Example:**
```typescript
factory.register("my-node", 1, (data) => new MyNode(data))
```

#### `create(serializedNode: SerializedNode): Node`

Creates a node instance from serialized node data.

**Parameters:**
- `serializedNode: SerializedNode` - Serialized node data

**Returns:** `Node` - Node instance

**Example:**
```typescript
const node = factory.create(serializedData)
```

## Related Documentation

- [Execution API](./execution.md) - Execution engine APIs
- [Node Types API](./nodes.md) - Built-in node types
- [Type Definitions](./types.md) - TypeScript types

