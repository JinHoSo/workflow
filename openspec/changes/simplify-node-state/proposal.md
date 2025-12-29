# Change: Simplify Node State - Remove Ready State

## Why
The current node state system has both `Idle` and `Ready` states, which creates unnecessary complexity and causes issues:

1. **State confusion**: Nodes must transition from `Idle` to `Ready` via `setup()`, but this creates problems when nodes are reset - they may end up in `Idle` state even though they have valid configuration, preventing execution.

2. **Reset complexity**: After `workflow.reset()`, nodes need to be in `Ready` state to execute, but determining whether a node should be `Idle` or `Ready` based on configuration is error-prone and causes test failures.

3. **Unnecessary state**: The distinction between `Idle` (not configured) and `Ready` (configured) doesn't add value - nodes can execute if they have valid configuration regardless of whether `setup()` was explicitly called.

4. **Current issues**: The `fix-trigger-execution-reset` change revealed that reset logic is complex because it must decide between `Idle` and `Ready` states, leading to bugs where nodes end up in the wrong state.

## What Changes
- **BREAKING**: Remove `NodeState.Ready` enum value
- **BREAKING**: All nodes will use `NodeState.Idle` as the initial/configured state
- **BREAKING**: `BaseNode.setup()` will no longer transition state from `Idle` to `Ready`
- **BREAKING**: `BaseNode.reset()` will always set state to `Idle` (regardless of configuration)
- **BREAKING**: `BaseNode.run()` will check for `NodeState.Idle` instead of `NodeState.Ready`
- **BREAKING**: State transition validation will be updated to remove `Ready` state
- All code that checks for `NodeState.Ready` will be updated to check for `NodeState.Idle`
- All code that sets state to `NodeState.Ready` will be updated to use `NodeState.Idle`

## Impact
- Affected specs: `workflow-state`, `workflow-nodes`
- Affected code:
  - `src/types/node-status.ts` - Remove Ready from NodeState enum
  - `src/core/base-node.ts` - Remove Ready state transitions, update setup() and reset()
  - `src/triggers/base-trigger.ts` - Update state checks
  - `src/execution/execution-engine.ts` - Update state checks from Ready to Idle
  - All test files that reference `NodeState.Ready` - Update to `NodeState.Idle`

