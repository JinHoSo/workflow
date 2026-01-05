## MODIFIED Requirements

### Requirement: Node Properties
The system SHALL support additional node properties for configuration and metadata.

#### Scenario: Node position
- **WHEN** a node is created
- **THEN** it SHALL have a position property (x, y coordinates)
- **AND** the position SHALL be used for visual representation (deferred to UI phase)

#### Scenario: Node type identifier
- **WHEN** a node is created
- **THEN** it SHALL have a `nodeType` property that is a string identifier
- **AND** the `nodeType` string SHALL be used to look up the node type implementation in the NodeTypeRegistry
- **AND** the `nodeType` MUST match a registered node type name in the NodeTypeRegistry (e.g., "javascript", "manual-trigger", "http-request")
- **AND** the `nodeType` is a string type to allow flexible registration of custom node types by plugins at runtime
- **AND** if the `nodeType` is not registered in the NodeTypeRegistry, the node SHALL fail validation when added to a workflow or when the workflow is executed
- **AND** custom node types SHALL be registered in the NodeTypeRegistry before nodes using them can be created or executed
- **AND** each node class SHALL define its `nodeType` as a static property or constant (e.g., `static readonly nodeType = "javascript"`)
- **AND** when creating a node instance using a node class constructor, the constructor SHALL automatically set the `nodeType` property from the class definition, overriding any user-provided value to prevent inconsistencies
- **AND** users SHALL NOT be required to specify `nodeType` when creating node instances using class constructors
- **AND** the `nodeType` property is required for serialization/deserialization (JSON export/import) where class information is not available

#### Scenario: Node trigger flag
- **WHEN** a node is created
- **THEN** it SHALL have an `isTrigger` property that indicates whether the node is a trigger node
- **AND** if `isTrigger` is not explicitly set, it SHALL default to `false`
- **AND** regular nodes (non-trigger nodes) SHALL have `isTrigger` set to `false`
- **AND** trigger nodes SHALL have `isTrigger` set to `true`
- **AND** the default value of `false` allows regular nodes to omit the property for cleaner code

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

