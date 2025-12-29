# workflow-state Specification Delta

## MODIFIED Requirements

### Requirement: Node Status Enum
The system SHALL define a NodeStatus enum with the following states: Idle, Running, Completed, Failed.

#### Scenario: Status values
- **WHEN** node status is queried
- **THEN** it SHALL return one of: Idle, Running, Completed, or Failed
- **AND** the status SHALL be type-safe (no string literals)
- **AND** `Ready` state SHALL NOT exist (removed)

### Requirement: Status Transitions
The system SHALL enforce valid state transitions for nodes.

#### Scenario: Valid transitions
- **WHEN** a node transitions between states
- **THEN** only valid transitions SHALL be allowed:
  - Idle → Running (via Execute action)
  - Running → Completed (via Execute action, success)
  - Running → Failed (via Execute action, failure)
  - Completed → Idle (via Reset action)
  - Failed → Idle (via Reset action)
- **AND** `Ready` state transitions SHALL NOT exist (removed)

#### Scenario: Setup does not change state
- **WHEN** a node's `setup()` method is called
- **THEN** the node SHALL update its configuration
- **AND** the node state SHALL NOT change
- **AND** nodes in `Idle` state can execute if they have valid configuration

#### Scenario: Reset always sets Idle
- **WHEN** a node's `reset()` method is called
- **THEN** the node SHALL transition to `Idle` state
- **AND** configuration SHALL be preserved
- **AND** error and result data SHALL be cleared
- **AND** state SHALL be `Idle` regardless of previous state or configuration

