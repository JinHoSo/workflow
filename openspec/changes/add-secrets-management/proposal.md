# Change: Add Secrets Management System

## Why
Currently, nodes like HTTP Request store authentication credentials (API keys, Basic Auth, Bearer tokens) directly in node configuration. This approach has several limitations:
- Credentials are stored in plain text in workflow definitions
- Credentials cannot be shared across multiple nodes or workflows
- No centralized management or rotation of credentials
- Security risk when workflows are exported or shared
- No integration with external secret management systems (Vault, AWS Secrets Manager, etc.)

A Secrets management system similar to n8n's credentials feature will enable secure, reusable credential storage with encryption, sharing capabilities, and external secret integration.

## What Changes
- **ADDED**: Secrets management system with encrypted storage
- **ADDED**: Secret types (API Key, Basic Auth, Bearer Token, OAuth, Custom)
- **ADDED**: Secret registry for storing and retrieving secrets
- **ADDED**: Secret reference mechanism in node configurations
- **ADDED**: Secret sharing across nodes and workflows
- **ADDED**: External secret provider integration (Vault, AWS Secrets Manager, etc.)
- **MODIFIED**: BaseNode to provide secret resolution functionality for all nodes
- **MODIFIED**: HTTP Request node to support secret references in addition to inline credentials (as an example usage)
- **MODIFIED**: Node configuration schema to support secret references

## Impact
- **Affected specs**:
  - `workflow-secrets` (new capability for secrets management)
  - `workflow-nodes` (modified to support secret references)
- **Affected code**:
  - `src/secrets/` - New secrets management module
  - `src/core/base-node.ts` - Modified to provide secret resolution functionality for all nodes
  - `src/nodes/http-request-node.ts` - Modified to support secret references (example usage)
  - `src/interfaces/` - New interfaces for secrets
  - Encryption library dependency for secure storage

