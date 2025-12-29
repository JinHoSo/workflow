## MODIFIED Requirements

### Requirement: Workflow Definition
The system SHALL provide a Workflow class that represents a collection of connected nodes forming an executable data processing pipeline. All nodes, including triggers, SHALL be stored in a unified node collection.

#### Scenario: Create workflow
- **WHEN** a Workflow instance is created
- **THEN** it SHALL be initialized with an empty unified node collection
- **AND** it SHALL be in an inactive state
- **AND** it SHALL support both regular nodes and trigger nodes in the same collection

#### Scenario: Add node to workflow
- **WHEN** a node is added to a workflow
- **THEN** the workflow SHALL track the node in its unified node collection
- **AND** the node SHALL be associated with the workflow
- **AND** trigger nodes SHALL be identified by the `isTrigger` property in their properties
- **AND** both regular nodes and trigger nodes SHALL be stored in the same collection

#### Scenario: Connect nodes in workflow
- **WHEN** an output port of one node is connected to an input port of another node
- **THEN** the connection SHALL be validated for type compatibility using schema validation
- **AND** the connection SHALL be stored in the workflow's connection graph
- **AND** the connection SHALL be indexed both by source node and destination node for efficient lookup
- **AND** if types are incompatible, the connection SHALL be rejected with an error

#### Scenario: Connection types
- **WHEN** nodes are connected
- **THEN** connections SHALL support different connection types (e.g., Main, AI, etc.)
- **AND** each connection type SHALL be independently managed
- **AND** nodes MAY have multiple input/output ports of different connection types

### Requirement: Workflow Execution
The system SHALL provide an execution engine that can execute workflows by running nodes in the correct order based on their dependencies using topological sorting, with support for parallel execution of independent nodes.

#### Scenario: Execute simple workflow
- **WHEN** a workflow with a trigger node and processing nodes is executed
- **THEN** the execution engine SHALL check if the workflow is in Idle state
- **AND** if the workflow is not in Idle state, the execution engine SHALL reject the execution with an error
- **AND** if the workflow is in Idle state, the execution engine SHALL reset regular nodes (non-trigger nodes) to clean state before execution
- **AND** trigger nodes SHALL NOT be reset to preserve their state and configuration
- **AND** the execution engine SHALL clear all previous execution state
- **AND** the execution engine SHALL resolve node dependencies using topological sorting
- **AND** nodes SHALL be executed in dependency order
- **AND** independent nodes (nodes with no dependencies on each other) SHALL be executed in parallel
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
- **THEN** the execution engine SHALL identify these independent nodes using topological analysis
- **AND** these nodes SHALL be executed in parallel when possible
- **AND** parallel execution SHALL respect resource constraints and configuration limits
- **AND** the execution engine SHALL wait for all parallel nodes to complete before proceeding to dependent nodes

#### Scenario: Handle execution errors
- **WHEN** a node execution fails
- **THEN** the node SHALL transition to Error state
- **AND** dependent nodes SHALL NOT be executed unless the node has `continueOnFail` enabled
- **AND** the workflow execution SHALL stop unless error recovery is configured
- **AND** error information SHALL be available for inspection
- **AND** nodes with retry configuration SHALL be retried according to their retry strategy
- **AND** retry attempts SHALL be tracked and limited

#### Scenario: Multiple workflow executions
- **WHEN** a workflow is executed multiple times
- **THEN** each execution SHALL start with a clean state for regular nodes
- **AND** all regular node outputs from previous executions SHALL be cleared
- **AND** all execution state from previous executions SHALL be cleared
- **AND** trigger nodes SHALL preserve their state and configuration between executions
- **AND** previous executions SHALL NOT interfere with new executions
- **AND** parallel executions of the same workflow SHALL be supported with proper state isolation

### Requirement: Workflow State Management
The system SHALL track the overall state of a workflow during execution using centralized state management.

#### Scenario: Workflow execution state
- **WHEN** a workflow starts execution
- **THEN** the workflow SHALL track execution state (idle, running, completed, error) in a centralized state manager
- **AND** the state SHALL be queryable at any time
- **AND** the state SHALL support persistence hooks for external storage
- **AND** the state SHALL include execution metadata (start time, duration, node execution status, etc.)

