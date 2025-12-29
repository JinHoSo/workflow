# Change: Add Schedule Trigger

## Why
Users need to execute workflows on a time-based schedule with flexible timing options. The current trigger system only supports manual execution. A Schedule Trigger will enable automated workflow execution at specific times, supporting various intervals from every minute to yearly schedules with precise second-level control.

## What Changes
- **ADDED**: ScheduleTrigger class that extends WorkflowTriggerBase
- **ADDED**: Schedule configuration format supporting multiple interval types (minute, hour, day, month, year)
- **ADDED**: Time-based scheduling engine that calculates next execution time
- **ADDED**: Schedule validation to ensure valid time configurations
- **ADDED**: Automatic schedule activation and deactivation when workflow state changes
- **ADDED**: Support for precise second-level scheduling (e.g., "every minute at 11 seconds", "every day at 3:10:31")

## Impact
- **Affected specs**:
  - `workflow-triggers` (MODIFIED - adding ScheduleTrigger requirement)
- **Affected code**:
  - New `ScheduleTrigger` class in `src/triggers/schedule-trigger.ts`
  - Schedule configuration interfaces in `src/interfaces/`
  - Schedule calculation utilities
  - Trigger registry registration for ScheduleTrigger
  - Integration with workflow execution engine for automatic triggering

