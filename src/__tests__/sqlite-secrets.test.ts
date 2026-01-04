import { SecretService } from "../secrets/secret-service"
import { SqliteSecretRegistry } from "../secrets/sqlite-secret-registry"
import { createSecretRegistry, getDefaultStorageBackend } from "../secrets/storage-factory"
import { generateKey } from "../secrets/encryption"
import type { ApiKeySecretData, BearerTokenSecretData } from "../secrets/types"
import { mkdirSync, existsSync, rmSync, unlinkSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

describe("SQLite Secrets Storage", () => {
  let testKey: Buffer
  let registry: SqliteSecretRegistry
  let service: SecretService
  let tempDir: string
  let dbPath: string

  beforeAll(() => {
    // Use a temporary directory for tests
    tempDir = join(tmpdir(), `workflow-sqlite-secrets-test-${Date.now()}`)
    mkdirSync(tempDir, { recursive: true })
    dbPath = join(tempDir, "secrets.db")
    testKey = generateKey()
    process.env.WORKFLOW_SECRETS_MASTER_KEY = testKey.toString("hex")
  })

  afterAll(() => {
    // Cleanup
    if (registry) {
      registry.close()
    }
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    delete process.env.WORKFLOW_SECRETS_MASTER_KEY
    delete process.env.WORKFLOW_SECRETS_STORAGE_BACKEND
  })

  beforeEach(() => {
    // Clean up database file if it exists
    if (existsSync(dbPath)) {
      unlinkSync(dbPath)
    }
    registry = new SqliteSecretRegistry(dbPath, tempDir)
    service = new SecretService(registry)
  })

  afterEach(() => {
    if (registry) {
      registry.close()
    }
  })

  describe("SQLite Database Initialization", () => {
    it("should create database file and schema", async () => {
      // Database file is created when registry is initialized
      // Perform a simple operation to ensure database is created
      const data: ApiKeySecretData = { value: "test-key" }
      await service.createSecret("test-init", "apiKey", data)

      expect(existsSync(dbPath)).toBe(true)
    })

    it("should create secrets table with correct schema", async () => {
      // Try to store a secret to verify schema works
      const data: ApiKeySecretData = { value: "test-key" }
      await service.createSecret("test", "apiKey", data)

      const retrieved = await service.getSecret("test")
      expect(retrieved.data).toEqual(data)
    })
  })

  describe("SQLite Secret Operations", () => {
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

    it("should list all secrets", async () => {
      await service.createSecret("api1", "apiKey", { value: "key1" })
      await service.createSecret("api2", "apiKey", { value: "key2" })
      await service.createSecret("basic1", "basicAuth", { username: "user1", password: "pass1" })

      const secrets = await service.listSecrets()
      expect(secrets.length).toBe(3)
    })

    it("should filter secrets by type", async () => {
      await service.createSecret("api1", "apiKey", { value: "key1" })
      await service.createSecret("api2", "apiKey", { value: "key2" })
      await service.createSecret("basic1", "basicAuth", { username: "user1", password: "pass1" })

      const apiSecrets = await service.listSecrets({ type: "apiKey" })
      expect(apiSecrets.length).toBe(2)
      expect(apiSecrets.every((s) => s.type === "apiKey")).toBe(true)

      const basicSecrets = await service.listSecrets({ type: "basicAuth" })
      expect(basicSecrets.length).toBe(1)
      expect(basicSecrets[0].type).toBe("basicAuth")
    })

    it("should filter secrets by tags", async () => {
      await service.createSecret("api1", "apiKey", { value: "key1" }, { tags: ["production", "api"] })
      await service.createSecret("api2", "apiKey", { value: "key2" }, { tags: ["staging", "api"] })
      await service.createSecret("api3", "apiKey", { value: "key3" }, { tags: ["production"] })

      const productionSecrets = await service.listSecrets({ tags: ["production"] })
      expect(productionSecrets.length).toBe(2)

      const apiProductionSecrets = await service.listSecrets({ tags: ["production", "api"] })
      expect(apiProductionSecrets.length).toBe(1)
      expect(apiProductionSecrets[0].metadata.name).toBe("api1")
    })

    it("should handle secret with metadata", async () => {
      const data: ApiKeySecretData = { value: "test-key" }
      await service.createSecret(
        "test-api",
        "apiKey",
        data,
        { description: "Test API key", tags: ["test", "api"] },
      )

      const retrieved = await service.getSecret("test-api")
      expect(retrieved.metadata.description).toBe("Test API key")
      expect(retrieved.metadata.tags).toEqual(["test", "api"])
    })
  })

  describe("Storage Backend Factory", () => {
    it("should create SQLite registry by default", () => {
      const registry = createSecretRegistry(undefined, tempDir)
      expect(registry).toBeInstanceOf(SqliteSecretRegistry)
      ;(registry as SqliteSecretRegistry).close()
    })

    it("should create SQLite registry when explicitly requested", () => {
      const registry = createSecretRegistry("sqlite", tempDir)
      expect(registry).toBeInstanceOf(SqliteSecretRegistry)
      ;(registry as SqliteSecretRegistry).close()
    })

    it("should get default storage backend", () => {
      const backend = getDefaultStorageBackend()
      expect(backend).toBe("sqlite")
    })

    it("should respect WORKFLOW_SECRETS_STORAGE_BACKEND environment variable", () => {
      process.env.WORKFLOW_SECRETS_STORAGE_BACKEND = "sqlite"
      const backend = getDefaultStorageBackend()
      expect(backend).toBe("sqlite")
      delete process.env.WORKFLOW_SECRETS_STORAGE_BACKEND
    })
  })

  describe("Concurrent Access", () => {
    it("should handle concurrent secret operations", async () => {
      const promises: Promise<unknown>[] = []

      // Create multiple secrets concurrently
      for (let i = 0; i < 10; i++) {
        promises.push(service.createSecret(`api${i}`, "apiKey", { value: `key${i}` }))
      }

      await Promise.all(promises)

      const secrets = await service.listSecrets()
      expect(secrets.length).toBe(10)
    })

    it("should handle concurrent reads", async () => {
      await service.createSecret("test-api", "apiKey", { value: "test-key" })

      const promises: Promise<unknown>[] = []
      for (let i = 0; i < 10; i++) {
        promises.push(service.getSecret("test-api"))
      }

      const results = await Promise.all(promises)
      expect(results.length).toBe(10)
      results.forEach((result) => {
        expect((result as { data: ApiKeySecretData }).data.value).toBe("test-key")
      })
    })
  })

  describe("Data Integrity", () => {
    it("should preserve all secret fields correctly", async () => {
      const bearerData: BearerTokenSecretData = {
        token: "test-token",
        expiresAt: Date.now() + 3600000,
      }
      await service.createSecret("bearer", "bearerToken", bearerData)

      const retrieved = await service.getSecret("bearer")
      expect(retrieved.data).toEqual(bearerData)
    })

    it("should preserve metadata on update", async () => {
      await service.createSecret(
        "test-api",
        "apiKey",
        { value: "key1" },
        { description: "Original description", tags: ["tag1"] },
      )

      await service.updateSecret("test-api", { value: "key2" })

      const retrieved = await service.getSecret("test-api")
      expect(retrieved.metadata.description).toBe("Original description")
      expect(retrieved.metadata.tags).toEqual(["tag1"])
      expect((retrieved.data as ApiKeySecretData).value).toBe("key2")
    })
  })
})