#### Scenario: Reset workflow
- **WHEN** a workflow is reset
- **THEN** all regular nodes (non-trigger nodes) in the workflow SHALL be reset to their initial state
- **AND** trigger nodes SHALL NOT be reset to preserve their state and configuration
- **AND** all execution results from regular nodes SHALL be cleared
- **AND** all regular node outputs SHALL be cleared
- **AND** all execution state SHALL be cleared
- **AND** centralized state manager SHALL be reset

### Requirement: Workflow Data Management
The system SHALL provide mechanisms for managing workflow-level data and settings.

#### Scenario: Static data storage
- **WHEN** a workflow needs to store static data (e.g., registered webhook IDs)
- **THEN** the workflow SHALL provide a static data storage mechanism
- **AND** static data SHALL be accessible to nodes during execution
- **AND** static data SHALL persist across workflow executions

#### Scenario: Workflow settings
- **WHEN** a workflow is configured
- **THEN** it SHALL support workflow-level settings (e.g., timezone, error handling, parallel execution limits)
- **AND** settings SHALL be stored with the workflow
- **AND** settings SHALL be accessible during execution
- **AND** settings SHALL include configuration for parallel execution limits and retry strategies

#### Scenario: Pin data for testing
- **WHEN** pin data is set for a node
- **THEN** the workflow SHALL use the pinned data instead of executing the node
- **AND** pinned data SHALL override normal node execution
- **AND** pin data SHALL be useful for testing and development

### Requirement: Node Type Registry
The system SHALL provide a registry for managing node types and their versions, with support for dynamic plugin loading.

#### Scenario: Register node type
- **WHEN** a node type is registered
- **THEN** it SHALL be stored in the node type registry
- **AND** it SHALL be retrievable by name and version
- **AND** multiple versions of the same node type MAY coexist
- **AND** node types MAY be registered from plugins dynamically

#### Scenario: Retrieve node type
- **WHEN** a node type is requested by name and version
- **THEN** the registry SHALL return the matching node type
- **AND** if no version is specified, the latest version SHALL be returned
- **AND** if the node type is not found, undefined SHALL be returned
- **AND** the registry SHALL support plugin-based node type discovery

#### Scenario: Node type validation
- **WHEN** a workflow is created with nodes
- **THEN** each node's type SHALL be validated against the registry
- **AND** nodes with unknown types SHALL be handled gracefully (skipped or error)
- **AND** node type schemas SHALL be validated during node configuration

## ADDED Requirements

### Requirement: Topological Execution Ordering
The system SHALL use topological sorting to determine the correct execution order of nodes in a workflow.

#### Scenario: Topological sort execution
- **WHEN** a workflow is executed
- **THEN** the execution engine SHALL build a dependency graph from node connections
- **AND** the execution engine SHALL perform topological sort to determine execution order
- **AND** nodes with no dependencies SHALL be identified as entry points
- **AND** nodes SHALL be grouped by dependency level for parallel execution
- **AND** circular dependencies SHALL be detected and reported as errors

#### Scenario: Parallel node execution
- **WHEN** multiple nodes have no dependencies on each other
- **THEN** these nodes SHALL be identified as independent
- **AND** these nodes SHALL be executed in parallel when parallel execution is enabled
- **AND** parallel execution SHALL respect configured limits
- **AND** execution state SHALL be properly synchronized between parallel executions

### Requirement: Centralized Execution State
The system SHALL maintain centralized execution state for workflow execution monitoring and persistence.

#### Scenario: State tracking
- **WHEN** a workflow executes
- **THEN** execution state SHALL be maintained centrally in the ExecutionEngine
- **AND** state SHALL include node execution status, outputs, errors, and metadata
- **AND** state SHALL be queryable at any time during execution
- **AND** state SHALL support persistence hooks for external storage

#### Scenario: State persistence
- **WHEN** state persistence is configured
- **THEN** execution state SHALL be persisted at configurable intervals
- **AND** persisted state SHALL be recoverable for workflow resumption
- **AND** state persistence SHALL not block execution

#### Scenario: State recovery
- **WHEN** a workflow execution is resumed from persisted state
- **THEN** the execution engine SHALL restore execution state from persistence
- **AND** nodes SHALL be restored to their previous execution state
- **AND** execution SHALL continue from the point of interruption

