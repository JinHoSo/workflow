# workflow-nodes Specification

## Purpose
TBD - created by archiving change add-workflow-engine. Update Purpose after archive.
## Requirements
### Requirement: Node Definition
The system SHALL provide a BaseNode class that represents the fundamental execution unit in a workflow. BaseNode SHALL be an abstract class that provides common node functionality and defines abstract methods that concrete node implementations MUST implement.

#### Scenario: Create base node
- **WHEN** a BaseNode instance is created
- **THEN** it SHALL have a unique identifier
- **AND** it SHALL have a name
- **AND** it SHALL be initialized in Inactive state
- **AND** it SHALL have empty input and output port collections
- **AND** it SHALL provide implementations for port management, status management, and actions

#### Scenario: Extend base node
- **WHEN** a new node class extends BaseNode
- **THEN** it SHALL inherit all BaseNode functionality
- **AND** it SHALL implement required abstract methods
- **AND** it SHALL be usable as a node in workflows

#### Scenario: Abstract execution method
- **WHEN** a class extends BaseNode
- **THEN** it SHALL implement the abstract execution method
- **AND** the execution method SHALL contain the node-specific processing logic

### Requirement: Node Ports
The system SHALL provide input and output ports on nodes for data flow.

#### Scenario: Define input ports
- **WHEN** a node defines input ports
- **THEN** each input port SHALL have a unique name within the node
- **AND** each input port SHALL have a type
- **AND** input ports SHALL accept data from output ports of compatible type

#### Scenario: Define output ports
- **WHEN** a node defines output ports
- **THEN** each output port SHALL have a unique name within the node
- **AND** each output port SHALL have a type
- **AND** output ports SHALL send data to connected input ports

#### Scenario: Connect ports
- **WHEN** an output port is connected to an input port
- **THEN** the system SHALL validate type compatibility
- **AND** if compatible, the connection SHALL be established
- **AND** if incompatible, the connection SHALL be rejected

#### Scenario: Multiple output ports
- **WHEN** a node has multiple output ports
- **THEN** each output port SHALL be independently connectable
- **AND** each output port MAY have different data types

### Requirement: Node Status
The system SHALL track and manage node status throughout the node lifecycle.

#### Scenario: Node status transitions
- **WHEN** a node is created
- **THEN** it SHALL be in Inactive state (red indicator)

#### Scenario: Configure node
- **WHEN** a node is configured with valid parameters
- **THEN** the node SHALL transition to Configured state (yellow indicator)
- **AND** configuration SHALL be stored on the node

#### Scenario: Execute node
- **WHEN** a configured node is executed successfully
- **THEN** the node SHALL transition to Executed state (green indicator)
- **AND** output ports SHALL contain execution results

#### Scenario: Node execution error
- **WHEN** a node execution fails
- **THEN** the node SHALL transition to Error state (red with X indicator)
- **AND** error information SHALL be available

### Requirement: Node Actions
The system SHALL provide actions that can be performed on nodes.

#### Scenario: Configure action
- **WHEN** the Configure action is invoked on a node
- **THEN** the node SHALL accept configuration parameters
- **AND** if configuration is valid, the node SHALL transition to Configured state
- **AND** if configuration is invalid, the node SHALL remain in current state with error information

#### Scenario: Execute action
- **WHEN** the Execute action is invoked on a configured node
- **THEN** the node SHALL execute its processing logic
- **AND** input ports SHALL be read for data
- **AND** output ports SHALL be populated with results
- **AND** the node SHALL transition to Executed or Error state

#### Scenario: Cancel action
- **WHEN** the Cancel action is invoked on a running node
- **THEN** the node execution SHALL be stopped
- **AND** the node SHALL transition to Configured state
- **AND** partial results SHALL be discarded

#### Scenario: Reset action
- **WHEN** the Reset action is invoked on a node
- **THEN** the node SHALL transition to Inactive state
- **AND** all configuration and execution results SHALL be cleared
- **AND** output ports SHALL be cleared

### Requirement: Node Annotation
The system SHALL support adding annotations (comments/notes) to nodes.

#### Scenario: Add annotation
- **WHEN** an annotation is added to a node
- **THEN** the annotation SHALL be stored with the node
- **AND** the annotation SHALL be retrievable

#### Scenario: Remove annotation
- **WHEN** an annotation is removed from a node
- **THEN** the annotation SHALL be cleared
- **AND** the node SHALL function normally without the annotation

### Requirement: Node Properties
The system SHALL support additional node properties for configuration and metadata.

#### Scenario: Node position
- **WHEN** a node is created
- **THEN** it SHALL have a position property (x, y coordinates)
- **AND** the position SHALL be used for visual representation (deferred to UI phase)

#### Scenario: Node disabled state
- **WHEN** a node is disabled
- **THEN** it SHALL be skipped during workflow execution
- **AND** the disabled state SHALL be stored with the node

#### Scenario: Node retry configuration
- **WHEN** a node is configured with retry settings
- **THEN** it SHALL support retry on failure
- **AND** retry settings SHALL include max tries and wait time between tries
- **AND** retry behavior SHALL be applied on execution failure

#### Scenario: Node error handling
- **WHEN** a node is configured with error handling options
- **THEN** it SHALL support continue on fail behavior
- **AND** it SHALL support different error output modes
- **AND** error handling configuration SHALL affect workflow execution flow

### Requirement: BaseNode Common Functionality
The BaseNode class SHALL provide implementations for all common node operations.

#### Scenario: Port management
- **WHEN** a node extends BaseNode
- **THEN** it SHALL have access to port management methods (addInputPort, addOutputPort, connectPorts)
- **AND** ports SHALL be managed by BaseNode

#### Scenario: Status management
- **WHEN** a node extends BaseNode
- **THEN** it SHALL have access to status management methods (setStatus, getStatus)
- **AND** status transitions SHALL be validated by BaseNode

#### Scenario: Action handlers
- **WHEN** a node extends BaseNode
- **THEN** it SHALL have default implementations for Configure, Execute, Cancel, and Reset actions
- **AND** the Execute action SHALL call the abstract execution method implemented by the subclass

