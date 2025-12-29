# Change: Fix Trigger Execution Reset

## Why
When workflows are re-executed (via schedule-trigger or manual-trigger), previous execution outputs and state values are not being reset. This causes subsequent executions to be affected by data from previous executions, leading to incorrect behavior and data contamination. Additionally, the current trigger implementation incorrectly integrates with the execution engine, requiring manual workflow reset before execution.

**Critical Issues:**
1. **Workflow execution blocking**: When a workflow is running, triggers can still attempt to execute, causing errors. Triggers should only execute when the workflow is in Idle state (completed, failed, timeout, or manually stopped).
2. **Schedule trigger auto-execution**: Schedule triggers should automatically re-execute workflows at configured intervals when `trigger()` is called. The next execution should be scheduled immediately when `trigger()` is called, before executing the workflow. `activateSchedule()` should only configure the schedule, not start automatic execution.

## What Changes
- **BREAKING**: ExecutionEngine.execute() will now automatically reset the workflow before execution
- **BREAKING**: Trigger activation will properly reset workflow state before starting execution
- **BREAKING**: Triggers will check workflow state before execution and reject/queue if workflow is running
- ExecutionEngine will clear executionState at the start of each execution
- Regular nodes (non-trigger nodes) will be reset to Ready state before execution begins
- Trigger nodes will NOT be reset between executions to preserve their state and configuration
- ScheduleTrigger will automatically re-execute workflows at configured intervals when `trigger()` is called
- ScheduleTrigger will schedule the next execution immediately when `trigger()` is called, before executing the workflow
- `activateSchedule()` will only configure the schedule, not start automatic execution
- ManualTrigger will reject execution attempts when workflow is running
- BaseTrigger will provide consistent reset behavior for all trigger types

## Impact
- Affected specs: `workflow-triggers`, `workflow-core`, `workflow-state`
- Affected code:
  - `src/execution/execution-engine.ts` - Add workflow reset at execution start, maintain state tracking
  - `src/triggers/base-trigger.ts` - Add workflow state checking before trigger execution
  - `src/triggers/schedule-trigger.ts` - Fix execution flow, reset behavior, and auto-scheduling when trigger() is called
  - `src/triggers/manual-trigger.ts` - Fix execution flow, reset behavior, and state checking
  - `src/core/workflow.ts` - Ensure reset() properly clears execution state for regular nodes only (exclude trigger nodes)
  - `src/core/base-node.ts` - Ensure reset() properly clears node state

