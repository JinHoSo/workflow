/**
 * Tests for SecretResolver
 * Tests secret resolution, reference handling, and external provider integration
 */

import { SecretResolverImpl } from "../secret-resolver"
import { MockSecretRegistry } from "./mock-secret-registry"
import { MockExternalSecretProvider } from "../mock-provider"
import type { SecretData } from "../types"

describe("SecretResolverImpl", () => {
  let resolver: SecretResolverImpl
  let registry: MockSecretRegistry
  let mockProvider: MockExternalSecretProvider

  beforeEach(() => {
    registry = new MockSecretRegistry()
    mockProvider = new MockExternalSecretProvider("test-provider")
    resolver = new SecretResolverImpl(registry, [mockProvider])
  })

  describe("secret resolution", () => {
    it("should resolve secret from external provider", async () => {
      const secretData: SecretData = { username: "test", password: "secret" }
      mockProvider.addSecret("test-secret", secretData)
      const resolved = await resolver.resolve("test-secret")
      expect(resolved).toEqual(secretData)
    })

    it("should resolve specific field from secret", async () => {
      const secretData: SecretData = { username: "test", password: "secret" }
      mockProvider.addSecret("test-secret", secretData)
      const resolved = await resolver.resolve("test-secret", "username")
      expect(resolved).toBe("test")
    })

    it("should throw error when secret not found", async () => {
      await expect(resolver.resolve("non-existent")).rejects.toThrow("not found")
    })

    it("should throw error when field not found", async () => {
      const secretData: SecretData = { username: "test" }
      mockProvider.addSecret("test-secret", secretData)
      await expect(resolver.resolve("test-secret", "password")).rejects.toThrow("Field")
    })
  })

  describe("configuration resolution", () => {
    it("should resolve secret references in configuration", async () => {
      const secretData: SecretData = { token: "secret-token" }
      mockProvider.addSecret("api-secret", secretData)
      const config = {
        apiKey: "{{secrets.api-secret.token}}",
        other: "value",
      }
      const resolved = await resolver.resolveConfig(config)
      expect(resolved.apiKey).toBe("secret-token")
      expect(resolved.other).toBe("value")
    })

    it("should handle nested secret references", async () => {
      const secretData: SecretData = { value: "nested-secret" }
      mockProvider.addSecret("nested", secretData)
      const config = {
        nested: {
          key: "{{secrets.nested.value}}",
        },
      }
      const resolved = await resolver.resolveConfig(config)
      expect((resolved.nested as { key: string }).key).toBe("nested-secret")
    })
  })
})

