## MODIFIED Requirements

### Requirement: Trigger Base Class
The system SHALL provide a base Trigger class that extends Node and serves as the foundation for all trigger types.

**Organization**: Each trigger implementation SHALL be organized in its own modular folder structure containing the trigger implementation, schema, utilities, and related files.

#### Scenario: Trigger as node
- **WHEN** a Trigger is created
- **THEN** it SHALL be a valid Node instance
- **AND** it SHALL have all node capabilities (ports, status, actions)
- **AND** it SHALL have a trigger-specific execution method
- **AND** it SHALL be organized in a modular folder structure with schema and related files

#### Scenario: Trigger execution flow
- **WHEN** trigger() is called on a trigger
- **THEN** it SHALL call the trigger's activate() method with execution data
- **AND** the activate() method SHALL check if the workflow is in Idle state before execution
- **AND** if the workflow is running, the activate() method SHALL NOT execute and SHALL reject the execution attempt
- **AND** if the workflow is in Idle state, it SHALL reset the workflow to clean state before execution
- **AND** it SHALL initiate workflow execution
- **AND** it SHALL provide initial data to the workflow through its output ports
