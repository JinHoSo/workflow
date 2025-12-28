## ADDED Requirements

### Requirement: Node Execution Data
The system SHALL define a structured format for data passed between nodes during execution.

#### Scenario: Execution data structure
- **WHEN** data is passed between nodes
- **THEN** it SHALL be structured as INodeExecutionData
- **AND** it SHALL include a json property containing the primary data
- **AND** it SHALL support binary data separately from json data
- **AND** it SHALL support error information when errors occur

#### Scenario: Multiple execution items
- **WHEN** a node processes multiple items
- **THEN** execution data SHALL be passed as an array of INodeExecutionData
- **AND** each item in the array SHALL be processed independently
- **AND** output SHALL be an array of execution data arrays (one per output port)

#### Scenario: Binary data handling
- **WHEN** a node produces binary data (files, images, etc.)
- **THEN** binary data SHALL be stored separately from json data
- **AND** binary data SHALL include metadata (mimeType, fileName, fileSize, etc.)
- **AND** binary data SHALL be accessible to downstream nodes

#### Scenario: Error in execution data
- **WHEN** a node execution fails
- **THEN** the error SHALL be included in the execution data
- **AND** error information SHALL include error type, message, and stack trace
- **AND** downstream nodes SHALL be able to detect and handle errors

#### Scenario: Paired item tracking
- **WHEN** data flows through multiple nodes
- **THEN** the system SHALL track which input item produced which output item
- **AND** paired item information SHALL be included in execution data
- **AND** paired item tracking SHALL support data lineage through the workflow

### Requirement: Data Flow Protocol
The system SHALL define how data flows from output ports to input ports.

#### Scenario: Single output to single input
- **WHEN** one output port is connected to one input port
- **THEN** all execution data from the output port SHALL be passed to the input port
- **AND** data SHALL be passed in the order produced

#### Scenario: Multiple outputs to single input
- **WHEN** multiple output ports are connected to the same input port
- **THEN** data from all connected outputs SHALL be combined
- **AND** data SHALL be organized by source node and output index

#### Scenario: Single output to multiple inputs
- **WHEN** one output port is connected to multiple input ports
- **THEN** the same execution data SHALL be passed to all connected input ports
- **AND** each input port SHALL receive a copy of the data

#### Scenario: Data transformation
- **WHEN** data flows from output to input
- **THEN** the data structure SHALL be preserved
- **AND** type compatibility SHALL be validated
- **AND** incompatible types SHALL be rejected at connection time

