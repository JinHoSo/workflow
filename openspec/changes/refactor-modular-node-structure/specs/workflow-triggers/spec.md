## MODIFIED Requirements

### Requirement: Trigger Definition
The system SHALL provide trigger nodes that initiate workflow execution. Triggers SHALL extend BaseNode and be identified by the `isTrigger` property.

**Organization**: Each trigger implementation SHALL be organized in its own modular folder structure containing the trigger implementation, schema, utilities, and related files.

#### Scenario: Create trigger node
- **WHEN** a trigger node is created
- **THEN** it SHALL extend BaseNode or TriggerNodeBase
- **AND** it SHALL have the `isTrigger` property set to true
- **AND** it SHALL be organized in a modular folder structure with schema and related files

#### Scenario: Trigger activation
- **WHEN** a trigger is activated
- **THEN** it SHALL initiate workflow execution
- **AND** it SHALL provide initial data to the workflow

