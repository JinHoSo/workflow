# workflow-node-types Specification

## Purpose
TBD - created by archiving change add-workflow-engine. Update Purpose after archive.
## Requirements
### Requirement: JavaScript Execution Node
The system SHALL provide a JavaScriptExecutionNode that can execute user-provided JavaScript code with access to input port data.

#### Scenario: Create JavaScript execution node
- **WHEN** a JavaScriptExecutionNode is created
- **THEN** it SHALL extend BaseNode
- **AND** it SHALL have a default input port for receiving data
- **AND** it SHALL have a default output port for sending results
- **AND** it SHALL be in Inactive state

#### Scenario: Configure JavaScript code
- **WHEN** a JavaScriptExecutionNode is configured with JavaScript code
- **THEN** the code SHALL be validated for syntax errors
- **AND** if valid, the code SHALL be stored in the node configuration
- **AND** the node SHALL transition to Configured state
- **AND** if invalid, the node SHALL remain in current state with error information

#### Scenario: Execute JavaScript code
- **WHEN** a configured JavaScriptExecutionNode is executed
- **THEN** the JavaScript code SHALL be executed
- **AND** input port data SHALL be accessible in the execution context
- **AND** the execution context SHALL provide a way to set output data
- **AND** output port SHALL be populated with the result
- **AND** the node SHALL transition to Executed state on success

#### Scenario: JavaScript execution with input data
- **WHEN** a JavaScriptExecutionNode executes with data on input ports
- **THEN** the input data SHALL be available in the JavaScript execution context
- **AND** the code SHALL be able to read and process the input data
- **AND** the code SHALL be able to set output data

#### Scenario: JavaScript execution error
- **WHEN** JavaScript code execution fails (runtime error, syntax error, etc.)
- **THEN** the node SHALL transition to Error state
- **AND** error information (message, stack trace) SHALL be available
- **AND** the error SHALL be stored in the node state

#### Scenario: JavaScript execution context
- **WHEN** JavaScript code is executed
- **THEN** the execution context SHALL provide access to input data
- **AND** the execution context SHALL provide a method to set output data
- **AND** the execution context SHALL support standard JavaScript features (variables, functions, control flow)
- **AND** the execution context MAY support async/await if the execution engine supports it

#### Scenario: Code validation
- **WHEN** JavaScript code is configured
- **THEN** the system SHALL validate the code syntax
- **AND** syntax errors SHALL be detected and reported
- **AND** validation SHALL occur before the node transitions to Configured state

