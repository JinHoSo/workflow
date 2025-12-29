# Change: Add HTTP Request Node

## Why
Users need the ability to make HTTP requests to external servers and APIs from within workflows. This enables integration with REST APIs, webhooks, and other HTTP-based services. The HTTP request node must support all essential HTTP features including different HTTP methods, custom headers, query parameters, request bodies, authentication, and proper response handling.

## What Changes
- **ADDED**: HTTP Request node type that extends WorkflowNodeBase
- **ADDED**: Support for all standard HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- **ADDED**: URL configuration with support for dynamic values from input data
- **ADDED**: Custom headers configuration
- **ADDED**: Query parameters configuration
- **ADDED**: Request body configuration for methods that support it (POST, PUT, PATCH)
- **ADDED**: Authentication support (Basic Auth, Bearer Token, Custom Headers)
- **ADDED**: Timeout configuration
- **ADDED**: Response handling (status code, headers, body)
- **ADDED**: Error handling for network failures, timeouts, and HTTP error status codes

## Impact
- **Affected specs**:
  - `workflow-nodes` (new requirements for HTTP request node)
- **Affected code**:
  - `src/nodes/http-request-node.ts` - New HTTP request node implementation
  - `src/nodes/index.ts` - Export the new node
  - Node type registration for HTTP request node
  - HTTP client library dependency (e.g., native fetch or axios)

