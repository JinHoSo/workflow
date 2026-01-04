## ADDED Requirements

### Requirement: Secret Storage
The system SHALL provide secure storage for authentication credentials and sensitive data. Secrets SHALL be encrypted at rest and accessible by name. The system SHALL support multiple storage backends with SQLite as the default and file-based storage as a fallback option.

#### Scenario: Create secret
- **WHEN** a secret is created with a name, type, and data
- **THEN** it SHALL be encrypted using AES-256-GCM
- **AND** it SHALL be stored in the secret registry
- **AND** it SHALL be retrievable by name
- **AND** it SHALL include metadata (name, description, creation timestamp)

#### Scenario: Retrieve secret
- **WHEN** a secret is retrieved by name
- **THEN** it SHALL be decrypted
- **AND** it SHALL return the secret data in the appropriate format for the secret type
- **AND** if the secret does not exist, it SHALL return undefined or throw an appropriate error

#### Scenario: Update secret
- **WHEN** an existing secret is updated with new data
- **THEN** it SHALL encrypt the new data
- **AND** it SHALL replace the existing secret
- **AND** it SHALL preserve the secret ID and metadata

#### Scenario: Delete secret
- **WHEN** a secret is deleted by name
- **THEN** it SHALL be removed from the secret registry
- **AND** it SHALL no longer be accessible

#### Scenario: List secrets
- **WHEN** secrets are listed
- **THEN** it SHALL return metadata for all secrets (name, type, description)
- **AND** it SHALL NOT return decrypted secret values
- **AND** it SHALL support filtering by type or tags

#### Scenario: SQLite storage backend (default)
- **WHEN** the secrets system is initialized
- **THEN** it SHALL use SQLite database as the default storage backend
- **AND** it SHALL create a SQLite database file in the configured storage location
- **AND** it SHALL create the necessary database schema (tables for secrets, metadata)
- **AND** it SHALL store encrypted secrets in the database
- **AND** it SHALL support efficient querying and filtering of secrets

#### Scenario: Storage location relative to execution directory
- **WHEN** the secrets system determines the storage location
- **THEN** it SHALL use the code execution directory (process.cwd()) as the base path by default
- **AND** it SHALL create storage files/database in a subdirectory relative to the execution directory
- **AND** it SHALL NOT use /tmp or user home directory as the default location
- **AND** it SHALL support override via WORKFLOW_SECRETS_STORAGE_PATH environment variable
- **AND** if WORKFLOW_SECRETS_STORAGE_PATH is set, it SHALL use that path instead

#### Scenario: File-based storage fallback
- **WHEN** SQLite database initialization fails (e.g., permission issues, read-only filesystem)
- **THEN** the system SHALL automatically fall back to file-based storage
- **AND** it SHALL continue to operate using encrypted JSON files
- **AND** it SHALL log a warning indicating the fallback was used
- **AND** it SHALL maintain the same API interface regardless of storage backend

#### Scenario: Storage backend configuration
- **WHEN** a storage backend is explicitly configured via environment variable or configuration
- **THEN** the system SHALL use the specified backend (SQLite or file-based)
- **AND** if the specified backend fails to initialize, it SHALL fall back to the alternative backend
- **AND** it SHALL support configuration via `WORKFLOW_SECRETS_STORAGE_BACKEND` environment variable

#### Scenario: Storage path configuration
- **WHEN** the secrets system initializes storage
- **THEN** it SHALL default to creating storage in a directory relative to process.cwd() (code execution folder)
- **AND** it SHALL support override via `WORKFLOW_SECRETS_STORAGE_PATH` environment variable
- **AND** if `WORKFLOW_SECRETS_STORAGE_PATH` is set, it SHALL use that absolute or relative path
- **AND** relative paths SHALL be resolved relative to process.cwd()
- **AND** it SHALL create the storage directory if it does not exist

### Requirement: Secret Types
The system SHALL support multiple secret types with type-specific fields and validation.

#### Scenario: API Key secret type
- **WHEN** an API Key secret is created
- **THEN** it SHALL require a "value" field containing the API key
- **AND** it SHALL support optional metadata fields (description, tags)
- **AND** it SHALL validate that the value field is present and non-empty

#### Scenario: Basic Auth secret type
- **WHEN** a Basic Auth secret is created
- **THEN** it SHALL require "username" and "password" fields
- **AND** it SHALL validate that both fields are present and non-empty
- **AND** it SHALL store both fields securely

#### Scenario: Bearer Token secret type
- **WHEN** a Bearer Token secret is created
- **THEN** it SHALL require a "token" field containing the bearer token
- **AND** it SHALL support optional "expiresAt" field for token expiration
- **AND** it SHALL validate that the token field is present and non-empty

#### Scenario: OAuth secret type
- **WHEN** an OAuth secret is created
- **THEN** it SHALL require "clientId" and "clientSecret" fields
- **AND** it SHALL support optional fields (accessToken, refreshToken, tokenUrl, scopes)
- **AND** it SHALL validate required fields are present

