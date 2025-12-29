## MODIFIED Requirements

### Requirement: Workflow Execution
The system SHALL provide an execution engine that can execute workflows by running nodes in the correct order based on their dependencies.

#### Scenario: Execute simple workflow
- **WHEN** a workflow with a trigger node and processing nodes is executed
- **THEN** the execution engine SHALL check if the workflow is in Idle state
- **AND** if the workflow is not in Idle state, the execution engine SHALL reject the execution with an error
- **AND** if the workflow is in Idle state, the execution engine SHALL reset regular nodes (non-trigger nodes) to clean state before execution
- **AND** trigger nodes SHALL NOT be reset to preserve their state and configuration
- **AND** the execution engine SHALL clear all previous execution state
- **AND** the execution engine SHALL resolve node dependencies
- **AND** nodes SHALL be executed in dependency order
- **AND** data SHALL flow from output ports to connected input ports
- **AND** execution data SHALL be structured with json, binary, and error information
- **AND** execution data SHALL be passed as arrays to support multiple items

#### Scenario: Execution data structure
- **WHEN** a node produces output data
- **THEN** the data SHALL be structured as INodeExecutionData with json property
- **AND** binary data SHALL be supported separately from json data
- **AND** error information SHALL be included in execution data when errors occur
- **AND** paired item information SHALL track data lineage through the workflow

#### Scenario: Execute parallel nodes
- **WHEN** a workflow contains nodes that have no dependencies on each other
- **THEN** the execution engine SHALL identify these independent nodes
- **AND** these nodes MAY be executed in parallel (implementation may be sequential initially)

#### Scenario: Handle execution errors
- **WHEN** a node execution fails
- **THEN** the node SHALL transition to Error state
- **AND** dependent nodes SHALL NOT be executed
- **AND** the workflow execution SHALL stop
- **AND** error information SHALL be available for inspection

#### Scenario: Multiple workflow executions
- **WHEN** a workflow is executed multiple times
- **THEN** each execution SHALL start with a clean state for regular nodes
- **AND** all regular node outputs from previous executions SHALL be cleared
- **AND** all execution state from previous executions SHALL be cleared
- **AND** trigger nodes SHALL preserve their state and configuration between executions
- **AND** previous executions SHALL NOT interfere with new executions

### Requirement: Workflow State Management
The system SHALL track the overall state of a workflow during execution.

#### Scenario: Workflow execution state
- **WHEN** a workflow starts execution
- **THEN** the workflow SHALL track execution state (idle, running, completed, error)
- **AND** the state SHALL be queryable at any time

#### Scenario: Reset workflow
- **WHEN** a workflow is reset
- **THEN** all regular nodes (non-trigger nodes) in the workflow SHALL be reset to their initial state
- **AND** trigger nodes SHALL NOT be reset to preserve their state and configuration
- **AND** all execution results from regular nodes SHALL be cleared
- **AND** all regular node outputs SHALL be cleared
- **AND** all execution state SHALL be cleared

