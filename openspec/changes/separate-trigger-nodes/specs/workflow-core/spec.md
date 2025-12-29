# workflow-core Specification Delta

## MODIFIED Requirements

### Requirement: Workflow Definition
The system SHALL provide a Workflow class that represents a collection of connected nodes forming an executable data processing pipeline.

#### Scenario: Create workflow
- **WHEN** a Workflow instance is created
- **THEN** it SHALL be initialized with empty node and trigger collections
- **AND** it SHALL be in an inactive state
- **AND** trigger nodes and regular nodes SHALL be stored in separate collections

#### Scenario: Add node to workflow
- **WHEN** a regular node is added to a workflow via `addNode()`
- **THEN** the workflow SHALL track the node in its `nodes` collection
- **AND** the node SHALL be associated with the workflow
- **AND** if a trigger node is passed to `addNode()`, it SHALL be rejected with an error

#### Scenario: Add trigger node to workflow
- **WHEN** a trigger node is added to a workflow via `addTriggerNode()`
- **THEN** the workflow SHALL track the trigger in its `triggers` collection
- **AND** the trigger SHALL be associated with the workflow
- **AND** trigger nodes SHALL be stored separately from regular nodes

### Requirement: Workflow State Management
The system SHALL track the overall state of a workflow during execution.

#### Scenario: Reset workflow
- **WHEN** a workflow is reset
- **THEN** all regular nodes in the `nodes` collection SHALL be reset to their initial state
- **AND** trigger nodes in the `triggers` collection SHALL NOT be reset (preserved)
- **AND** all execution results from regular nodes SHALL be cleared
- **AND** trigger nodes SHALL maintain their state and configuration

