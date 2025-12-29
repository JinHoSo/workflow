## MODIFIED Requirements

### Requirement: Node Definition
The system SHALL provide a BaseNode class that represents the fundamental execution unit in a workflow. BaseNode SHALL be an abstract class that provides common node functionality and defines abstract methods that concrete node implementations MUST implement. All nodes, including triggers, SHALL extend BaseNode and follow the same execution model.

#### Scenario: Create base node
- **WHEN** a BaseNode instance is created
- **THEN** it SHALL have a unique identifier
- **AND** it SHALL have a name
- **AND** it SHALL be initialized in Idle state
- **AND** it SHALL have empty input and output port collections
- **AND** it SHALL provide implementations for port management, status management, and actions
- **AND** it SHALL support configuration schema validation

#### Scenario: Extend base node
- **WHEN** a new node class extends BaseNode
- **THEN** it SHALL inherit all BaseNode functionality
- **AND** it SHALL implement required abstract methods
- **AND** it SHALL be usable as a node in workflows
- **AND** it SHALL define a configuration schema for validation
- **AND** trigger nodes SHALL extend BaseNode and be identified by the `isTrigger` property

#### Scenario: Abstract execution method
- **WHEN** a class extends BaseNode
- **THEN** it SHALL implement the abstract execution method
- **AND** the execution method SHALL contain the node-specific processing logic
- **AND** the execution method SHALL use the ExecutionProtocol for execution
- **AND** trigger nodes SHALL implement the same execution method pattern

### Requirement: Node Ports
The system SHALL provide input and output ports on nodes for data flow with schema-based type validation.

#### Scenario: Define input ports
- **WHEN** a node defines input ports
- **THEN** each input port SHALL have a unique name within the node
- **AND** each input port SHALL have a type with optional schema
- **AND** input ports SHALL accept data from output ports of compatible type
- **AND** type compatibility SHALL be validated using schema matching when schemas are provided

#### Scenario: Define output ports
- **WHEN** a node defines output ports
- **THEN** each output port SHALL have a unique name within the node
- **AND** each output port SHALL have a type with optional schema
- **AND** output ports SHALL send data to connected input ports
- **AND** output data SHALL conform to the port's schema when provided

#### Scenario: Connect ports
- **WHEN** an output port is connected to an input port
- **THEN** the system SHALL validate type compatibility
- **AND** if schemas are provided, the system SHALL validate schema compatibility
- **AND** incompatible connections SHALL be rejected with a clear error message

## ADDED Requirements

### Requirement: Configuration Schema Validation
The system SHALL validate node configurations using JSON Schema before applying them.

#### Scenario: Schema validation on setup
- **WHEN** a node's setup() method is called with configuration
- **THEN** the configuration SHALL be validated against the node's configuration schema
- **AND** if validation fails, setup() SHALL reject with a detailed error message
- **AND** if validation succeeds, the configuration SHALL be applied
- **AND** the node SHALL store the validated configuration

#### Scenario: Schema definition
- **WHEN** a node type is defined
- **THEN** it SHALL provide a JSON Schema for its configuration
- **AND** the schema SHALL define all valid configuration properties
- **AND** the schema SHALL include property types, required fields, and validation rules
- **AND** the schema SHALL be versioned with the node type version

#### Scenario: Type-safe configuration
- **WHEN** a node configuration is accessed
- **THEN** it SHALL be type-safe based on the configuration schema
- **AND** TypeScript types SHALL be generated from the schema when possible
- **AND** configuration properties SHALL be validated at runtime using the schema

### Requirement: Node Execution Protocol
The system SHALL use the ExecutionProtocol for all node execution to ensure consistent execution behavior.

#### Scenario: Protocol-based execution
- **WHEN** a node is executed
- **THEN** execution SHALL go through the ExecutionProtocol
- **AND** the protocol SHALL validate the node is ready for execution
- **AND** the protocol SHALL handle execution state transitions
- **AND** the protocol SHALL manage execution context and data flow

#### Scenario: Protocol implementation
- **WHEN** the ExecutionProtocol is used
- **THEN** it SHALL provide a consistent execution interface for all nodes
- **AND** it SHALL support both synchronous and asynchronous execution
- **AND** it SHALL handle errors according to the ErrorHandlingProtocol
- **AND** it SHALL use the DataFlowProtocol for data passing

### Requirement: Error Handling Protocol
The system SHALL use the ErrorHandlingProtocol for consistent error handling across all nodes.

#### Scenario: Protocol-based error handling
- **WHEN** a node execution fails
- **THEN** the error SHALL be handled through the ErrorHandlingProtocol
- **AND** the protocol SHALL determine if execution should stop
- **AND** the protocol SHALL propagate errors to dependent nodes appropriately
- **AND** the protocol SHALL support retry strategies when configured

#### Scenario: Error propagation
- **WHEN** an error occurs in a node
- **THEN** the ErrorHandlingProtocol SHALL determine error propagation
- **AND** errors SHALL be propagated according to node configuration (continueOnFail, retry, etc.)
- **AND** error information SHALL be included in execution state
- **AND** dependent nodes SHALL receive error information when appropriate

### Requirement: Retry Mechanism
The system SHALL support configurable retry strategies for node execution failures.

#### Scenario: Retry on failure
- **WHEN** a node execution fails and retry is configured
- **THEN** the node SHALL be retried according to the retry strategy
- **AND** retry attempts SHALL be tracked and limited
- **AND** retry delays SHALL be applied according to the strategy (exponential backoff, fixed delay, etc.)
- **AND** retry success SHALL allow execution to continue normally

#### Scenario: Retry strategy configuration
- **WHEN** a node is configured with retry strategy
- **THEN** the retry strategy SHALL define maximum retry attempts
- **AND** the retry strategy SHALL define retry delay and backoff behavior
- **AND** the retry strategy SHALL define which error types trigger retries
- **AND** retry configuration SHALL be validated against the node's configuration schema

