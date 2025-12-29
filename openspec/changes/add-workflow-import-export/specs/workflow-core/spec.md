## ADDED Requirements

### Requirement: Workflow Export
The system SHALL provide functionality to export a workflow to JSON format containing all workflow definition data.

#### Scenario: Export complete workflow
- **WHEN** a workflow is exported to JSON
- **THEN** the JSON SHALL contain workflow id and name
- **AND** the JSON SHALL contain all nodes with their properties, configuration, input ports, output ports, and annotations
- **AND** the JSON SHALL contain all links between nodes (linksBySource)
- **AND** the JSON SHALL contain workflow settings
- **AND** the JSON SHALL contain static data
- **AND** the JSON SHALL contain pin data if present
- **AND** the JSON SHALL include a version field for format compatibility

#### Scenario: Export node data
- **WHEN** a node is serialized during export
- **THEN** the serialized data SHALL include node properties (id, name, nodeType, version, position, disabled, notes, retry settings)
- **AND** the serialized data SHALL include node configuration
- **AND** the serialized data SHALL include input port definitions (name, dataType, linkType)
- **AND** the serialized data SHALL include output port definitions (name, dataType, linkType)
- **AND** the serialized data SHALL include annotation if present
- **AND** the serialized data SHALL NOT include execution state (state, error, resultData)

#### Scenario: Export format structure
- **WHEN** a workflow is exported
- **THEN** the JSON SHALL be valid JSON that can be parsed
- **AND** the JSON SHALL have a well-defined schema
- **AND** the JSON SHALL be human-readable

### Requirement: Workflow Import
The system SHALL provide functionality to import a workflow from JSON format and recreate a fully functional workflow instance.

#### Scenario: Import complete workflow
- **WHEN** a valid workflow JSON is imported
- **THEN** the system SHALL create a new Workflow instance
- **AND** the workflow SHALL have the same id and name as in the JSON
- **AND** all nodes SHALL be reconstructed with their properties, configuration, and ports
- **AND** all links between nodes SHALL be restored
- **AND** workflow settings SHALL be restored
- **AND** static data SHALL be restored
- **AND** pin data SHALL be restored if present in JSON
- **AND** the workflow SHALL be in Idle state (not running)

#### Scenario: Reconstruct nodes from serialized data
- **WHEN** nodes are imported from JSON
- **THEN** each node SHALL be instantiated using the nodeTypeRegistry
- **AND** node properties SHALL be restored from serialized data
- **AND** node configuration SHALL be restored
- **AND** input ports SHALL be restored
- **AND** output ports SHALL be restored
- **AND** annotations SHALL be restored if present
- **AND** nodes SHALL be in Idle state (not in execution state)

#### Scenario: Validate imported data
- **WHEN** workflow JSON is imported
- **THEN** the system SHALL validate the JSON structure matches expected format
- **AND** the system SHALL validate all required fields are present
- **AND** the system SHALL validate all node types exist in the nodeTypeRegistry
- **AND** the system SHALL validate all link references point to existing nodes
- **AND** if validation fails, the system SHALL reject the import with a clear error message
- **AND** if validation succeeds, the system SHALL proceed with workflow reconstruction

#### Scenario: Handle missing node types
- **WHEN** imported JSON contains a node type not registered in nodeTypeRegistry
- **THEN** the import SHALL fail with a clear error message indicating which node types are missing
- **AND** the system SHALL NOT create a partial workflow

#### Scenario: Reconstruct links
- **WHEN** links are imported from JSON
- **THEN** linksBySource SHALL be restored from JSON
- **AND** linksByTarget SHALL be automatically reconstructed from linksBySource
- **AND** link validation SHALL ensure source and target nodes exist
- **AND** link validation SHALL ensure port types are compatible

#### Scenario: Import round-trip
- **WHEN** a workflow is exported and then imported
- **THEN** the imported workflow SHALL be functionally equivalent to the original
- **AND** all nodes SHALL be present with correct configuration
- **AND** all links SHALL be restored correctly
- **AND** all settings and static data SHALL be preserved
- **AND** the workflow SHALL be executable

### Requirement: Export Format Versioning
The system SHALL support version tracking in export format to enable future format changes.

#### Scenario: Export includes version
- **WHEN** a workflow is exported
- **THEN** the JSON SHALL include a version field indicating the export format version
- **AND** the version SHALL be a numeric value

#### Scenario: Import validates version
- **WHEN** a workflow JSON is imported
- **THEN** the system SHALL check the version field
- **AND** if the version is not supported, the system SHALL reject the import with an error message
- **AND** if the version is supported, the system SHALL proceed with import

