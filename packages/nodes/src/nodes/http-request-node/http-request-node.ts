import { BaseNode } from "@workflow/core"
import type { NodeProperties, NodeConfiguration, DataRecord, NodeInput, NodeOutput, ExecutionContext } from "@workflow/interfaces"
import { LinkType } from "@workflow/interfaces"
import { httpRequestNodeSchema } from "./schema"

/**
 * HTTP methods supported by the HTTP Request node
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"

/**
 * Authentication type for HTTP requests
 */
export type AuthType = "none" | "basic" | "bearer" | "custom"

/**
 * Request body format
 */
export type BodyFormat = "json" | "form-data" | "text" | "raw"

/**
 * Configuration interface for HTTP Request node
 */
export interface HttpRequestNodeConfiguration extends NodeConfiguration {
  /** HTTP method to use (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS) */
  method?: HttpMethod
  /** Base URL for the request (can be overridden by input data) */
  url?: string
  /** Custom headers as key-value pairs (can be overridden by input data) */
  headers?: Record<string, string>
  /** Query parameters as key-value pairs (can be overridden by input data) */
  queryParameters?: Record<string, string>
  /** Request body (for POST, PUT, PATCH methods) */
  body?: string | DataRecord
  /** Request body format */
  bodyFormat?: BodyFormat
  /** Authentication type */
  authType?: AuthType
  /** Username for Basic Auth (supports secret references: {{secrets.secretName.username}}) */
  basicAuthUsername?: string
  /** Password for Basic Auth (supports secret references: {{secrets.secretName.password}}) */
  basicAuthPassword?: string
  /** Bearer token for Bearer Auth (supports secret references: {{secrets.secretName.token}}) */
  bearerToken?: string
  /** Custom auth headers (supports secret references in header values: {{secrets.secretName.fieldName}}) */
  customAuthHeaders?: Record<string, string>
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number
}

/**
 * Input data structure for HTTP Request node
 * Allows dynamic configuration from previous node outputs
 */
export interface HttpRequestInputData extends DataRecord {
  /** URL to override configured URL */
  url?: string
  /** Headers to merge with configured headers */
  headers?: Record<string, string> | DataRecord
  /** Query parameters to merge with configured query parameters */
  queryParameters?: Record<string, string> | DataRecord
  /** Request body to override configured body */
  body?: string | DataRecord
}

/**
 * Response data structure for HTTP Request node
 */
export interface HttpRequestResponseData extends DataRecord {
  /** HTTP status code */
  statusCode: number
  /** Response headers */
  headers: Record<string, string>
  /** Response body (parsed based on Content-Type) */
  body: string | DataRecord | null
  /** Request metadata */
  request: {
    /** Request URL */
    url: string
    /** HTTP method */
    method: HttpMethod
    /** Request timestamp */
    timestamp: number
  }
}

/**
 * Error data structure for HTTP Request node
 */
export interface HttpRequestErrorData extends DataRecord {
  /** Error type */
  errorType: string
  /** Error message */
  message: string
  /** Request details */
  request: {
    /** Request URL */
    url: string
    /** HTTP method */
    method: HttpMethod
    /** Request timestamp */
    timestamp: number
  }
  /** HTTP status code (if available) */
  statusCode?: number
}

/**
 * Node that executes HTTP requests to external servers
 * Supports all standard HTTP methods, authentication, custom headers, and error handling
 *
 * Configuration:
 * - method: HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
 * - url: Base URL for the request
 * - headers: Custom headers as key-value pairs
 * - queryParameters: Query parameters as key-value pairs
 * - body: Request body (for POST, PUT, PATCH)
 * - bodyFormat: Request body format (json, form-data, text, raw)
 * - authType: Authentication type (none, basic, bearer, custom)
 * - timeout: Request timeout in milliseconds (default: 30000)
 *
 * Input:
 * - input port: Optional request data (url, headers, queryParameters, body)
 *
 * Output:
 * - output port: Response data (statusCode, headers, body, request metadata)
 * - error port: Error data (errorType, message, request details, statusCode)
 */
