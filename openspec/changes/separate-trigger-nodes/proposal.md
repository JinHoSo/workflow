# Change: Separate Trigger Nodes from Regular Nodes

## Why
Currently, trigger nodes and regular nodes are added to workflows using the same method (`workflow.addNode()`), which causes issues:

1. **Ambiguity**: It's not clear from the code which nodes are triggers and which are regular nodes
2. **Complex detection logic**: Code must use runtime checks like `"trigger" in node && typeof node.trigger === "function"` to identify trigger nodes
3. **Error-prone**: The distinction between trigger and regular nodes is implicit, leading to bugs in `reset()`, execution logic, and other places
4. **Maintenance burden**: Every place that needs to distinguish triggers must implement the same detection logic

By separating trigger nodes with a dedicated `addTriggerNode()` method, we make the distinction explicit and eliminate the need for runtime type checking.

## What Changes
- **BREAKING**: Add `addTriggerNode(trigger: WorkflowTrigger): void` method to `Workflow` class
- **BREAKING**: Add `triggers: { [nodeName: string]: WorkflowTrigger }` property to `Workflow` class
- **BREAKING**: `addNode()` will reject trigger nodes (throw error if trigger is passed)
- **BREAKING**: `reset()` will iterate through `triggers` and `nodes` separately
- **BREAKING**: All code that adds trigger nodes must use `addTriggerNode()` instead of `addNode()`
- Update `Workflow` interface to include `addTriggerNode()` method and `triggers` property
- Update all tests to use `addTriggerNode()` for trigger nodes

## Impact
- Affected specs: `workflow-core`, `workflow-triggers`
- Affected code:
  - `src/core/workflow.ts` - Add `addTriggerNode()` method, separate `triggers` property
  - `src/interfaces/workflow.ts` - Update interface to include `addTriggerNode()` and `triggers`
  - `src/core/workflow.ts` - Update `reset()` to use separate `triggers` collection
  - All test files that add trigger nodes - Update to use `addTriggerNode()`
  - All code that iterates through nodes - May need to check both `nodes` and `triggers` if needed

