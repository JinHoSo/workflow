## ADDED Requirements

### Requirement: Automatic Plugin Discovery
The system SHALL automatically discover and load plugins from npm packages and local directories without manual registration.

#### Scenario: Discover plugins from npm packages
- **WHEN** the system initializes
- **THEN** it SHALL scan installed npm packages for workflow plugins
- **AND** it SHALL identify plugins using package.json metadata
- **AND** it SHALL automatically register discovered plugins
- **AND** it SHALL load node types from discovered plugins
- **AND** it SHALL report discovery status

#### Scenario: Discover plugins from local directory
- **WHEN** a local plugin directory is configured
- **THEN** the system SHALL scan the directory for plugins
- **AND** it SHALL identify plugins by package.json or manifest file
- **AND** it SHALL automatically register local plugins
- **AND** it SHALL prioritize local plugins over npm packages when conflicts occur

#### Scenario: Plugin discovery with dependencies
- **WHEN** a plugin is discovered
- **THEN** the system SHALL check plugin dependencies
- **AND** it SHALL ensure all dependencies are available
- **AND** it SHALL load dependencies before loading the plugin
- **AND** it SHALL report missing dependencies

#### Scenario: Plugin discovery caching
- **WHEN** plugins are discovered
- **THEN** the system SHALL cache discovery results
- **AND** it SHALL invalidate cache when packages change
- **AND** it SHALL provide option to force refresh
- **AND** cache SHALL improve startup performance

### Requirement: Plugin Metadata Detection
The system SHALL detect plugin metadata from package.json and plugin manifest files.

#### Scenario: Detect plugin from package.json
- **WHEN** scanning a package
- **THEN** the system SHALL check for `keywords` containing "workflow-plugin"
- **AND** it SHALL check for `workflow.plugin` field in package.json
- **AND** it SHALL extract plugin name, version, and node types
- **AND** it SHALL validate required metadata fields

#### Scenario: Detect plugin from manifest file
- **WHEN** a plugin provides a separate manifest file
- **THEN** the system SHALL read the manifest file
- **AND** it SHALL extract plugin metadata
- **AND** it SHALL merge manifest data with package.json data
- **AND** it SHALL use manifest data to override package.json when conflicts occur

#### Scenario: Validate plugin metadata
- **WHEN** plugin metadata is detected
- **THEN** the system SHALL validate required fields (name, version, nodeTypes)
- **AND** it SHALL validate node type names are unique
- **AND** it SHALL validate version format (semantic versioning)
- **AND** it SHALL report validation errors

### Requirement: Plugin Loading Strategy
The system SHALL support different plugin loading strategies for performance and flexibility.

#### Scenario: Eager plugin loading
- **WHEN** eager loading is configured
- **THEN** the system SHALL load all discovered plugins at startup
- **AND** it SHALL register all node types immediately
- **AND** it SHALL report loading time and status

#### Scenario: Lazy plugin loading
- **WHEN** lazy loading is configured
- **THEN** the system SHALL discover plugins at startup
- **AND** it SHALL defer loading until plugin is first used
- **AND** it SHALL load plugin when node type is requested
- **AND** it SHALL cache loaded plugins

#### Scenario: Selective plugin loading
- **WHEN** specific plugins are configured to load
- **THEN** the system SHALL only load specified plugins
- **AND** it SHALL skip other discovered plugins
- **AND** it SHALL allow runtime plugin loading

### Requirement: Plugin Conflict Resolution
The system SHALL handle conflicts when multiple plugins provide the same node type.

#### Scenario: Resolve node type conflicts
- **WHEN** multiple plugins provide the same node type name
- **THEN** the system SHALL use version to resolve conflicts
- **AND** it SHALL prefer newer version by default
- **AND** it SHALL allow explicit version selection
- **AND** it SHALL report conflicts to user

#### Scenario: Handle plugin version conflicts
- **WHEN** same plugin is available in multiple versions
- **THEN** the system SHALL allow loading specific version
- **AND** it SHALL support version ranges in dependencies
- **AND** it SHALL validate version compatibility
- **AND** it SHALL report version conflicts

### Requirement: Plugin Discovery Configuration
The system SHALL allow configuration of plugin discovery behavior.

#### Scenario: Configure discovery paths
- **WHEN** configuring plugin discovery
- **THEN** the system SHALL allow specifying npm package patterns
- **AND** it SHALL allow specifying local directory paths
- **AND** it SHALL allow excluding specific packages
- **AND** it SHALL support glob patterns for paths

#### Scenario: Configure discovery filters
- **WHEN** configuring discovery filters
- **THEN** the system SHALL allow filtering by plugin name pattern
- **AND** it SHALL allow filtering by node type
- **AND** it SHALL allow filtering by version range
- **AND** it SHALL support multiple filter criteria

