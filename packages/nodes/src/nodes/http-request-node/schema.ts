import type { JsonSchema } from "@workflow/interfaces"

/**
 * JSON Schema for HttpRequestNode configuration
 */
export const httpRequestNodeSchema: JsonSchema = {
  type: "object",
  properties: {
    method: {
      type: "string",
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
      description: "HTTP method to use",
    },
    url: {
      type: "string",
      format: "uri",
      description: "Base URL for the request",
    },
    headers: {
      type: "object",
      additionalProperties: {
        type: "string",
      },
      description: "Custom headers as key-value pairs",
    },
    queryParameters: {
      type: "object",
      additionalProperties: {
        type: "string",
      },
      description: "Query parameters as key-value pairs",
    },
    body: {
      description: "Request body (for POST, PUT, PATCH methods)",
    },
    bodyFormat: {
      type: "string",
      enum: ["json", "form-data", "text", "raw"],
      description: "Request body format",
    },
    authType: {
      type: "string",
      enum: ["none", "basic", "bearer", "custom"],
      description: "Authentication type",
    },
    basicAuthUsername: {
      type: "string",
      description: "Username for Basic Auth",
    },
    basicAuthPassword: {
      type: "string",
      description: "Password for Basic Auth",
    },
    bearerToken: {
      type: "string",
      description: "Bearer token for Bearer Auth",
    },
    customAuthHeaders: {
      type: "object",
      additionalProperties: {
        type: "string",
      },
      description: "Custom auth headers",
    },
    timeout: {
      type: "number",
      minimum: 0,
      description: "Request timeout in milliseconds",
    },
  },
  additionalProperties: false,
}