export class HttpRequestNode extends BaseNode {
  /** Default timeout in milliseconds */
  private static readonly DEFAULT_TIMEOUT = 30000

  /**
   * Creates a new HttpRequestNode
   * @param properties - Node properties
   */
  constructor(properties: NodeProperties) {
    super(properties)
    this.configurationSchema = httpRequestNodeSchema
    this.addInput("input", "data", LinkType.Standard)
    this.addOutput("output", "data", LinkType.Standard)
    this.addOutput("error", "data", LinkType.Standard)
  }

  /**
   * Validates the HTTP Request node configuration
   * @param config - Configuration to validate
   * @returns true if configuration is valid
   */
  protected validateConfig(config: NodeConfiguration): boolean {
    const httpConfig = config as HttpRequestNodeConfiguration

    // Validate HTTP method
    if (httpConfig.method) {
      const validMethods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
      if (!validMethods.includes(httpConfig.method)) {
        throw new Error(`Invalid HTTP method: ${httpConfig.method}. Must be one of: ${validMethods.join(", ")}`)
      }
    }

    // Validate URL if provided (will also check in process if not provided)
    if (httpConfig.url && typeof httpConfig.url !== "string") {
      throw new Error("URL must be a string")
    }

    // Validate headers format
    if (httpConfig.headers && typeof httpConfig.headers !== "object") {
      throw new Error("Headers must be an object with string keys and string values")
    }

    // Validate query parameters format
    if (httpConfig.queryParameters && typeof httpConfig.queryParameters !== "object") {
      throw new Error("Query parameters must be an object with string keys and string values")
    }

    // Validate timeout
    if (httpConfig.timeout !== undefined) {
      if (typeof httpConfig.timeout !== "number" || httpConfig.timeout <= 0) {
        throw new Error("Timeout must be a positive number")
      }
    }

    // Validate authentication configuration
    if (httpConfig.authType === "basic") {
      if (!httpConfig.basicAuthUsername || !httpConfig.basicAuthPassword) {
        throw new Error("Basic Auth requires both username and password")
      }
    } else if (httpConfig.authType === "bearer") {
      if (!httpConfig.bearerToken) {
        throw new Error("Bearer Auth requires a token")
      }
    }

    return true
  }

  /**
   * Executes the HTTP request
   * @param context - Execution context containing input data and state
   * @returns Promise that resolves to output data (port name based)
   */
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const config = this.config as HttpRequestNodeConfiguration

