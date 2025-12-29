# Design: Schedule Trigger

## Context
The Schedule Trigger needs to support flexible time-based scheduling with second-level precision. Unlike standard cron expressions, users require more intuitive scheduling patterns that specify exact times (e.g., "every minute at 11 seconds" rather than "*/1 * * * * *").

## Goals / Non-Goals

### Goals
- Support scheduling at multiple intervals (minute, hour, day, month, year)
- Provide second-level precision for all schedule types
- Validate schedule configurations before activation
- Automatically calculate next execution time
- Handle timezone considerations (use system timezone initially)
- Gracefully handle schedule changes (update active schedules)
- Support schedule deactivation when workflow is stopped

### Non-Goals
- Timezone configuration UI (use system timezone for initial implementation)
- Complex cron expression parsing (use structured configuration instead)
- Schedule persistence across application restarts (in-memory only for initial implementation)
- Multiple schedules per trigger (one schedule per trigger instance)

## Decisions

### Decision: Structured Schedule Configuration
Use a structured configuration object instead of cron expressions for better type safety and clarity.

**Alternatives considered:**
1. **Cron expressions**: More familiar but less type-safe, harder to validate, and doesn't match user's intuitive examples
2. **ISO 8601 duration**: Standard but doesn't support "every month on day X" patterns
3. **Structured object**: Type-safe, clear, matches user examples exactly

**Rationale**: The user's examples show a preference for structured time specifications (e.g., "매분 11초에", "매일 3시 10분 31초에"). A structured configuration aligns with these examples and provides better TypeScript type safety.

### Decision: Interval-Based Schedule Types
Support five distinct schedule types: minute, hour, day, month, year.

**Structure:**
```typescript
type ScheduleConfig =
  | { type: 'minute'; second: number }
  | { type: 'hour'; minute: number; second: number }
  | { type: 'day'; hour: number; minute: number; second: number }
  | { type: 'month'; day: number; hour: number; minute: number; second: number }
  | { type: 'year'; month: number; day: number; hour: number; minute: number; second: number }
```

**Rationale**: Matches user's examples exactly and provides clear, type-safe configuration.

### Decision: In-Memory Scheduling
Use Node.js `setTimeout`/`setInterval` for scheduling, keeping schedules in memory.

**Alternatives considered:**
1. **Database-backed scheduler**: More persistent but adds complexity
2. **External scheduler service**: Overkill for initial implementation
3. **In-memory with setTimeout**: Simple, sufficient for initial implementation

**Rationale**: Start simple. Can migrate to persistent scheduling later if needed.

### Decision: Next Execution Time Calculation
Calculate next execution time when schedule is activated and after each execution.

**Algorithm:**
1. Parse schedule configuration
2. Get current time
3. Calculate next valid execution time based on schedule type
4. Schedule execution using setTimeout
5. After execution, recalculate next time

**Rationale**: Ensures accurate scheduling even if execution is delayed or system time changes.

## Risks / Trade-offs

### Risk: Timezone Handling
**Risk**: System timezone may not match user's expected timezone
**Mitigation**: Document that system timezone is used. Add timezone configuration in future iteration if needed.

### Risk: System Clock Changes
**Risk**: System clock adjustments could cause missed or duplicate executions
**Mitigation**: Recalculate next execution time after each execution. For production, consider using monotonic clocks or external time services.

### Risk: Memory Leaks
**Risk**: Active schedules may not be cleaned up if workflow is removed
**Mitigation**: Ensure proper cleanup in `deactivate()` method. Add lifecycle hooks for workflow removal.

### Risk: Precision Loss
**Risk**: JavaScript timers may not execute at exact millisecond precision
**Mitigation**: Acceptable for second-level precision. Document that execution may vary by a few milliseconds.

## Migration Plan
No migration needed - this is a new feature. Existing ManualTrigger continues to work unchanged.

## Open Questions
- Should we support timezone configuration in the initial implementation? (Deferred to future)
- Should schedules persist across application restarts? (Deferred to future)
- How should we handle daylight saving time transitions? (Use system timezone handling)

