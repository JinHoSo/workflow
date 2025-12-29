## MODIFIED Requirements

### Requirement: Manual Trigger
The system SHALL provide a ManualTriggerNode that allows workflows to be executed manually via a programmatic function call.

#### Scenario: Create manual trigger node
- **WHEN** a ManualTriggerNode is created
- **THEN** it SHALL extend BaseNode
- **AND** it SHALL have an output port for initial data
- **AND** it SHALL be in Inactive state
- **AND** it SHALL provide a public trigger() method

#### Scenario: Manual execution via function call
- **WHEN** the trigger() method is called on a ManualTriggerNode
- **THEN** it SHALL call the ManualTrigger's activate() method with execution data
- **AND** the activate() method SHALL check if the workflow is in Idle state
- **AND** if the workflow is running, the activate() method SHALL throw an error or reject the execution
- **AND** if the workflow is in Idle state, it SHALL reset the workflow to clean state
- **AND** it SHALL immediately start the workflow execution
- **AND** it SHALL provide any configured or passed data through output ports
- **AND** the trigger node SHALL transition to Completed state

#### Scenario: Manual trigger with initial data
- **WHEN** trigger() is called with data parameter
- **THEN** the provided data SHALL be sent through the output port
- **AND** the workflow SHALL receive the data as input

#### Scenario: Manual trigger configuration
- **WHEN** a ManualTriggerNode is configured
- **THEN** it SHALL accept optional initial data parameters
- **AND** the configuration SHALL be stored
- **AND** if initial data is configured, it SHALL be used when trigger() is called without parameters

#### Scenario: Manual trigger without configuration
- **WHEN** trigger() is called on a ManualTriggerNode without configuration
- **THEN** the workflow SHALL still execute
- **AND** output port SHALL contain empty or default data
- **AND** the trigger SHALL function correctly

#### Scenario: Multiple manual executions
- **WHEN** trigger() is called multiple times on a ManualTriggerNode
- **THEN** each call SHALL start a new workflow execution with a clean state
- **AND** previous execution outputs and state SHALL be cleared before each execution
- **AND** previous executions SHALL NOT interfere with new executions
- **AND** the node SHALL handle concurrent or sequential executions appropriately

### Requirement: Scheduled Trigger
The system SHALL provide a ScheduledTrigger that executes workflows on a schedule (cron-like).

#### Scenario: Schedule configuration
- **WHEN** a ScheduledTrigger is configured
- **THEN** it SHALL accept a schedule expression (cron-like format)
- **AND** the schedule SHALL be validated

#### Scenario: Scheduled execution via activate()
- **WHEN** trigger() is called on a ScheduledTrigger (either manually or by scheduled timer)
- **THEN** it SHALL call the ScheduledTrigger's activate() method
- **AND** the activate() method SHALL immediately schedule the next execution by calling scheduleNextExecution() at the start, before executing the workflow
- **AND** the activate() method SHALL check if the workflow is in Idle state
- **AND** if the workflow is running, the activate() method SHALL NOT execute and SHALL wait for the workflow to complete
- **AND** if the workflow is in Idle state, the activate() method SHALL reset the workflow to clean state before execution
- **AND** it SHALL start the workflow execution
- **AND** for interval type, the next execution SHALL be scheduled at (current time + intervalMs)
- **AND** for absolute time types (minute, hour, day, month, year), the next execution SHALL be calculated from the current time to the next absolute time

#### Scenario: Schedule modification
- **WHEN** a ScheduledTrigger's schedule is modified
- **THEN** the new schedule SHALL replace the old schedule
- **AND** the trigger SHALL use the new schedule for future executions
- **AND** if the trigger is active, it SHALL reschedule the next execution using the new schedule

#### Scenario: Schedule trigger schedule configuration
- **WHEN** activateSchedule() is called on a ScheduledTrigger with a valid schedule configuration
- **THEN** the ScheduledTrigger SHALL validate and store the schedule configuration
- **AND** the ScheduledTrigger SHALL calculate the next execution time based on the schedule
- **AND** the ScheduledTrigger SHALL NOT start automatic execution or schedule any timers
- **AND** the schedule configuration SHALL be ready for use when trigger() is called
- **NOTE**: activateSchedule() is a ScheduleTrigger-specific method, not part of the base TriggerNodeBase interface

#### Scenario: Schedule trigger execution with auto-repeat
- **WHEN** trigger() is called on a ScheduledTrigger with a valid schedule configuration
- **THEN** it SHALL call the ScheduledTrigger's activate() method
- **AND** the activate() method SHALL immediately schedule the next execution before executing the workflow
- **AND** the activate() method SHALL execute the workflow (as described in "Scheduled execution via activate()")
- **AND** the ScheduledTrigger SHALL continue automatically executing at the configured intervals or times (via timer calling trigger() again) until deactivate() is called

#### Scenario: Multiple scheduled executions
- **WHEN** a ScheduledTrigger executes multiple times via trigger() calls
- **THEN** each execution SHALL start with a clean workflow state
- **AND** previous execution outputs and state SHALL be cleared before each execution
- **AND** previous executions SHALL NOT interfere with new executions
- **AND** the ScheduledTrigger's activate() method SHALL automatically schedule the next execution immediately when trigger() is called, before executing the workflow
- **AND** the ScheduledTrigger SHALL NOT schedule a new execution while the workflow is still running
- **AND** each scheduled timer SHALL call trigger() which in turn calls activate()

### Requirement: Trigger Base Class
The system SHALL provide a base Trigger class that extends Node and serves as the foundation for all trigger types.

#### Scenario: Trigger as node
- **WHEN** a Trigger is created
- **THEN** it SHALL be a valid Node instance
- **AND** it SHALL have all node capabilities (ports, status, actions)
- **AND** it SHALL have a trigger-specific execution method

#### Scenario: Trigger execution flow
- **WHEN** trigger() is called on a trigger
- **THEN** it SHALL call the trigger's activate() method with execution data
- **AND** the activate() method SHALL check if the workflow is in Idle state before execution
- **AND** if the workflow is running, the activate() method SHALL NOT execute and SHALL reject the execution attempt
- **AND** if the workflow is in Idle state, it SHALL reset the workflow to clean state before execution
- **AND** it SHALL initiate workflow execution
- **AND** it SHALL provide initial data to the workflow through its output ports

