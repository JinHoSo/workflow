## 1. Implementation
- [x] 1.1 Update Workflow.reset() to skip trigger nodes when resetting (preserve trigger state)
- [x] 1.2 Update ExecutionEngine.execute() to reset regular nodes only (trigger nodes preserved)
- [x] 1.3 Update ExecutionEngine to clear executionState at start of each execution
- [x] 1.4 Add workflow state checking in BaseTrigger before execution
- [x] 1.5 Fix BaseTrigger to properly integrate with ExecutionEngine and check workflow state
- [x] 1.6 Fix ScheduleTrigger to check workflow state before execution
- [x] 1.7 Fix ScheduleTrigger to schedule next execution immediately when trigger() is called, before executing workflow
- [x] 1.8 Fix ScheduleTrigger to use ExecutionEngine correctly
- [x] 1.9 Fix ManualTrigger to check workflow state before execution
- [x] 1.10 Fix ManualTrigger to use ExecutionEngine correctly
- [x] 1.11 Ensure BaseNode.reset() properly clears resultData and state for regular nodes

## 2. Testing
- [ ] 2.1 Add test for regular nodes being reset before execution
- [ ] 2.2 Add test for trigger nodes NOT being reset between executions
- [ ] 2.3 Add test for trigger rejection when workflow is running
- [ ] 2.4 Add test for schedule trigger auto-execution when trigger() is called
- [ ] 2.5 Add test for schedule trigger scheduling next execution immediately when trigger() is called
- [ ] 2.6 Add test for multiple schedule trigger executions not interfering
- [ ] 2.7 Add test for multiple manual trigger executions not interfering
- [ ] 2.8 Add test for executionState being cleared between executions
- [ ] 2.9 Add test for regular node outputs being cleared between executions
- [ ] 2.10 Add test for trigger node state being preserved between executions
- [ ] 2.11 Update existing trigger tests to reflect new execution flow

## 3. Validation
- [x] 3.1 Run all existing tests to ensure no regressions
- [x] 3.2 Run typecheck to ensure type safety
- [x] 3.3 Run linter to ensure code quality