    try {
      // Resolve request parameters from config and input data
      const requestParams = this.resolveRequestParameters(config, context.input)

      // Validate URL is present
      if (!requestParams.url) {
        throw new Error("URL is required. Provide it in configuration or input data.")
      }

      // Execute HTTP request
      const response = await this.executeRequest(requestParams)

      // Validate response object exists
      if (!response) {
        throw new Error("HTTP request failed: response is undefined")
      }

      // Format response data
      const responseData: HttpRequestResponseData = {
        statusCode: response.status,
        headers: this.formatHeaders(response.headers),
        body: await this.parseResponseBody(response),
        request: {
          url: requestParams.url,
          method: requestParams.method,
          timestamp: Date.now(),
        },
      }

      console.log(`[HttpRequestNode] ${this.properties.name} request successful:`, response.status, requestParams.url)
      return { output: responseData }
    } catch (error) {
      // Handle errors and output to error port
      console.error(`[HttpRequestNode] ${this.properties.name} request failed:`, error)
      const errorData = this.formatError(error, config)
      return { error: errorData }
    }
  }

  /**
   * Resolves request parameters from configuration and input data
   * Input data takes precedence over configuration
   * @param config - Node configuration
   * @param input - Input data from connected nodes
   * @returns Resolved request parameters
   */
  private resolveRequestParameters(
    config: HttpRequestNodeConfiguration,
    input: NodeInput,
  ): {
    method: HttpMethod
    url: string
    headers: Record<string, string>
    queryParameters: Record<string, string>
    body?: string
    timeout: number
  } {
    // Get input data (first item from input port)
    const inputData = this.getInputData(input)

    // Resolve method (from config, default to GET)
    const method = (config.method || "GET") as HttpMethod

    // Resolve URL (input data takes precedence)
    const url = (inputData?.url as string) || config.url || ""

    // Resolve headers (merge config and input data, input takes precedence)
    const configHeaders = this.normalizeHeaders(config.headers || {})
    const inputHeaders = inputData?.headers
      ? this.normalizeHeaders(inputData.headers as Record<string, string> | DataRecord)
      : {}
    const headers = { ...configHeaders, ...inputHeaders }

    // Resolve query parameters (merge config and input data, input takes precedence)
    const configQuery = this.normalizeQueryParameters(config.queryParameters || {})
    const inputQuery = inputData?.queryParameters
      ? this.normalizeQueryParameters(inputData.queryParameters as Record<string, string> | DataRecord)
      : {}
    const queryParameters = { ...configQuery, ...inputQuery }

    // Resolve body (input data takes precedence)
    const body = inputData?.body !== undefined ? inputData.body : config.body

    // Resolve timeout
    const timeout = config.timeout || HttpRequestNode.DEFAULT_TIMEOUT

    return {
      method,
      url,
      headers,
      queryParameters,
      body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
      timeout,
    }
  }

  /**
   * Gets input data from the input port
   * @param input - Input data from connected nodes
   * @returns First input data item or undefined
   */
  private getInputData(input: NodeInput): HttpRequestInputData | undefined {
    const inputPortData = input.input
    if (!inputPortData) {
      return undefined
    }
    const inputArray = Array.isArray(inputPortData) ? inputPortData : [inputPortData]
    return inputArray[0] as HttpRequestInputData | undefined
  }

  /**
   * Normalizes headers to Record<string, string>
   * @param headers - Headers as object or DataRecord
   * @returns Normalized headers
   */
  private normalizeHeaders(headers: Record<string, string> | DataRecord): Record<string, string> {
    const normalized: Record<string, string> = {}
    for (const key in headers) {
      const value = headers[key]
      if (value !== null && value !== undefined) {
        normalized[key] = String(value)
      }
    }
    return normalized
  }

  /**
   * Normalizes query parameters to Record<string, string>
   * @param queryParams - Query parameters as object or DataRecord
   * @returns Normalized query parameters
   */
  private normalizeQueryParameters(queryParams: Record<string, string> | DataRecord): Record<string, string> {
    const normalized: Record<string, string> = {}
    for (const key in queryParams) {
      const value = queryParams[key]
      if (value !== null && value !== undefined) {
        normalized[key] = String(value)
      }
    }
    return normalized
  }

  /**
   * Applies authentication headers based on configuration
   * @param headers - Existing headers
   * @param config - Node configuration
   * @returns Headers with authentication applied
   */
  private applyAuthentication(headers: Record<string, string>, config: HttpRequestNodeConfiguration): Record<string, string> {
    const authType = config.authType || "none"

    if (authType === "basic") {
      const username = config.basicAuthUsername || ""
      const password = config.basicAuthPassword || ""
      const credentials = Buffer.from(`${username}:${password}`).toString("base64")
      headers["Authorization"] = `Basic ${credentials}`
    } else if (authType === "bearer") {
      const token = config.bearerToken || ""
      headers["Authorization"] = `Bearer ${token}`
    } else if (authType === "custom" && config.customAuthHeaders) {
      Object.assign(headers, this.normalizeHeaders(config.customAuthHeaders))
    }

    return headers
  }

  /**
   * Builds query string from query parameters
   * @param queryParameters - Query parameters
   * @returns Query string (without leading ?)
   */
  private buildQueryString(queryParameters: Record<string, string>): string {
    const params = new URLSearchParams()
    for (const key in queryParameters) {
      params.append(key, queryParameters[key])
    }
    return params.toString()
  }

  /**
   * Prepares request body based on format
   * @param body - Request body
   * @param bodyFormat - Body format
   * @param headers - Request headers (may be modified)
   * @returns Prepared body string
   */
  private prepareRequestBody(
    body: string | undefined,
    bodyFormat: BodyFormat | undefined,
    headers: Record<string, string>,
  ): string | undefined {
    if (!body) {
      return undefined
    }

    const format = bodyFormat || "json"

    if (format === "json") {
      // Try to parse as JSON to validate, then stringify
      try {
        const parsed = typeof body === "string" ? JSON.parse(body) : body
        headers["Content-Type"] = headers["Content-Type"] || "application/json"
        return JSON.stringify(parsed)
      } catch {
        // If not valid JSON, treat as string
        headers["Content-Type"] = headers["Content-Type"] || "application/json"
        return typeof body === "string" ? body : JSON.stringify(body)
      }
    } else if (format === "form-data") {
      headers["Content-Type"] = headers["Content-Type"] || "application/x-www-form-urlencoded"
      // For form-data, body should be URL-encoded string
      return typeof body === "string" ? body : new URLSearchParams(body as Record<string, string>).toString()
    } else if (format === "text") {
      headers["Content-Type"] = headers["Content-Type"] || "text/plain"
      return typeof body === "string" ? body : String(body)
    } else {
      // raw format - use as-is
      return typeof body === "string" ? body : JSON.stringify(body)
    }
  }

  /**
   * Executes the HTTP request with timeout handling
   * @param params - Request parameters
   * @returns Promise that resolves to Response object
   */
  private async executeRequest(params: {
    method: HttpMethod
    url: string
    headers: Record<string, string>
    queryParameters: Record<string, string>
    body?: string
    timeout: number
  }): Promise<Response> {
    const config = this.config as HttpRequestNodeConfiguration

    // Build full URL with query parameters
    const queryString = this.buildQueryString(params.queryParameters)
    const fullUrl = queryString ? `${params.url}?${queryString}` : params.url

    // Apply authentication
    const headers = this.applyAuthentication({ ...params.headers }, config)

    // Prepare request body
    const body = this.prepareRequestBody(params.body, config.bodyFormat, headers)

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), params.timeout)

    try {
      // Execute fetch request
      const response = await fetch(fullUrl, {
        method: params.method,
        headers,
        body: body || undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Validate response object
      if (!response) {
        throw new Error("Fetch returned undefined response")
      }

      if (typeof response.status !== "number") {
        throw new Error(`Invalid response object: missing status property. Response type: ${typeof response}`)
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${params.timeout}ms`)
      }
      throw error
    }
  }

  /**
   * Parses response body based on Content-Type header
   * @param response - Fetch Response object
   * @returns Parsed response body
   */
  private async parseResponseBody(response: Response): Promise<string | DataRecord | null> {
    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      // Read text first, then try to parse as JSON
      // This allows us to return the text if JSON parsing fails
      const text = await response.text()
      if (!text) {
        return null
      }
      try {
        return JSON.parse(text) as DataRecord
      } catch (parseError) {
        // If JSON parsing fails, return as text
        console.warn(
          `[HttpRequestNode] Failed to parse JSON response, returning as text: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        )
        return text
      }
    } else if (contentType.startsWith("text/")) {
      return await response.text()
    } else {
      // For binary or other content types, return as base64 encoded string
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      return buffer.toString("base64")
    }
  }

  /**
   * Formats response headers to Record<string, string>
   * @param headers - Headers from Response object
   * @returns Formatted headers
   */
  private formatHeaders(headers: Headers): Record<string, string> {
    const formatted: Record<string, string> = {}
    headers.forEach((value, key) => {
      formatted[key] = value
    })
    return formatted
  }

  /**
   * Formats error into error data structure
   * @param error - Error object
   * @param config - Node configuration
   * @returns Formatted error data
   */
  private formatError(error: unknown, config: HttpRequestNodeConfiguration): HttpRequestErrorData {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const method = (config.method || "GET") as HttpMethod
    const url = config.url || ""

    // Determine error type
    let errorType = "UnknownError"
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        errorType = "TimeoutError"
      } else if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
        errorType = "NetworkError"
      } else if (error.message.includes("Invalid URL")) {
        errorType = "InvalidURLError"
      } else {
        errorType = "RequestError"
      }
    }

    return {
      errorType,
      message: errorMessage,
      request: {
        url,
        method,
        timestamp: Date.now(),
      },
    }
  }
}