#### Scenario: Custom secret type
- **WHEN** a Custom secret is created
- **THEN** it SHALL accept arbitrary key-value pairs
- **AND** it SHALL validate that at least one field is provided
- **AND** it SHALL store all fields securely

### Requirement: Secret References
The system SHALL support referencing secrets in node configurations using a reference syntax.

#### Scenario: Reference secret in node configuration
- **WHEN** a node configuration contains a secret reference in the format `{{secrets.secretName.fieldName}}`
- **THEN** the system SHALL parse the reference
- **AND** it SHALL resolve the secret during node execution
- **AND** it SHALL replace the reference with the decrypted field value
- **AND** if the secret or field does not exist, it SHALL handle the error appropriately

#### Scenario: Reference secret with nested fields
- **WHEN** a node configuration references a secret field like `{{secrets.basicAuth.username}}`
- **THEN** the system SHALL resolve the secret
- **AND** it SHALL extract the specific field value
- **AND** it SHALL replace the reference with the field value

#### Scenario: Multiple secret references
- **WHEN** a node configuration contains multiple secret references
- **THEN** the system SHALL resolve all references
- **AND** it SHALL replace each reference with the appropriate decrypted value

#### Scenario: Invalid secret reference
- **WHEN** a node configuration contains an invalid secret reference format
- **THEN** the system SHALL detect the invalid format
- **AND** it SHALL reject the configuration with a clear error message

### Requirement: Secret Resolution
The system SHALL resolve secret references during node execution and provide decrypted values to nodes.

#### Scenario: Resolve secret during execution
- **WHEN** a node with secret references is executed
- **THEN** the system SHALL resolve all secret references before node execution
- **AND** it SHALL provide decrypted values to the node
- **AND** it SHALL cache resolved secrets for the duration of workflow execution

#### Scenario: Missing secret error
- **WHEN** a secret reference points to a non-existent secret
- **THEN** the system SHALL detect the missing secret
- **AND** it SHALL return an error indicating the secret is not found
- **AND** it SHALL prevent node execution

#### Scenario: Missing field error
- **WHEN** a secret reference points to a field that does not exist in the secret
- **THEN** the system SHALL detect the missing field
- **AND** it SHALL return an error indicating the field is not found
- **AND** it SHALL prevent node execution

### Requirement: Secret Sharing
The system SHALL allow secrets to be shared across multiple nodes and workflows.

#### Scenario: Share secret across nodes
- **WHEN** multiple nodes reference the same secret
- **THEN** each node SHALL resolve the secret independently
- **AND** all nodes SHALL receive the same decrypted values
- **AND** secret resolution SHALL be efficient (cached during execution)

#### Scenario: Share secret across workflows
- **WHEN** multiple workflows reference the same secret
- **THEN** each workflow SHALL be able to access the secret
- **AND** secrets SHALL be accessible across workflow boundaries

### Requirement: External Secret Providers
The system SHALL support integration with external secret management systems.

#### Scenario: Configure external provider
- **WHEN** an external secret provider (e.g., HashiCorp Vault) is configured
- **THEN** the system SHALL register the provider
- **AND** it SHALL use the provider to resolve secrets when available
- **AND** it SHALL fall back to local storage if the provider is unavailable

#### Scenario: Resolve secret from external provider
- **WHEN** a secret reference is resolved
- **AND** the secret exists in an external provider
- **THEN** the system SHALL query the external provider
- **AND** it SHALL retrieve and decrypt the secret
- **AND** it SHALL return the secret value

#### Scenario: External provider failure
- **WHEN** an external secret provider fails or is unavailable
- **THEN** the system SHALL fall back to local secret storage if available
- **AND** if no fallback is available, it SHALL return an appropriate error

### Requirement: Secret Security
The system SHALL implement security measures to protect secrets.

#### Scenario: Encryption at rest
- **WHEN** a secret is stored
- **THEN** it SHALL be encrypted using AES-256-GCM
- **AND** the encryption key SHALL NOT be stored with the secrets
- **AND** the master key SHALL be provided via environment variable or secure configuration

#### Scenario: Secure file permissions
- **WHEN** secrets are stored in files (file-based backend)
- **THEN** the files SHALL have restricted permissions (readable/writable only by the process owner)
- **AND** the files SHALL NOT be world-readable

#### Scenario: Secure database permissions
- **WHEN** secrets are stored in SQLite database
- **THEN** the database file SHALL have restricted permissions (readable/writable only by the process owner)
- **AND** the database file SHALL NOT be world-readable
- **AND** the database SHALL use encryption at the application level (AES-256-GCM) for all secret values

#### Scenario: Secret not in exports
- **WHEN** a workflow is exported
- **THEN** secret references SHALL be included (as references)
- **AND** decrypted secret values SHALL NOT be included
- **AND** secrets SHALL remain environment-specific

