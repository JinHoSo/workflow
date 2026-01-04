## MODIFIED Requirements

### Requirement: Workflow Definition
The system SHALL provide a Workflow class that represents a collection of connected nodes forming an executable data processing pipeline.

**Package Organization**: The Workflow class and related core functionality SHALL be provided by the `@workflow/core` package. The package SHALL depend on `@workflow/interfaces` for type definitions.

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

**Package Organization**: The execution engine SHALL be provided by the `@workflow/execution` package. The package SHALL depend on `@workflow/core` and `@workflow/interfaces`.

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

**Package Organization**: The NodeTypeRegistry SHALL be provided by the `@workflow/core` package.

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

## ADDED Requirements

### Requirement: Monorepo Package Structure
The workflow system SHALL be organized as a yarn workspace monorepo with multiple packages.

**Package Organization**: The system SHALL consist of the following packages:
- `@workflow/interfaces` - TypeScript interfaces and type definitions (no dependencies)
- `@workflow/core` - Core workflow engine (depends on `@workflow/interfaces`)
- `@workflow/execution` - Execution engine (depends on `@workflow/core`, `@workflow/interfaces`)
- `@workflow/protocols` - Protocol implementations (depends on `@workflow/interfaces`)
- `@workflow/schemas` - Schema validation (depends on `@workflow/interfaces`)
- `@workflow/secrets` - Secrets management (depends on `@workflow/interfaces`)
- `@workflow/plugins` - Plugin system (depends on `@workflow/core`, `@workflow/interfaces`)
- `@workflow/nodes` - Built-in nodes (depends on `@workflow/core`, `@workflow/interfaces`, `@workflow/schemas`)

#### Scenario: Package dependencies
- **WHEN** packages are built
- **THEN** packages SHALL declare their dependencies on other workflow packages
- **AND** dependencies SHALL be resolved through yarn workspace linking
- **AND** circular dependencies SHALL be prevented

#### Scenario: Package imports
- **WHEN** code imports from other workflow packages
- **THEN** imports SHALL use package names (e.g., `@workflow/core`, `@workflow/interfaces`)
- **AND** relative path imports between packages SHALL NOT be used
- **AND** each package SHALL have its own entry point (`index.ts`)

#### Scenario: Package builds
- **WHEN** packages are built
- **THEN** each package SHALL have its own build configuration
- **AND** packages SHALL build independently
- **AND** packages SHALL build in dependency order when building the entire workspace

