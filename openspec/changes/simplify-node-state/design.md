## Context
The current node state system has five states: `Idle`, `Ready`, `Running`, `Completed`, and `Failed`. The distinction between `Idle` (not configured) and `Ready` (configured) creates unnecessary complexity:

1. Nodes must be in `Ready` state to execute, but after `reset()`, nodes may end up in `Idle` state even with valid configuration
2. The `setup()` method transitions from `Idle` to `Ready`, but this is not necessary - nodes can execute if they have valid configuration
3. Reset logic must determine whether to set state to `Idle` or `Ready` based on configuration, which is error-prone

The `fix-trigger-execution-reset` change revealed that the `Idle`/`Ready` distinction is causing bugs where nodes end up in the wrong state after reset, preventing workflow execution.

## Goals / Non-Goals
- **Goals**:
  - Simplify node state system by removing `Ready` state
  - Use `Idle` as the single initial/configured state
  - Remove state transition from `setup()` method
  - Simplify `reset()` to always set state to `Idle`
  - Ensure nodes can execute from `Idle` state if they have valid configuration
  - Fix current bugs related to node state after reset

- **Non-Goals**:
  - Changing other node states (Running, Completed, Failed)
  - Changing workflow state system
  - Changing node execution semantics
  - Adding new state management features

## Decisions

### Decision 1: Remove Ready state entirely
**What**: Remove `NodeState.Ready` from the enum. All nodes will use `Idle` as both the initial state and the configured state.

**Why**:
- Eliminates confusion about when to use `Idle` vs `Ready`
- Simplifies reset logic - always reset to `Idle`
- Nodes can execute from `Idle` state if they have valid configuration
- Reduces state transition complexity

**Alternatives considered**:
- Keep both states but fix reset logic - More complex, doesn't solve root cause
- Add more states - Increases complexity
- Use Ready only, remove Idle - Less intuitive naming

### Decision 2: setup() does not change state
**What**: `BaseNode.setup()` will no longer transition state. It will only update configuration.

**Why**:
- State should not depend on whether `setup()` was called
- Nodes can have configuration without explicit `setup()` call
- Execution should depend on configuration validity, not state

**Alternatives considered**:
- Keep state transition in setup() - Maintains current complexity
- Add separate "configured" flag - Adds another dimension to track

### Decision 3: reset() always sets state to Idle
**What**: `BaseNode.reset()` will always set state to `Idle`, regardless of configuration.

**Why**:
- Simple and consistent behavior
- Configuration is preserved, so node can still execute if config is valid
- No need to determine if node should be `Idle` or `Ready`

**Alternatives considered**:
- Reset to Ready if configured - Requires checking config, error-prone
- Reset based on config validity - More complex, same issues

### Decision 4: run() checks for Idle state
**What**: `BaseNode.run()` will check if state is `Idle` instead of `Ready`.

**Why**:
- Consistent with new state model
- Nodes in `Idle` state can execute if they have valid configuration

**Alternatives considered**:
- Check for both Idle and Ready - Unnecessary after removing Ready
- Add separate "can execute" check - More complex

## Risks / Trade-offs
- **Risk**: Breaking change for all code that checks for `NodeState.Ready`
  - **Mitigation**: Update all references systematically, update tests

- **Risk**: State transition validation needs update
  - **Mitigation**: Update transition rules to remove Ready state

- **Risk**: Tests may fail due to state expectations
  - **Mitigation**: Update all tests to use `Idle` instead of `Ready`

- **Trade-off**: Less granular state information
  - **Benefit**: Simpler, less error-prone
  - **Cost**: Can't distinguish "not configured" from "configured" via state alone (but can check config)

## Migration Plan
1. Update `NodeState` enum to remove `Ready`
2. Update state transition validation to remove `Ready` transitions
3. Update `BaseNode.setup()` to not change state
4. Update `BaseNode.reset()` to always set `Idle`
5. Update `BaseNode.run()` to check for `Idle` instead of `Ready`
6. Update all code references from `Ready` to `Idle`
7. Update all tests
8. Verify all functionality still works

## Open Questions
- None at this time

