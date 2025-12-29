## Context
Currently, all nodes (both triggers and regular nodes) are stored in a single `nodes` dictionary in the `Workflow` class. To distinguish trigger nodes, code must use runtime checks like:

```typescript
if ("trigger" in node && typeof node.trigger === "function") {
  // It's a trigger node
}
```

This pattern is repeated in multiple places:
- `workflow.reset()` - to skip trigger nodes when resetting
- Potentially in execution logic
- In validation and other workflow operations

The problem is that this distinction is implicit and error-prone. If someone forgets to check, or checks incorrectly, bugs occur.

## Goals / Non-Goals
- **Goals**:
  - Make trigger nodes explicit in the workflow structure
  - Eliminate runtime type checking for trigger nodes
  - Simplify `reset()` and other methods that need to distinguish triggers
  - Improve code clarity and maintainability
  - Prevent bugs from mixing trigger and regular nodes

- **Non-Goals**:
  - Changing trigger node behavior or functionality
  - Changing how triggers execute workflows
  - Adding new trigger capabilities
  - Changing the Node interface or WorkflowTrigger interface

## Decisions

### Decision 1: Separate triggers collection
**What**: Add a separate `triggers: { [nodeName: string]: WorkflowTrigger }` property to `Workflow` class.

**Why**:
- Makes trigger nodes explicit in the data structure
- Eliminates need for runtime type checking
- Clear separation of concerns
- Easy to iterate over triggers separately

**Alternatives considered**:
- Keep single collection with metadata flag - Less explicit, still requires checking
- Use separate class for triggers - Over-engineered for current needs
- Use type guards only - Doesn't solve the root problem

### Decision 2: addTriggerNode() method
**What**: Add `addTriggerNode(trigger: WorkflowTrigger): void` method that only accepts trigger nodes.

**Why**:
- Type-safe way to add triggers
- Compiler enforces correct usage
- Clear intent in code
- Prevents accidentally adding triggers as regular nodes

**Alternatives considered**:
- Overload `addNode()` - Less clear, type system can't enforce separation
- Use factory method - More complex, doesn't add value
- Keep single method with runtime check - Doesn't solve the problem

### Decision 3: addNode() rejects triggers
**What**: `addNode()` will check if the node is a trigger and throw an error if it is.

**Why**:
- Prevents accidental misuse
- Enforces correct API usage
- Makes the distinction explicit at the call site

**Alternatives considered**:
- Allow both but warn - Less strict, can lead to bugs
- Auto-detect and route - Magic behavior, less explicit
- No validation - Allows mistakes

### Decision 4: reset() uses separate collections
**What**: `reset()` will iterate through `triggers` and `nodes` separately, only resetting `nodes`.

**Why**:
- Simpler logic - no need to check type
- Clear intent - triggers are preserved, nodes are reset
- More efficient - no runtime type checking

**Alternatives considered**:
- Keep current logic with type check - More complex, error-prone
- Reset both but restore triggers - Unnecessary complexity

## Risks / Trade-offs
- **Risk**: Breaking change - all code that adds triggers must be updated
  - **Mitigation**: Update all call sites systematically, update tests

- **Risk**: Code that iterates over all nodes needs to check both collections
  - **Mitigation**: Most code only needs one or the other. For code that needs both, iterate both collections explicitly.

- **Risk**: Duplication if code needs to work with both triggers and nodes
  - **Benefit**: Explicit is better than implicit - makes the code clearer
  - **Cost**: Slightly more verbose when iterating both

- **Trade-off**: Two collections vs one with type checking
  - **Benefit**: Explicit separation, type safety, simpler logic
  - **Cost**: Slightly more complex data structure

## Migration Plan
1. Add `triggers` property to `Workflow` class
2. Add `addTriggerNode()` method
3. Update `addNode()` to reject trigger nodes
4. Update `reset()` to use separate collections
5. Update `Workflow` interface
6. Update all code that adds trigger nodes
7. Update all tests
8. Verify all functionality still works

## Open Questions
- Should `removeNode()` also have `removeTriggerNode()`? Or should it check both collections?
- Should `getNode()` check both collections? Or have separate `getTriggerNode()`?
- How should serialization/deserialization handle the separation?

