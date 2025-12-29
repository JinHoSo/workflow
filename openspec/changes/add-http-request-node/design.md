## Context
The HTTP Request node enables workflows to interact with external HTTP-based APIs and services. This node must support all essential HTTP features while maintaining simplicity and type safety. The implementation needs to handle network operations, error scenarios, and various HTTP request/response formats.

**Key Challenge**: HTTP requests involve external dependencies, network failures, and various data formats. We need to balance feature completeness with simplicity and maintainability.

## Goals / Non-Goals

### Goals
- Support all standard HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- Support dynamic configuration from input data (URL, headers, body)
- Support common authentication methods (Basic Auth, Bearer Token)
- Handle errors gracefully with clear error messages
- Support timeout configuration
- Parse and format response data appropriately
- Maintain type safety (no `any` or `unknown` types)

### Non-Goals
- OAuth 2.0 flow implementation (can be handled via custom headers)
- WebSocket support (separate node type)
- HTTP/2 or HTTP/3 specific features (use standard HTTP/1.1)
- Request/response streaming (full request/response only)
- Cookie management (can be handled via custom headers)
- Proxy configuration (environment-level concern)

## Decisions

### Decision: Use Native Fetch API
**What**: Use Node.js native `fetch` API (available in Node.js 18+) for HTTP requests
**Why**:
- No external dependencies required
- Standard API, well-supported
- Built-in timeout support via AbortController
- TypeScript has built-in types for fetch
**Alternatives considered**:
- axios: Rejected - adds external dependency
- node-fetch: Rejected - native fetch is available
- http/https modules: Rejected - lower-level, more complex

### Decision: Support Dynamic Configuration from Input Data
**What**: Allow URL, headers, query parameters, and body to be provided via input data in addition to static configuration
**Why**: Enables dynamic requests based on previous node outputs, making workflows more flexible
**Alternatives considered**:
- Static configuration only: Rejected - too limiting for workflow use cases
- Input data only: Rejected - static configuration is simpler for common cases

### Decision: Two Output Ports (Success and Error)
**What**: Provide separate output ports for successful responses and errors
**Why**: Allows workflows to handle success and error cases differently
**Alternatives considered**:
- Single output port with error flag: Rejected - less clear separation
- Error throws exception: Rejected - breaks workflow execution flow

### Decision: JSON as Default Request/Response Format
**What**: Default to JSON for request body and response parsing
**Why**: Most common format for REST APIs
**Alternatives considered**:
- Text as default: Rejected - JSON is more common
- No default: Rejected - requires explicit format for every request

### Decision: Timeout Configuration
**What**: Support configurable timeout with reasonable default (e.g., 30 seconds)
**Why**: Prevents workflows from hanging indefinitely on slow or unresponsive servers
**Alternatives considered**:
- No timeout: Rejected - risk of hanging workflows
- Fixed timeout: Rejected - different APIs have different response times

### Decision: Error Output Includes Request Details
**What**: Error output includes the original request details (URL, method, headers) for debugging
**Why**: Helps users debug failed requests
**Alternatives considered**:
- Error message only: Rejected - insufficient for debugging
- Full request/response: Considered but rejected - too verbose

## Risks / Trade-offs

### Risk: Network Failures
**Mitigation**: Catch network errors, provide clear error messages, and output to error port instead of throwing

### Risk: Large Response Bodies
**Mitigation**: Use streaming for large responses if needed in future. For now, document size limits.

### Risk: Timeout Configuration
**Mitigation**: Provide reasonable default (30 seconds) and allow configuration. Document timeout behavior.

### Risk: Type Safety with Dynamic Configuration
**Mitigation**: Use type guards and validation to ensure configuration types are correct. Never use `any` or `unknown`.

### Trade-off: Request Body Format Support
**Decision**: Support JSON, form-data, and raw text initially
**Rationale**: Covers 90% of use cases. Can add more formats later if needed.

### Trade-off: Authentication Methods
**Decision**: Support Basic Auth and Bearer Token initially
**Rationale**: Most common methods. Custom headers can be used for other auth methods.

## Migration Plan
N/A - This is a new feature with no existing nodes to migrate.

## Open Questions
1. Should we support request/response compression? **Decision**: Defer - handle via headers if needed
2. Should we support redirect following? **Decision**: Yes - use fetch's default redirect behavior
3. Should we support custom CA certificates? **Decision**: Defer - environment-level concern
4. Should we support request retries? **Decision**: Defer - can be handled at workflow level with retry node
5. Should we support response caching? **Decision**: Defer - can be handled at workflow level

