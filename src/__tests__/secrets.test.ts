import { SecretService } from "../secrets/secret-service"
import { FileSecretRegistry } from "../secrets/secret-registry"
import { SecretResolverImpl } from "../secrets/secret-resolver"
import { MockExternalSecretProvider } from "../secrets/mock-provider"
import { encrypt, decrypt, generateKey } from "../secrets/encryption"
import { validateSecretData } from "../secrets/secret-validator"
import type { ApiKeySecretData, BasicAuthSecretData } from "../secrets/types"
import { BaseNode } from "../core/base-node"
import type { ExecutionContext } from "../interfaces/execution-state"
import type { NodeOutput } from "../interfaces"
import { mkdirSync, existsSync, readdirSync, unlinkSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

describe("Secrets Management", () => {
  let testKey: Buffer
  let registry: FileSecretRegistry
  let service: SecretService
  let resolver: SecretResolverImpl
  let tempDir: string

  beforeAll(() => {
    // Use a temporary directory for tests
    tempDir = join(tmpdir(), `workflow-secrets-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    testKey = generateKey()
    process.env.WORKFLOW_SECRETS_MASTER_KEY = testKey.toString("hex")
    process.env.WORKFLOW_SECRETS_STORAGE_PATH = tempDir
  })

  afterAll(() => {
    // Cleanup
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    delete process.env.WORKFLOW_SECRETS_MASTER_KEY
    delete process.env.WORKFLOW_SECRETS_STORAGE_PATH
  })

  beforeEach(() => {
    // Clear registry and create new instances
    if (existsSync(tempDir)) {
      const files = readdirSync(tempDir)
      for (const file of files) {
        unlinkSync(join(tempDir, file))
      }
    }
    registry = new FileSecretRegistry(tempDir)
    service = new SecretService(registry)
    resolver = new SecretResolverImpl(registry)
  })

  describe("Encryption/Decryption", () => {
    it("should encrypt and decrypt data correctly", () => {
      const data: ApiKeySecretData = { value: "test-api-key" }
      const encrypted = encrypt(data, testKey)
      const decrypted = decrypt(encrypted.encrypted, encrypted.iv, encrypted.authTag, testKey)

      expect(decrypted).toEqual(data)
    })

    it("should fail decryption with wrong key", () => {
      const data: ApiKeySecretData = { value: "test-api-key" }
      const encrypted = encrypt(data, testKey)
      const wrongKey = generateKey()

      expect(() => {
        decrypt(encrypted.encrypted, encrypted.iv, encrypted.authTag, wrongKey)
      }).toThrow()
    })
  })

  describe("Secret Validation", () => {
    it("should validate API Key secret", () => {
      const data: ApiKeySecretData = { value: "test-key" }
      expect(() => validateSecretData("apiKey", data)).not.toThrow()
    })

    it("should reject invalid API Key secret", () => {
      const data = { value: "" }
      expect(() => validateSecretData("apiKey", data as ApiKeySecretData)).toThrow()
    })

    it("should validate Basic Auth secret", () => {
      const data: BasicAuthSecretData = { username: "user", password: "pass" }
      expect(() => validateSecretData("basicAuth", data)).not.toThrow()
    })

    it("should reject invalid Basic Auth secret", () => {
      const data = { username: "user" }
      expect(() => validateSecretData("basicAuth", data as BasicAuthSecretData)).toThrow()
    })
  })

  describe("Secret Service", () => {
    it("should create and retrieve a secret", async () => {
      const data: ApiKeySecretData = { value: "test-api-key" }
      await service.createSecret("test-api", "apiKey", data)

      const retrieved = await service.getSecret("test-api")
      expect(retrieved.data).toEqual(data)
      expect(retrieved.type).toBe("apiKey")
    })

    it("should update a secret", async () => {
      const data: ApiKeySecretData = { value: "test-api-key" }
      await service.createSecret("test-api", "apiKey", data)

      const updatedData: ApiKeySecretData = { value: "updated-key" }
      await service.updateSecret("test-api", updatedData)

      const retrieved = await service.getSecret("test-api")
      expect(retrieved.data).toEqual(updatedData)
    })

    it("should delete a secret", async () => {
      const data: ApiKeySecretData = { value: "test-api-key" }
      await service.createSecret("test-api", "apiKey", data)

      const deleted = await service.deleteSecret("test-api")
      expect(deleted).toBe(true)

      await expect(service.getSecret("test-api")).rejects.toThrow()
    })

    it("should list secrets", async () => {
      await service.createSecret("api1", "apiKey", { value: "key1" })
      await service.createSecret("api2", "apiKey", { value: "key2" })

      const secrets = await service.listSecrets()
      expect(secrets.length).toBe(2)
    })
  })

  describe("Secret Resolver", () => {
    beforeEach(async () => {
      // Create test secrets
      await service.createSecret("apiKey", "apiKey", { value: "test-api-value" })
      await service.createSecret("basicAuth", "basicAuth", { username: "testuser", password: "testpass" })
      await service.createSecret("bearerToken", "bearerToken", { token: "test-token-value" })
    })

    it("should resolve secret reference", async () => {
      const value = await resolver.resolve("apiKey", "value")
      expect(value).toBe("test-api-value")
    })

    it("should resolve secret reference in string", async () => {
      const config = {
        apiKey: "{{secrets.apiKey.value}}",
      }
      const resolved = await resolver.resolveConfig(config)
      expect(resolved.apiKey).toBe("test-api-value")
    })

    it("should resolve multiple secret references", async () => {
      const config = {
        username: "{{secrets.basicAuth.username}}",
        password: "{{secrets.basicAuth.password}}",
      }
      const resolved = await resolver.resolveConfig(config)
      expect(resolved.username).toBe("testuser")
      expect(resolved.password).toBe("testpass")
    })

    it("should throw error for missing secret", async () => {
      await expect(resolver.resolve("nonexistent", "value")).rejects.toThrow()
    })

    it("should throw error for missing field", async () => {
      await expect(resolver.resolve("apiKey", "nonexistent")).rejects.toThrow()
    })
  })

  describe("BaseNode Secret Resolution", () => {
    it("should resolve secrets in node configuration", async () => {
      // Create a test secret
      await service.createSecret("testSecret", "apiKey", { value: "resolved-value" })

      // Create a test node that uses secrets
      class TestNode extends BaseNode {
        protected async process(_context: ExecutionContext): Promise<NodeOutput> {
          // Config should have secrets resolved
          const apiKey = this.config.apiKey as string
          expect(apiKey).toBe("resolved-value")
          return { output: [{ value: apiKey }] }
        }
      }

      const node = new TestNode({
        id: "test-1",
        name: "test-node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      // Set secret resolver
      node.setSecretResolver(resolver)

      // Configure with secret reference
      node.setup({
        apiKey: "{{secrets.testSecret.value}}",
      })

      // Execute node
      const result = await node.run({
        input: {},
        state: {},
      })

      const output = result.output
      if (Array.isArray(output)) {
        expect(output[0].value).toBe("resolved-value")
      } else {
        expect(output.value).toBe("resolved-value")
      }
    })
  })

  describe("External Secret Provider Integration", () => {
    let mockProvider: MockExternalSecretProvider
    let resolverWithProvider: SecretResolverImpl

    beforeEach(() => {
      mockProvider = new MockExternalSecretProvider("test-provider")
      resolverWithProvider = new SecretResolverImpl(registry, [mockProvider])
    })

    it("should resolve secret from external provider", async () => {
      // Add secret to external provider
      mockProvider.addSecret("externalApiKey", { value: "external-key-12345" })

      // Resolve from external provider
      const value = await resolverWithProvider.resolve("externalApiKey", "value")
      expect(value).toBe("external-key-12345")
    })

    it("should fall back to local registry when external provider doesn't have secret", async () => {
      // Create secret in local registry
      await service.createSecret("localApiKey", "apiKey", { value: "local-key-12345" })

      // External provider doesn't have this secret
      // Should fall back to local registry
      const value = await resolverWithProvider.resolve("localApiKey", "value")
      expect(value).toBe("local-key-12345")
    })

    it("should prefer external provider over local registry", async () => {
      // Create secret in both local registry and external provider
      await service.createSecret("sharedKey", "apiKey", { value: "local-value" })
      mockProvider.addSecret("sharedKey", { value: "external-value" })

      // External provider should be checked first
      const value = await resolverWithProvider.resolve("sharedKey", "value")
      expect(value).toBe("external-value")
    })

    it("should handle external provider unavailability", async () => {
      // Create secret in local registry
      await service.createSecret("localKey", "apiKey", { value: "local-value" })

      // Make external provider unavailable
      mockProvider.setAvailable(false)

      // Should still work with local registry
      const value = await resolverWithProvider.resolve("localKey", "value")
      expect(value).toBe("local-value")
    })

    it("should handle multiple external providers", async () => {
      const provider1 = new MockExternalSecretProvider("provider1")
      const provider2 = new MockExternalSecretProvider("provider2")

      provider1.addSecret("secret1", { value: "value1" })
      provider2.addSecret("secret2", { value: "value2" })

      const multiProviderResolver = new SecretResolverImpl(registry, [provider1, provider2])

      // Should resolve from first provider
      const value1 = await multiProviderResolver.resolve("secret1", "value")
      expect(value1).toBe("value1")

      // Should resolve from second provider
      const value2 = await multiProviderResolver.resolve("secret2", "value")
      expect(value2).toBe("value2")
    })

    it("should handle external provider errors gracefully", async () => {
      // Create a provider that throws errors
      const errorProvider = new MockExternalSecretProvider("error-provider")
      errorProvider.setAvailable(false)

      // Create secret in local registry
      await service.createSecret("localKey", "apiKey", { value: "local-value" })

      const resolverWithError = new SecretResolverImpl(registry, [errorProvider])

      // Should fall back to local registry when provider errors
      const value = await resolverWithError.resolve("localKey", "value")
      expect(value).toBe("local-value")
    })

    it("should resolve secret references with external provider in node configuration", async () => {
      // Add secret to external provider
      mockProvider.addSecret("externalAuth", {
        username: "external-user",
        password: "external-pass",
      })

      class TestNode extends BaseNode {
        protected async process(_context: ExecutionContext): Promise<NodeOutput> {
          const username = this.config.username as string
          const password = this.config.password as string
          expect(username).toBe("external-user")
          expect(password).toBe("external-pass")
          return { output: [{ username, password }] }
        }
      }

      const node = new TestNode({
        id: "test-1",
        name: "test-node",
        nodeType: "test",
        version: 1,
        position: [0, 0],
      })

      node.setSecretResolver(resolverWithProvider)
      node.setup({
        username: "{{secrets.externalAuth.username}}",
        password: "{{secrets.externalAuth.password}}",
      })

      const result = await node.run({
        input: {},
        state: {},
      })

      const output = result.output
      if (Array.isArray(output)) {
        expect(output[0].username).toBe("external-user")
        expect(output[0].password).toBe("external-pass")
      }
    })
  })
})

