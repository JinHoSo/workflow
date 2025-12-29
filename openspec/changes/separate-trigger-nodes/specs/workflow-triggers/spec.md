# workflow-triggers Specification Delta

## MODIFIED Requirements

### Requirement: Trigger Base Class
The system SHALL provide a base Trigger class that extends Node and serves as the foundation for all trigger types.

#### Scenario: Trigger as node
- **WHEN** a Trigger is created
- **THEN** it SHALL be a valid Node instance
- **AND** it SHALL have all node capabilities (ports, status, actions)
- **AND** it SHALL have a trigger-specific execution method
- **AND** it SHALL be added to workflows using `addTriggerNode()` method, not `addNode()`

#### Scenario: Add trigger to workflow
- **WHEN** a trigger node is added to a workflow
- **THEN** it SHALL be added via `workflow.addTriggerNode(trigger)` method
- **AND** it SHALL be stored in the workflow's `triggers` collection
- **AND** it SHALL NOT be stored in the workflow's `nodes` collection
- **AND** if `addNode()` is used with a trigger, it SHALL be rejected with an error

