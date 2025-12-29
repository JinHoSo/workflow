## Context
The current implementation has four critical issues:
1. **State Contamination**: When workflows are re-executed, previous execution outputs and state persist, causing subsequent executions to be affected by stale data.
2. **Incorrect Trigger Integration**: Triggers manually call `executionEngine.execute()` without resetting the workflow first, and the execution engine expects triggers to already be in Completed state, creating a fragile and incorrect flow.
3. **Workflow Execution Blocking**: Triggers can attempt to execute workflows while they are still running, causing errors. The execution engine correctly rejects these attempts, but triggers should check workflow state before attempting execution.
4. **Schedule Trigger Auto-Execution**: Schedule triggers should automatically re-execute workflows at configured intervals when `trigger()` is called, but only after the current execution completes. Currently, the next execution is scheduled immediately in `activate()`, which can cause issues if the workflow is still running. `activateSchedule()` should only configure the schedule, not start automatic execution.

## Goals / Non-Goals
- **Goals**:
  - Ensure each workflow execution starts with a clean state
  - Automatically reset workflow before execution begins
  - Fix trigger integration to properly reset and execute workflows
  - Prevent triggers from executing workflows while they are running
  - Make schedule triggers automatically re-execute workflows at configured intervals when `trigger()` is called, continuing after each execution completes
  - Maintain backward compatibility where possible (tests may need updates)

- **Non-Goals**:
  - Changing the overall execution architecture
  - Adding new trigger types
  - Changing node execution semantics
  - Adding trigger queuing or retry mechanisms (triggers will simply reject if workflow is running)

## Decisions

### Decision 1: ExecutionEngine.execute() resets regular nodes automatically, but not trigger nodes
**What**: ExecutionEngine.execute() will reset regular nodes (non-trigger nodes) at the start of each execution, but trigger nodes will be preserved. This can be done by calling workflow.reset() which will be updated to skip trigger nodes, or by resetting nodes individually excluding triggers.

**Why**:
- Trigger nodes need to maintain their state and configuration between executions (e.g., schedule configuration, timer state)
- Regular nodes must be reset to prevent state contamination from previous executions
- This ensures clean execution state while preserving trigger functionality

**Alternatives considered**:
- Reset all nodes including triggers - Breaks trigger functionality, requires complex state restoration
- Reset in trigger.activate() - But triggers shouldn't need to know about workflow reset
- Reset in Workflow.execute() - But there's no such method, execution is done via ExecutionEngine
- Manual reset before each execute() call - Error-prone, easy to forget

### Decision 2: ExecutionEngine clears executionState at start
**What**: ExecutionEngine will initialize executionState as empty object at the start of execute().

**Why**: executionState tracks node outputs during execution. It must be cleared to prevent contamination from previous executions.

**Alternatives considered**:
- Reuse executionState and clear selectively - More complex, error-prone
- Make executionState per-execution - Would require refactoring

### Decision 3: Triggers use ExecutionEngine directly
**What**: ScheduleTrigger and ManualTrigger will set ExecutionEngine and call execute() after resetting trigger state.

**Why**: This creates a consistent execution flow where triggers don't need to manually manage workflow state.

**Alternatives considered**:
- Keep callback-based approach - Less consistent, harder to maintain
- Have triggers call workflow.reset() directly - But execution should be managed by ExecutionEngine

### Decision 4: Regular nodes are reset, trigger nodes are preserved
**What**: When resetting the workflow, regular nodes (non-trigger nodes) will have their resultData, error, and state cleared via reset(). Trigger nodes will be skipped during reset to preserve their state, configuration, and execution data.

**Why**:
- Regular node outputs must be cleared between executions to prevent data contamination
- Trigger nodes need to maintain their state (e.g., schedule timers, configuration) between executions
- Trigger nodes already set their resultData in activate() before calling execute(), so they don't need reset

### Decision 5: Triggers check workflow state before execution
**What**: Triggers will check if the workflow is in Idle state before attempting execution. If the workflow is running, the trigger will throw an error or reject the execution attempt.

**Why**: Prevents race conditions and ensures workflows complete before new executions start. The execution engine already has this check, but triggers should validate before calling execute().

**Alternatives considered**:
- Queue trigger requests - More complex, requires queue management
- Wait for workflow completion - Could cause triggers to block indefinitely
- Silent rejection - Less clear error reporting

### Decision 6: Schedule triggers schedule next execution immediately when trigger() is called
**What**: When `trigger()` is called on a ScheduleTrigger, it calls the `activate()` method (inherited from TriggerNodeBase). The ScheduleTrigger's `activate()` implementation will immediately schedule the next execution by calling `scheduleNextExecution()` at the start of `activate()`, before executing the workflow. This applies to all schedule types (interval, minute, hour, day, month, year).

For interval type, this means the next execution will be scheduled at (current time + intervalMs). For absolute time types, the next execution will be calculated from the current time to the next absolute time.

`activateSchedule()` is a ScheduleTrigger-specific method that only configures the schedule and calculates the next execution time, but does not start automatic execution.

**Why**:
- Simple and consistent behavior across all schedule types
- No need to wait for workflow completion - scheduling happens immediately when trigger() is called
- For interval type, ensures fixed intervals from trigger call to trigger call
- For absolute time types, calculates next time from current trigger call time
- Prevents overlapping executions by scheduling before execution starts
- Separates schedule configuration (`activateSchedule()`) from execution activation (`activate()`)
- Follows the base trigger pattern where `trigger()` calls `activate()`, and each trigger type implements `activate()` with its specific behavior

**Alternatives considered**:
- Schedule after completion - More complex, requires tracking execution state
- Schedule based on schedule type - Unnecessary complexity, same result can be achieved by scheduling immediately
- Queue scheduled executions - More complex, requires queue management
- Start automatic execution in activateSchedule() - Less flexible, mixes configuration with execution
- Put scheduling logic in trigger() - Violates separation of concerns, activate() should handle trigger-specific behavior

## Risks / Trade-offs
- **Risk**: Existing tests may break if they rely on state persisting between executions
  - **Mitigation**: Update tests to reflect new behavior, which is the correct behavior

- **Risk**: Performance impact of resetting all nodes before each execution
  - **Mitigation**: Reset is lightweight (just clearing state), performance impact should be negligible

- **Risk**: Breaking change for code that manually manages workflow state
  - **Mitigation**: This is the correct behavior - workflows should start clean. Document the change.

## Migration Plan
1. Update Workflow.reset() to skip trigger nodes when resetting
2. Update ExecutionEngine.execute() to reset regular nodes only (trigger nodes preserved)
3. Update triggers to check workflow state before execution
4. Update ScheduleTrigger to schedule next execution immediately when trigger() is called, before executing the workflow
5. Update triggers to use ExecutionEngine correctly
6. Update tests to reflect new behavior
7. Verify all existing functionality still works

## Open Questions
- None at this time

