## ADDED Requirements

### Requirement: HTTP Request Node
The system SHALL provide an HTTP Request node that executes HTTP requests to external servers and returns the response data. The node SHALL support all standard HTTP methods, custom headers, query parameters, request bodies, authentication, and timeout configuration.

#### Scenario: Execute GET request with query parameters
- **WHEN** an HTTP Request node is configured with method "GET", a URL, and query parameters
- **THEN** it SHALL execute a GET request to the specified URL with query parameters
- **AND** it SHALL return the response status code, headers, and body through the output port
- **AND** it SHALL parse JSON response bodies automatically when Content-Type is application/json

#### Scenario: Execute POST request with JSON body
- **WHEN** an HTTP Request node is configured with method "POST", a URL, and a JSON request body
- **THEN** it SHALL execute a POST request to the specified URL with the JSON body
- **AND** it SHALL set the Content-Type header to application/json
- **AND** it SHALL return the response through the output port

#### Scenario: Execute request with custom headers
- **WHEN** an HTTP Request node is configured with custom headers
- **THEN** it SHALL include all custom headers in the HTTP request
- **AND** it SHALL merge custom headers with default headers (custom headers take precedence)

#### Scenario: Execute request with Basic Authentication
- **WHEN** an HTTP Request node is configured with Basic Authentication (username and password)
- **THEN** it SHALL generate an Authorization header with Basic auth credentials
- **AND** it SHALL include the Authorization header in the request

#### Scenario: Execute request with Bearer Token authentication
- **WHEN** an HTTP Request node is configured with Bearer Token authentication
- **THEN** it SHALL generate an Authorization header with Bearer token
- **AND** it SHALL include the Authorization header in the request

#### Scenario: Handle request timeout
- **WHEN** an HTTP Request node is configured with a timeout value
- **AND** the request takes longer than the timeout
- **THEN** it SHALL cancel the request
- **AND** it SHALL return a timeout error through the error output port

#### Scenario: Handle network errors
- **WHEN** an HTTP Request node executes a request
- **AND** a network error occurs (connection refused, DNS failure, etc.)
- **THEN** it SHALL catch the error
- **AND** it SHALL return error details through the error output port
- **AND** it SHALL NOT throw an exception that stops workflow execution

#### Scenario: Handle HTTP error status codes
- **WHEN** an HTTP Request node executes a request
- **AND** the server returns an HTTP error status code (4xx or 5xx)
- **THEN** it SHALL return the response (including status code, headers, and body) through the output port
- **AND** it SHALL NOT treat error status codes as exceptions (allow workflow to handle them)

#### Scenario: Use dynamic configuration from input data
- **WHEN** an HTTP Request node receives input data containing URL, headers, or body
- **THEN** it SHALL use input data values when provided
- **AND** it SHALL merge input data with static configuration (input data takes precedence)
- **AND** it SHALL support partial input data (only URL, only headers, etc.)

#### Scenario: Support all standard HTTP methods
- **WHEN** an HTTP Request node is configured with any standard HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- **THEN** it SHALL execute the request using the specified method
- **AND** it SHALL handle method-specific requirements (e.g., request body for POST, PUT, PATCH)

#### Scenario: Parse response based on Content-Type
- **WHEN** an HTTP Request node receives a response
- **AND** the response has a Content-Type header
- **THEN** it SHALL parse the response body according to the Content-Type
- **AND** it SHALL parse JSON when Content-Type is application/json
- **AND** it SHALL return text when Content-Type is text/*
- **AND** it SHALL return raw body for other content types

#### Scenario: Validate configuration
- **WHEN** an HTTP Request node is configured
- **THEN** it SHALL validate that the HTTP method is valid
- **AND** it SHALL validate that the URL is present and well-formed
- **AND** it SHALL validate that headers are in key-value format
- **AND** it SHALL validate that timeout is a positive number
- **AND** if validation fails, it SHALL reject the configuration with a clear error message

#### Scenario: Output response data structure
- **WHEN** an HTTP Request node successfully executes a request
- **THEN** it SHALL output response data through the output port
- **AND** the output SHALL include status code, headers, body, and request metadata (URL, method, timestamp)
- **AND** the output SHALL be in a structured format (DataRecord)

#### Scenario: Output error data structure
- **WHEN** an HTTP Request node encounters an error
- **THEN** it SHALL output error details through the error output port
- **AND** the error output SHALL include error type, error message, and request details (URL, method)
- **AND** the error output SHALL be in a structured format (DataRecord)

