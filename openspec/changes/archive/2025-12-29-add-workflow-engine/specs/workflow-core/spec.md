## ADDED Requirements

### Requirement: Workflow Definition
The system SHALL provide a Workflow class that represents a collection of connected nodes forming an executable data processing pipeline.

#### Scenario: Create workflow
- **WHEN** a Workflow instance is created
- **THEN** it SHALL be initialized with an empty node collection
- **AND** it SHALL be in an inactive state

#### Scenario: Add node to workflow
- **WHEN** a node is added to a workflow
- **THEN** the workflow SHALL track the node in its node collection
- **AND** the node SHALL be associated with the workflow

#### Scenario: Connect nodes in workflow
- **WHEN** an output port of one node is connected to an input port of another node
- **THEN** the connection SHALL be validated for type compatibility
- **AND** the connection SHALL be stored in the workflow's connection graph
- **AND** the connection SHALL be indexed both by source node and destination node for efficient lookup
- **AND** if types are incompatible, the connection SHALL be rejected with an error

#### Scenario: Connection types
- **WHEN** nodes are connected
- **THEN** connections SHALL support different connection types (e.g., Main, AI, etc.)
- **AND** each connection type SHALL be independently managed
- **AND** nodes MAY have multiple input/output ports of different connection types

### Requirement: Workflow Execution
The system SHALL provide an execution engine that can execute workflows by running nodes in the correct order based on their dependencies.

#### Scenario: Execute simple workflow
- **WHEN** a workflow with a trigger node and processing nodes is executed
- **THEN** the execution engine SHALL resolve node dependencies
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

### Requirement: Workflow State Management
The system SHALL track the overall state of a workflow during execution.

#### Scenario: Workflow execution state
- **WHEN** a workflow starts execution
- **THEN** the workflow SHALL track execution state (idle, running, completed, error)
- **AND** the state SHALL be queryable at any time

#### Scenario: Reset workflow
- **WHEN** a workflow is reset
- **THEN** all nodes in the workflow SHALL be reset to their initial state
- **AND** all execution results SHALL be cleared

### Requirement: Workflow Data Management
The system SHALL provide mechanisms for managing workflow-level data and settings.

#### Scenario: Static data storage
- **WHEN** a workflow needs to store static data (e.g., registered webhook IDs)
- **THEN** the workflow SHALL provide a static data storage mechanism
- **AND** static data SHALL be accessible to nodes during execution
- **AND** static data SHALL persist across workflow executions

#### Scenario: Workflow settings
- **WHEN** a workflow is configured
- **THEN** it SHALL support workflow-level settings (e.g., timezone, error handling)
- **AND** settings SHALL be stored with the workflow
- **AND** settings SHALL be accessible during execution

#### Scenario: Pin data for testing
- **WHEN** pin data is set for a node
- **THEN** the workflow SHALL use the pinned data instead of executing the node
- **AND** pinned data SHALL override normal node execution
- **AND** pin data SHALL be useful for testing and development

### Requirement: Node Type Registry
The system SHALL provide a registry for managing node types and their versions.

#### Scenario: Register node type
- **WHEN** a node type is registered
- **THEN** it SHALL be stored in the node type registry
- **AND** it SHALL be retrievable by name and version
- **AND** multiple versions of the same node type MAY coexist

#### Scenario: Retrieve node type
- **WHEN** a node type is requested by name and version
- **THEN** the registry SHALL return the matching node type
- **AND** if no version is specified, the latest version SHALL be returned
- **AND** if the node type is not found, undefined SHALL be returned

#### Scenario: Node type validation
- **WHEN** a workflow is created with nodes
- **THEN** each node's type SHALL be validated against the registry
- **AND** nodes with unknown types SHALL be handled gracefully (skipped or error)

