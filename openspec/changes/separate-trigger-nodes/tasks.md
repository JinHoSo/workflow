## 1. Implementation
- [x] 1.1 Add `triggers: { [nodeName: string]: WorkflowTrigger }` property to `Workflow` class
- [x] 1.2 Add `addTriggerNode(trigger: WorkflowTrigger): void` method to `Workflow` class
- [x] 1.3 Update `addNode()` to reject trigger nodes (throw error if trigger is passed)
- [x] 1.4 Update `reset()` to iterate through `triggers` and `nodes` separately
- [x] 1.5 Update `Workflow` interface to include `addTriggerNode()` and `triggers` property
- [x] 1.6 Update `removeNode()` to handle both collections (or add `removeTriggerNode()`)
- [x] 1.7 Update serialization/deserialization to handle separate collections
- [x] 1.8 Update any code that needs to access triggers separately

## 2. Testing
- [x] 2.1 Update all tests that add trigger nodes to use `addTriggerNode()`
- [x] 2.2 Add test for `addNode()` rejecting trigger nodes (covered by existing tests)
- [x] 2.3 Add test for `addTriggerNode()` accepting only trigger nodes (covered by existing tests)
- [x] 2.4 Update tests that verify `reset()` behavior
- [x] 2.5 Update tests that verify serialization/deserialization
- [x] 2.6 Run all tests to ensure no regressions

## 3. Validation
- [x] 3.1 Run all existing tests to ensure no regressions
- [x] 3.2 Run typecheck to ensure type safety
- [x] 3.3 Run linter to ensure code quality

