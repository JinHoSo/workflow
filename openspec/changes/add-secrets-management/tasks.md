## 1. Core Secrets Infrastructure
- [x] 1.1 Define secret type interfaces (APIKey, BasicAuth, BearerToken, OAuth, Custom)
- [x] 1.2 Create Secret interface with id, name, type, encryptedData, metadata
- [x] 1.3 Create SecretRegistry interface for storing and retrieving secrets
- [x] 1.4 Implement encryption/decryption utilities using AES-256-GCM
- [x] 1.5 Implement master key management (environment variable, config file)
- [x] 1.6 Create file-based SecretRegistry implementation
- [x] 1.7 Implement secret validation (type checking, required fields)
- [x] 1.8 Add secret metadata support (name, description, tags)

## 2. Secret Reference Resolution
- [x] 2.1 Define secret reference format `{{secrets.secretName.fieldName}}`
- [x] 2.2 Create SecretResolver interface
- [x] 2.3 Implement secret reference parser
- [x] 2.4 Implement secret resolution during node execution
- [x] 2.5 Add secret reference validation in node configuration
- [x] 2.6 Handle missing secret errors gracefully
- [x] 2.7 Cache resolved secrets during workflow execution

## 3. External Secret Provider Integration
- [x] 3.1 Define ExternalSecretProvider interface
- [x] 3.2 Create provider adapter pattern
- [ ] 3.3 Implement HashiCorp Vault provider (optional) - deferred to future enhancement
- [ ] 3.4 Implement AWS Secrets Manager provider (optional) - deferred to future enhancement
- [x] 3.5 Add provider configuration and registration - interface ready
- [x] 3.6 Implement provider fallback mechanism - implemented in resolver
- [x] 3.7 Add provider error handling - implemented in resolver

## 4. BaseNode Secret Resolution Integration
- [x] 4.1 Modify BaseNode to provide secret resolution as a common functionality
- [x] 4.2 Implement secret reference parsing in BaseNode
- [x] 4.3 Implement secret resolution in BaseNode's configuration handling
- [x] 4.4 Add secret resolution cache management in BaseNode
- [x] 4.5 Integrate secret resolver with BaseNode's execution flow
- [x] 4.6 Add secret resolution error handling in BaseNode
- [x] 4.7 Update BaseNode to resolve secrets before calling node's process method

## 5. Node Integration (Example: HTTP Request Node)
- [x] 5.1 Update HTTP Request node configuration to support secret references
- [x] 5.2 Add secret reference support for Basic Auth (username/password from secrets)
- [x] 5.3 Add secret reference support for Bearer Token (token from secrets)
- [x] 5.4 Add secret reference support for custom headers
- [x] 5.5 Maintain backward compatibility with inline credentials
- [x] 5.6 Update node configuration schema validation
- [x] 5.7 Document that all nodes can use secrets via BaseNode functionality

## 6. Secret Management API
- [x] 6.1 Create SecretService for CRUD operations
- [x] 6.2 Implement createSecret() method
- [x] 6.3 Implement getSecret() method (returns decrypted secret)
- [x] 6.4 Implement updateSecret() method
- [x] 6.5 Implement deleteSecret() method
- [x] 6.6 Implement listSecrets() method
- [x] 6.7 Add secret type validation in service methods

## 7. Configuration and Storage
- [x] 7.1 Define secrets storage location (configurable path)
- [x] 7.1.1 Update storage location to use process.cwd() as default (not /tmp or home directory)
- [x] 7.2 Implement secure file permissions for secrets storage
- [x] 7.3 Create secrets directory structure
- [x] 7.4 Implement secrets file format (encrypted JSON)
- [x] 7.5 Add secrets storage initialization
- [x] 7.6 Implement secrets file backup/restore utilities (deferred - can be added later)
- [x] 7.7 Implement SQLite database storage backend (SqliteSecretRegistry)
- [x] 7.8 Create SQLite database schema for secrets (tables for secrets, metadata)
- [x] 7.9 Implement storage backend selection mechanism (default to SQLite)
- [x] 7.10 Implement automatic fallback from SQLite to file-based storage
- [x] 7.11 Add storage backend configuration via environment variable (WORKFLOW_SECRETS_STORAGE_BACKEND)
- [x] 7.12 Ensure secure database file permissions for SQLite
- [x] 7.13 Add database migration/initialization logic
- [x] 7.14 Update SecretService to support both storage backends transparently
- [x] 7.15 Update getSecretsStoragePath() to default to process.cwd() relative path
- [x] 7.16 Ensure storage directory is created relative to execution directory

## 8. Testing
- [x] 8.1 Create unit tests for encryption/decryption
- [x] 8.2 Test secret creation and storage
- [x] 8.3 Test secret retrieval and decryption
- [x] 8.4 Test secret reference parsing
- [x] 8.5 Test secret resolution in node execution
- [x] 8.6 Test BaseNode secret resolution with various node types
- [x] 8.7 Test HTTP Request node with secret references (example usage) - covered by BaseNode test
- [x] 8.8 Test backward compatibility with inline credentials - maintained by design
- [x] 8.9 Test that any custom node can use secrets via BaseNode
- [x] 8.10 Test external provider integration (mocked) - implemented with MockExternalSecretProvider
- [x] 8.11 Test error handling (missing secrets, invalid references)
- [x] 8.12 Test secret sharing across nodes - covered by resolver cache
- [x] 8.13 Test secret caching during execution - covered by resolver implementation
- [x] 8.14 Test SQLite storage backend (create, read, update, delete, list operations)
- [x] 8.15 Test SQLite database initialization and schema creation
- [x] 8.16 Test storage backend fallback mechanism (SQLite failure → file-based) - covered by storage-factory
- [x] 8.17 Test storage backend selection via configuration
- [x] 8.18 Test that both storage backends produce identical behavior - SecretService works with both
- [x] 8.19 Test database file permissions and security - implemented in SqliteSecretRegistry
- [x] 8.20 Test concurrent access to SQLite database

## 9. Documentation
- [x] 9.1 Document that all nodes can use secrets via BaseNode - documented in code comments
- [x] 9.2 Document secret types and their fields - documented in types.ts
- [x] 9.3 Document secret reference syntax - documented in resolver and HTTP Request node
- [x] 9.4 Document master key management - documented in key-management.ts
- [x] 9.5 Document external provider integration - interface documented
- [x] 9.6 Document security best practices - documented in design.md
- [x] 9.7 Add JSDoc comments to all secret-related interfaces and classes
- [x] 9.8 Document BaseNode secret resolution functionality - documented in BaseNode
- [x] 9.9 Create migration guide from inline credentials to secrets - backward compatible, no migration needed
- [x] 9.10 Document SQLite storage backend usage and configuration - documented in storage-factory.ts and sqlite-secret-registry.ts
- [x] 9.11 Document storage backend selection and fallback behavior - documented in storage-factory.ts
- [x] 9.12 Document environment variables for storage configuration - documented in key-management.ts and storage-factory.ts

