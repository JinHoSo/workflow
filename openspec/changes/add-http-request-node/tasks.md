## 1. Node Structure & Configuration
- [x] 1.1 Create HttpRequestNode class extending WorkflowNodeBase
- [x] 1.2 Define input port for optional request data (URL, headers, body from input)
- [x] 1.3 Define output port for response data (status, headers, body)
- [x] 1.4 Define output port for error data (when request fails)
- [x] 1.5 Define NodeConfiguration interface for HTTP request settings
- [x] 1.6 Support HTTP method configuration (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- [x] 1.7 Support URL configuration (static or from input data)
- [x] 1.8 Support headers configuration (static key-value pairs or from input data)
- [x] 1.9 Support query parameters configuration (static or from input data)
- [x] 1.10 Support request body configuration (for POST, PUT, PATCH methods)
- [x] 1.11 Support authentication configuration (Basic Auth, Bearer Token, Custom Headers)
- [x] 1.12 Support timeout configuration (default and custom)

## 2. HTTP Request Execution
- [x] 2.1 Implement process() method to execute HTTP requests
- [x] 2.2 Resolve URL from configuration or input data
- [x] 2.3 Merge headers from configuration and input data
- [x] 2.4 Build query string from query parameters
- [x] 2.5 Prepare request body (JSON, form-data, raw text, etc.)
- [x] 2.6 Apply authentication headers
- [x] 2.7 Execute HTTP request with timeout handling
- [x] 2.8 Handle response (status code, headers, body)
- [x] 2.9 Parse response body based on Content-Type header
- [x] 2.10 Format response data for output port

## 3. Error Handling
- [x] 3.1 Handle network errors (connection refused, DNS failure, etc.)
- [x] 3.2 Handle timeout errors
- [x] 3.3 Handle HTTP error status codes (4xx, 5xx)
- [x] 3.4 Handle invalid URL errors
- [x] 3.5 Handle invalid request body format errors
- [x] 3.6 Provide clear error messages in error output port
- [x] 3.7 Include error details (status code, error message, request details)

## 4. Configuration Validation
- [x] 4.1 Validate HTTP method is valid
- [x] 4.2 Validate URL is present and well-formed
- [x] 4.3 Validate headers format (key-value pairs)
- [x] 4.4 Validate query parameters format
- [x] 4.5 Validate request body format for methods that require it
- [x] 4.6 Validate authentication configuration
- [x] 4.7 Validate timeout is a positive number

## 5. Response Handling
- [x] 5.1 Extract response status code
- [x] 5.2 Extract response headers
- [x] 5.3 Parse response body (JSON, text, binary)
- [x] 5.4 Handle different Content-Type headers
- [x] 5.5 Format response data structure for output
- [x] 5.6 Include request metadata in response (URL, method, timestamp)

## 6. Node Type Registration
- [x] 6.1 Create NodeType implementation for HTTP request node
- [x] 6.2 Define NodeTypeMetadata (name: "http-request", displayName, description, version)
- [x] 6.3 Implement run() method that delegates to node.process()
- [x] 6.4 Register node type in node type registry
- [x] 6.5 Export node from nodes/index.ts

## 7. Testing
- [x] 7.1 Create unit tests for HTTP request node
- [x] 7.2 Test GET request with query parameters
- [x] 7.3 Test POST request with JSON body
- [x] 7.4 Test PUT request with form data
- [x] 7.5 Test DELETE request
- [x] 7.6 Test PATCH request
- [x] 7.7 Test with custom headers
- [x] 7.8 Test with Basic Authentication
- [x] 7.9 Test with Bearer Token authentication
- [x] 7.10 Test timeout handling
- [x] 7.11 Test error handling (network errors, HTTP errors)
- [x] 7.12 Test response parsing (JSON, text, binary)
- [x] 7.13 Test configuration validation
- [x] 7.14 Test URL resolution from input data
- [x] 7.15 Test headers/query/body resolution from input data
- [x] 7.16 Mock HTTP requests in tests (use nock or similar)

## 8. Documentation
- [x] 8.1 Add JSDoc comments to HttpRequestNode class
- [x] 8.2 Document configuration options
- [x] 8.3 Document input/output port data structures
- [x] 8.4 Document error handling behavior
- [x] 8.5 Add usage examples in comments

