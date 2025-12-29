import { HttpRequestNode } from "../nodes/http-request-node"
import { NodeState } from "../types"
import type { NodeProperties, DataRecord } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"

// Mock fetch globally
global.fetch = jest.fn()

describe("HttpRequestNode", () => {
  let node: HttpRequestNode
  let properties: NodeProperties

  beforeEach(() => {
    properties = {
      id: "http-1",
      name: "http-node",
      nodeType: "http-request",
      version: 1,
      position: [0, 0],
    }
    node = new HttpRequestNode(properties)
    jest.clearAllMocks()
  })

  describe("Configuration", () => {
    test("should configure with valid HTTP method and URL", () => {
      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
      })
      expect(node.state).toBe(NodeState.Idle)
    })

    test("should throw error for invalid HTTP method", () => {
      expect(() => {
        node.setup({
          method: "INVALID" as "GET",
          url: "https://api.example.com/data",
        })
      }).toThrow("Configuration validation failed")
    })

    test("should throw error for invalid timeout", () => {
      expect(() => {
        node.setup({
          method: "GET",
          url: "https://api.example.com/data",
          timeout: -1,
        })
      }).toThrow("Configuration validation failed")
    })

    test("should throw error for Basic Auth without credentials", () => {
      expect(() => {
        node.setup({
          method: "GET",
          url: "https://api.example.com/data",
          authType: "basic",
        })
      }).toThrow("Basic Auth requires both username and password")
    })

    test("should throw error for Bearer Auth without token", () => {
      expect(() => {
        node.setup({
          method: "GET",
          url: "https://api.example.com/data",
          authType: "bearer",
        })
      }).toThrow("Bearer Auth requires a token")
    })

    test("should configure with Basic Auth", () => {
      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
        authType: "basic",
        basicAuthUsername: "user",
        basicAuthPassword: "pass",
      })
      expect(node.state).toBe(NodeState.Idle)
    })

    test("should configure with Bearer Token", () => {
      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
        authType: "bearer",
        bearerToken: "token123",
      })
      expect(node.state).toBe(NodeState.Idle)
    })
  })

  describe("GET Request", () => {
    test("should execute GET request successfully", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"message":"success"}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(node.state).toBe(NodeState.Completed)
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com/data", {
        method: "GET",
        headers: {},
        body: undefined,
        signal: expect.any(AbortSignal),
      })

      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(resultData.statusCode).toBe(200)
      expect(resultData.body).toEqual({ message: "success" })
    })

    test("should execute GET request with query parameters", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"data":"result"}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
        queryParameters: {
          page: "1",
          limit: "10",
        },
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data?page=1&limit=10",
        expect.objectContaining({
          method: "GET",
        }),
      )
    })

    test("should execute GET request with custom headers", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"data":"result"}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
        headers: {
          "X-Custom-Header": "value",
          "User-Agent": "test-agent",
        },
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Custom-Header": "value",
            "User-Agent": "test-agent",
          }),
        }),
      )
    })
  })

  describe("POST Request", () => {
    test("should execute POST request with JSON body", async () => {
      const mockResponse = {
        status: 201,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"id":123}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "POST",
        url: "https://api.example.com/data",
        body: { name: "test", value: 42 },
        bodyFormat: "json",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: '{"name":"test","value":42}',
        }),
      )
    })

    test("should execute POST request with text body", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "text/plain",
        }),
        text: jest.fn().mockResolvedValue("OK"),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "POST",
        url: "https://api.example.com/data",
        body: "plain text",
        bodyFormat: "text",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "text/plain",
          }),
          body: "plain text",
        }),
      )
    })
  })

  describe("Authentication", () => {
    test("should execute request with Basic Authentication", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"authenticated":true}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
        authType: "basic",
        basicAuthUsername: "user",
        basicAuthPassword: "pass",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      const authHeader = Buffer.from("user:pass").toString("base64")
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic ${authHeader}`,
          }),
        }),
      )
    })

    test("should execute request with Bearer Token", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"authenticated":true}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
        authType: "bearer",
        bearerToken: "token123",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer token123",
          }),
        }),
      )
    })
  })

  describe("Dynamic Configuration from Input", () => {
    test("should use URL from input data", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"data":"result"}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/default",
      })

      const context: ExecutionContext = {
        input: {
          input: {
            url: "https://api.example.com/override",
          },
        },
        state: {},
      }
      await node.run(context)

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/override",
        expect.any(Object),
      )
    })

    test("should merge headers from input data", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"data":"result"}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
        headers: {
          "X-Config-Header": "config-value",
        },
      })

      const context: ExecutionContext = {
        input: {
          input: {
            headers: {
              "X-Input-Header": "input-value",
            },
          },
        },
        state: {},
      }
      await node.run(context)

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Config-Header": "config-value",
            "X-Input-Header": "input-value",
          }),
        }),
      )
    })

    test("should merge query parameters from input data", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"data":"result"}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
        queryParameters: {
          page: "1",
        },
      })

      const context: ExecutionContext = {
        input: {
          input: {
            queryParameters: {
              limit: "10",
            },
          },
        },
        state: {},
      }
      await node.run(context)

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data?page=1&limit=10",
        expect.any(Object),
      )
    })
  })

  describe("Error Handling", () => {
    test("should handle network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("fetch failed"))

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(node.state).toBe(NodeState.Completed) // Completed because error goes to error port
      const error = node.getResult("error")
      const errorData = Array.isArray(error) ? (error as DataRecord[])[0] : (error as DataRecord)
      expect(errorData.errorType).toBe("NetworkError")
      expect(errorData.message).toContain("fetch failed")
    })

    test("should handle timeout errors", async () => {
      const abortError = new Error("Request timeout")
      abortError.name = "AbortError"
      ;(global.fetch as jest.Mock).mockRejectedValue(abortError)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
        timeout: 1000,
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(node.state).toBe(NodeState.Completed)
      const error = node.getResult("error")
      const errorData = Array.isArray(error) ? (error as DataRecord[])[0] : (error as DataRecord)
      expect(errorData.errorType).toBe("TimeoutError")
      expect(errorData.message).toContain("timeout")
    })

    test("should handle HTTP error status codes", async () => {
      const mockResponse = {
        status: 404,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"error":"Not Found"}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      // HTTP error status codes should still go to output port (not error port)
      expect(node.state).toBe(NodeState.Completed)
      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(resultData.statusCode).toBe(404)
    })

    test("should handle missing URL error", async () => {
      node.setup({
        method: "GET",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(node.state).toBe(NodeState.Completed)
      const error = node.getResult("error")
      const errorData = Array.isArray(error) ? (error as DataRecord[])[0] : (error as DataRecord)
      expect(errorData.errorType).toBe("RequestError")
      expect(errorData.message).toContain("URL is required")
    })
  })

  describe("Response Parsing", () => {
    test("should parse JSON response", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"key":"value","number":42}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(resultData.body).toEqual({ key: "value", number: 42 })
    })

    test("should parse text response", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "text/plain",
        }),
        text: jest.fn().mockResolvedValue("Plain text response"),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(resultData.body).toBe("Plain text response")
    })

    test("should handle binary response", async () => {
      const mockArrayBuffer = new ArrayBuffer(8)
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/octet-stream",
        }),
        text: jest.fn(),
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "GET",
        url: "https://api.example.com/data",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(typeof resultData.body).toBe("string") // Base64 encoded
    })
  })

  describe("Response Metadata", () => {
    test("should include request metadata in response", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"data":"result"}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "POST",
        url: "https://api.example.com/data",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      const beforeTime = Date.now()
      await node.run(context)
      const afterTime = Date.now()

      const result = node.getResult("output")
      const resultData = Array.isArray(result) ? (result as DataRecord[])[0] : (result as DataRecord)
      expect(resultData.request).toBeDefined()
      const request = resultData.request as DataRecord
      expect(request.url).toBe("https://api.example.com/data")
      expect(request.method).toBe("POST")
      expect(request.timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(request.timestamp).toBeLessThanOrEqual(afterTime)
    })
  })

  describe("Other HTTP Methods", () => {
    test("should execute PUT request", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"updated":true}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "PUT",
        url: "https://api.example.com/data/1",
        body: { name: "updated" },
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data/1",
        expect.objectContaining({
          method: "PUT",
        }),
      )
    })

    test("should execute DELETE request", async () => {
      const mockResponse = {
        status: 204,
        headers: new Headers(),
        text: jest.fn().mockResolvedValue(""),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "DELETE",
        url: "https://api.example.com/data/1",
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data/1",
        expect.objectContaining({
          method: "DELETE",
        }),
      )
    })

    test("should execute PATCH request", async () => {
      const mockResponse = {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
        }),
        text: jest.fn().mockResolvedValue('{"patched":true}'),
        arrayBuffer: jest.fn(),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      node.setup({
        method: "PATCH",
        url: "https://api.example.com/data/1",
        body: { field: "value" },
      })

      const context: ExecutionContext = { input: {}, state: {} }
      await node.run(context)

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/data/1",
        expect.objectContaining({
          method: "PATCH",
        }),
      )
    })
  })
})

