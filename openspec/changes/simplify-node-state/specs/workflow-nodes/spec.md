# workflow-nodes Specification Delta

## MODIFIED Requirements

### Requirement: Node Status
The system SHALL track and manage node status throughout the node lifecycle.

#### Scenario: Node status transitions
- **WHEN** a node is created
- **THEN** it SHALL be in `Idle` state
- **AND** `Ready` state SHALL NOT be used

#### Scenario: Configure node
- **WHEN** a node is configured with valid parameters via `setup()`
- **THEN** configuration SHALL be stored on the node
- **AND** the node state SHALL remain `Idle` (no state transition)
- **AND** nodes in `Idle` state can execute if they have valid configuration

#### Scenario: Execute node
- **WHEN** a node in `Idle` state is executed successfully
- **THEN** the node SHALL transition to `Running` state during execution
- **AND** after successful completion, the node SHALL transition to `Completed` state
- **AND** output ports SHALL contain execution results
- **AND** nodes can execute from `Idle` state if they have valid configuration

#### Scenario: Node execution error
- **WHEN** a node execution fails
- **THEN** the node SHALL transition to `Failed` state
- **AND** error information SHALL be available

### Requirement: Node Actions
The system SHALL provide actions that can be performed on nodes.

#### Scenario: Configure action
- **WHEN** the `setup()` method is invoked on a node
- **THEN** the node SHALL accept configuration parameters
- **AND** if configuration is valid, configuration SHALL be stored
- **AND** if configuration is invalid, the node SHALL remain in current state with error information
- **AND** the node state SHALL NOT change (remains `Idle`)

#### Scenario: Execute action
- **WHEN** the `run()` method is invoked on a node in `Idle` state
- **THEN** the node SHALL execute its processing logic
- **AND** input ports SHALL be read for data
- **AND** output ports SHALL be populated with results
- **AND** the node SHALL transition to `Completed` or `Failed` state
- **AND** nodes in `Idle` state can execute if they have valid configuration

#### Scenario: Reset action
- **WHEN** the `reset()` method is invoked on a node
- **THEN** the node SHALL transition to `Idle` state
- **AND** configuration SHALL be preserved
- **AND** error and result data SHALL be cleared
- **AND** output ports SHALL be cleared
- **AND** state SHALL be `Idle` regardless of previous state

