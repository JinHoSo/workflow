## Context
The Secrets management system enables secure storage and reuse of authentication credentials across nodes and workflows. This system must balance security (encryption, access control) with usability (easy reference, sharing) and extensibility (external secret providers).

**Key Challenge**: Implementing secure credential storage while maintaining workflow portability and supporting various authentication patterns (API keys, OAuth, Basic Auth, custom headers).

## Goals / Non-Goals

### Goals
- Encrypt secrets at rest using industry-standard encryption
- Support multiple secret types (API Key, Basic Auth, Bearer Token, OAuth, Custom)
- Allow secrets to be referenced by name in node configurations
- Enable secret sharing across nodes and workflows
- Support external secret providers (HashiCorp Vault, AWS Secrets Manager, etc.)
- Maintain backward compatibility with inline credentials
- Provide secret validation and type checking
- Support secret metadata (name, description, tags)

### Non-Goals
- User authentication/authorization system (assumes external system handles this)
- Secret rotation automation (can be handled externally)
- Secret versioning (future enhancement)
- Secret audit logging (future enhancement)
- UI for secret management (deferred to UI phase)

## Decisions

### Decision: Secret Storage Architecture
**What**: Store secrets in encrypted format with a secret registry that maps secret names to encrypted values. Default to SQLite database storage with file-based storage as fallback option.
**Why**:
- Centralized management
- Encryption at rest
- Easy reference by name
- Can be extended with external providers
- SQLite provides better performance and query capabilities than file-based storage
- File-based fallback ensures operation in environments where SQLite is unavailable
**Alternatives considered**:
- Inline storage only: Rejected - security risk
- External-only: Rejected - need local fallback
- File-based only: Rejected - SQLite provides better performance and query capabilities
- PostgreSQL/MySQL: Considered but rejected - too heavy for default, can be added as external provider

### Decision: Encryption Method
**What**: Use AES-256-GCM for symmetric encryption with a master key
**Why**:
- Industry-standard encryption
- Authenticated encryption (GCM mode)
- Good performance
- Widely supported
**Alternatives considered**:
- AES-256-CBC: Rejected - no authentication
- RSA: Rejected - slower, asymmetric not needed
- ChaCha20-Poly1305: Considered but rejected - AES more standard

### Decision: Master Key Management
**What**: Master key provided via environment variable or configuration file (not stored in code)
**Why**:
- Simple initial implementation
- Standard practice
- Can be extended with key management services later
**Alternatives considered**:
- Hardware security module: Rejected - too complex for initial version
- Key derivation from user password: Rejected - workflow execution shouldn't require user interaction
- Cloud KMS: Considered but deferred - can be added as external provider

### Decision: Secret Reference Format
**What**: Use string reference format `{{secrets.secretName.fieldName}}` in node configurations
**Why**:
- Clear and explicit
- Supports field-level access (e.g., `{{secrets.apiKey.value}}` or `{{secrets.basicAuth.username}}`)
- Consistent with existing expression syntax patterns
- Easy to parse and validate
**Alternatives considered**:
- Object reference: Rejected - harder to validate
- Simple string name: Rejected - doesn't support field access
- JSON path: Considered but rejected - too complex

### Decision: Backward Compatibility
**What**: Support both inline credentials and secret references in node configurations
**Why**:
- Existing workflows continue to work
- Gradual migration path
- Flexibility for users
**Alternatives considered**:
- Secret references only: Rejected - breaking change
- Inline only: Rejected - doesn't solve security problem

### Decision: Secret Types
**What**: Support structured secret types (APIKey, BasicAuth, BearerToken, OAuth, Custom) with type-specific fields
**Why**:
- Type safety
- Validation
- Better UX (know what fields are available)
- Can extend with type-specific behavior
**Alternatives considered**:
- Generic key-value only: Rejected - no validation, no type safety
- Free-form JSON: Rejected - too flexible, hard to validate

