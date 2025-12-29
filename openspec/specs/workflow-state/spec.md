# workflow-state Specification

## Purpose
TBD - created by archiving change add-workflow-engine. Update Purpose after archive.
## Requirements
### Requirement: Node Status Enum
The system SHALL define a NodeStatus enum with the following states: Inactive, Configured, Executed, Error.

#### Scenario: Status values
- **WHEN** node status is queried
- **THEN** it SHALL return one of: Inactive, Configured, Executed, or Error
- **AND** the status SHALL be type-safe (no string literals)

### Requirement: Status Transitions
The system SHALL enforce valid state transitions for nodes.

#### Scenario: Valid transitions
- **WHEN** a node transitions between states
- **THEN** only valid transitions SHALL be allowed:
  - Inactive → Configured (via Configure action)
  - Configured → Executed (via Execute action, success)
  - Configured → Error (via Execute action, failure)
  - Executed → Configured (via Reset action)
  - Error → Configured (via Reset action)
  - Any → Inactive (via Reset action)

#### Scenario: Invalid transitions
- **WHEN** an invalid state transition is attempted
- **THEN** the transition SHALL be rejected
- **AND** the node SHALL remain in its current state
- **AND** an error SHALL be reported

### Requirement: Status Observability
The system SHALL provide mechanisms to observe node status changes.

#### Scenario: Status query
- **WHEN** a node's status is queried
- **THEN** the current status SHALL be returned immediately
- **AND** the status SHALL be accurate and up-to-date

#### Scenario: Status change notification
- **WHEN** a node's status changes
- **THEN** the system SHALL provide a mechanism to notify observers (callback/event)
- **AND** observers SHALL receive the new status and previous status

### Requirement: Workflow Execution State
The system SHALL track the overall execution state of a workflow.

#### Scenario: Workflow state values
- **WHEN** workflow execution state is queried
- **THEN** it SHALL return one of: idle, running, completed, error
- **AND** the state SHALL reflect the current execution status

#### Scenario: Workflow state transitions
- **WHEN** a workflow starts execution
- **THEN** the state SHALL transition from idle to running

#### Scenario: Workflow completion
- **WHEN** all nodes in a workflow complete successfully
- **THEN** the workflow state SHALL transition to completed

#### Scenario: Workflow error
- **WHEN** any node in a workflow enters Error state during execution
- **THEN** the workflow state SHALL transition to error
- **AND** execution SHALL stop

### Requirement: State Persistence Interface
The system SHALL provide interfaces for state persistence (implementation deferred).

#### Scenario: State serialization
- **WHEN** workflow state needs to be serialized
- **THEN** the system SHALL provide a serialization interface
- **AND** all node states and workflow state SHALL be serializable

#### Scenario: State deserialization
- **WHEN** workflow state is deserialized
- **THEN** the system SHALL restore node states and workflow state
- **AND** the restored state SHALL be valid and consistent

**Note**: Actual persistence implementation is deferred to a later phase. This requirement establishes the interface contract only.

### Requirement: Execution State Isolation
The system SHALL ensure that execution state is isolated between workflow executions.

#### Scenario: Execution state cleared between executions
- **WHEN** a workflow execution begins
- **THEN** all execution state from previous executions SHALL be cleared
- **AND** the execution engine SHALL initialize with empty execution state
- **AND** no node outputs from previous executions SHALL persist

#### Scenario: Node outputs cleared between executions
- **WHEN** a workflow execution begins
- **THEN** all regular node (non-trigger node) outputs from previous executions SHALL be cleared
- **AND** all regular nodes SHALL have their resultData reset
- **AND** regular nodes SHALL be reset to Ready state before execution
- **AND** trigger nodes SHALL preserve their resultData and state between executions

#### Scenario: Multiple executions independence
- **WHEN** a workflow is executed multiple times
- **THEN** each execution SHALL have independent execution state for regular nodes
- **AND** data from one execution SHALL NOT be accessible in subsequent executions for regular nodes
- **AND** regular node outputs from one execution SHALL NOT affect subsequent executions
- **AND** trigger nodes SHALL maintain their state and configuration across executions

