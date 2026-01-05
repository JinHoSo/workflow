# Architecture Deep Dive

Detailed explanation of Workflow Engine's architecture and design decisions.

## System Architecture

### Core Components

1. **Workflow**: Manages nodes and connections
2. **BaseNode**: Base class for all nodes
3. **ExecutionEngine**: Executes workflows using DAG
4. **ExecutionStateManager**: Manages execution state
5. **NodeTypeRegistry**: Registers and retrieves node types
6. **PluginRegistry**: Manages plugin registration

### Execution Flow

```
Trigger Activation
    ↓
Dependency Graph Building
    ↓
Topological Sort
    ↓
Level-by-Level Execution
    ↓
State Updates
    ↓
Completion
```

## Design Patterns

### Unified Node Model

All nodes, including triggers, are treated uniformly:

```typescript
interface NodeProperties {
  isTrigger?: boolean // Distinguishes triggers
}
```

### Protocol-Based Design

Consistent behavior through protocols:

- **ExecutionProtocol**: How nodes execute
- **DataFlowProtocol**: How data flows
- **ErrorHandlingProtocol**: How errors are handled

### Factory Pattern

Nodes created via factory:

```typescript
const node = nodeFactory.create(serializedNode)
```

## Data Flow Architecture

### Port-Based Flow

Data flows through named ports:

```
Source Node (output port) → Connection → Target Node (input port)
```

### Execution State

Global state accessible to all nodes:

```typescript
context.state["node-name"]["port-name"]
```

## Execution Architecture

### DAG-Based Execution

1. Build dependency graph from connections
2. Topological sort for execution order
3. Execute nodes at same level in parallel
4. Update state after each level

### Parallel Execution

Independent nodes execute simultaneously:

```
Level 1: [Node A, Node B, Node C] → Execute in parallel
Level 2: [Node D] → Wait for Level 1
Level 3: [Node E, Node F] → Execute in parallel
```

## State Management

### Centralized State

Single source of truth for execution state:

- Node outputs
- Execution metadata
- Error information

### State Isolation

Each execution has isolated state:

- No cross-execution state access
- State cleared between executions
- Independent execution contexts

## Plugin Architecture

### Plugin Structure

```
Plugin
├── Manifest (metadata)
└── Node Types (classes)
```

### Registration Flow

```
Plugin Discovery → Validation → Registration → Node Type Registration
```

## Error Handling

### Node-Level Errors

- Captured and stored
- State transition to Failed
- Error propagation to downstream

### Workflow-Level Errors

- Execution stops on critical errors
- Retry mechanisms for transient errors
- State preservation for debugging

## Performance Considerations

### Parallel Execution

- Independent nodes run simultaneously
- Reduces total execution time
- Controlled by execution engine

### State Management

- Efficient state queries
- Centralized state access
- Minimal overhead

## Extension Points

### Custom Nodes

Extend `BaseNode`:

```typescript
class MyNode extends BaseNode {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    // Custom logic
  }
}
```

### Custom Plugins

Create plugin with node types:

```typescript
const plugin: Plugin = {
  manifest: { ... },
  nodeTypes: [MyNode],
}
```

## Related Documentation

- [Architecture](../../ARCHITECTURE.md) - Architecture overview
- [Core Concepts](../getting-started/core-concepts.md) - Core concepts
- [API Reference](../api/README.md) - API documentation