### Decision: External Secret Provider Interface
**What**: Define a pluggable interface for external secret providers with adapter pattern
**Why**:
- Extensibility
- Can support multiple providers
- Testability (mock providers)
**Alternatives considered**:
- Hard-coded providers: Rejected - not extensible
- Single provider only: Rejected - need flexibility

### Decision: Secret Resolution Timing
**What**: Resolve secrets during node execution, not at configuration time
**Why**:
- Secrets may change between configuration and execution
- External providers may have different availability
- Allows dynamic secret selection
**Alternatives considered**:
- Configuration time: Rejected - secrets may be stale
- Workflow load time: Considered but rejected - execution time is more flexible

### Decision: BaseNode-Level Secret Resolution
**What**: Implement secret resolution in BaseNode as a common functionality available to all nodes
**Why**:
- All nodes can use secrets without individual implementation
- Consistent behavior across all node types
- Reduces code duplication
- Makes secret access a first-class feature
**Alternatives considered**:
- Node-specific implementation: Rejected - code duplication, inconsistent behavior
- Workflow-level resolution: Considered but rejected - nodes need direct access
- Optional mixin: Rejected - BaseNode is the right place for common functionality

## Risks / Trade-offs

### Risk: Master Key Compromise
**Mitigation**:
- Document secure key management practices
- Support key rotation (future enhancement)
- Consider external key management services

### Decision: Secret Storage Location
**What**: Store secrets in a directory relative to the code execution folder (process.cwd()), not in /tmp or user home directory
**Why**:
- Secrets should be co-located with the workflow execution context
- Avoids permission issues with system directories
- Makes secrets portable with the codebase
- Easier to manage in containerized environments
- Avoids conflicts with multiple instances running from different directories
**Alternatives considered**:
- User home directory (~/.workflow/secrets): Rejected - not portable, conflicts with multiple instances
- /tmp directory: Rejected - temporary, cleared on reboot, security concerns
- System config directory: Rejected - permission issues, not portable

### Risk: Secret Storage Location
**Mitigation**:
- Use secure file permissions for both SQLite database and file-based storage
- Store files relative to process.cwd() (code execution directory)
- Support environment variable override (WORKFLOW_SECRETS_STORAGE_PATH) for custom locations
- Support storage backend selection via configuration
- Document security best practices
- Provide automatic fallback to file-based storage if SQLite initialization fails

### Risk: Performance Impact
**Mitigation**:
- Cache decrypted secrets during workflow execution
- Use efficient encryption algorithms
- Lazy load secrets only when needed

### Risk: External Provider Failures
**Mitigation**:
- Support fallback to local storage
- Cache secrets with TTL
- Provide clear error messages

### Trade-off: Encryption Performance vs Security
**Decision**: Use AES-256-GCM (good balance)
**Rationale**: Strong security with acceptable performance

### Trade-off: Secret Storage Format
**Decision**: SQLite database with encrypted values as default, JSON file with encrypted values as fallback
**Rationale**: SQLite provides better performance, query capabilities, and atomic operations. File-based storage remains available as fallback for environments where SQLite cannot be used (e.g., read-only filesystems, permission constraints).

### Trade-off: Secret Sharing Scope
**Decision**: Share secrets across all workflows in the same environment
**Rationale**: Simple model, can add scoping later if needed

## Migration Plan
1. Implement secrets system alongside existing inline credentials
2. HTTP Request node supports both inline and secret references
3. Users can migrate gradually by creating secrets and updating node configurations
4. No breaking changes - existing workflows continue to work

## Open Questions
1. Should secrets be versioned? **Decision**: Defer - add versioning later if needed
2. Should secrets support expiration? **Decision**: Defer - can be handled by external providers
3. Should secrets support tags/labels? **Decision**: Defer - add metadata support later
4. Should secrets support access control? **Decision**: Defer - assume external auth system handles this
5. Should secrets be included in workflow exports? **Decision**: No - secrets should be environment-specific, not exported

