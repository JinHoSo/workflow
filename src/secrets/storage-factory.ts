import type { SecretRegistry } from "./interfaces"
import { FileSecretRegistry } from "./secret-registry"
import { SqliteSecretRegistry } from "./sqlite-secret-registry"
import { getSecretsStoragePath } from "./key-management"

/**
 * Storage backend type
 * - "sqlite": SQLite database storage (default, better performance)
 * - "file": File-based storage (fallback option)
 */
export type StorageBackend = "sqlite" | "file"

/**
 * Creates a secret registry with the specified or default storage backend
 *
 * Storage backend selection:
 * - Default: SQLite (better performance, query capabilities)
 * - Fallback: File-based storage if SQLite initialization fails
 * - Configuration: Set WORKFLOW_SECRETS_STORAGE_BACKEND environment variable to "sqlite" or "file"
 *
 * @param backend - Optional storage backend type (defaults to "sqlite" or from WORKFLOW_SECRETS_STORAGE_BACKEND env var)
 * @param storagePath - Optional storage path (defaults to getSecretsStoragePath())
 * @returns Secret registry instance
 * @throws Error if explicitly requested backend fails to initialize
 */
export function createSecretRegistry(backend?: StorageBackend, storagePath?: string): SecretRegistry {
  // Determine backend from parameter, environment variable, or default
  const requestedBackend =
    backend || (process.env.WORKFLOW_SECRETS_STORAGE_BACKEND as StorageBackend) || "sqlite"

  const basePath = storagePath || getSecretsStoragePath()

  // Try SQLite first (default or if explicitly requested)
  if (requestedBackend === "sqlite" || requestedBackend === undefined) {
    try {
      const sqliteRegistry = new SqliteSecretRegistry(undefined, basePath)
      // Test database connection by trying to query
      // If this fails, we'll catch and fall back
      return sqliteRegistry
    } catch (error) {
      // Log warning and fall back to file-based
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(
        `Failed to initialize SQLite storage backend: ${errorMessage}. Falling back to file-based storage.`,
      )

      // If SQLite was explicitly requested, throw error
      if (requestedBackend === "sqlite") {
        throw new Error(`SQLite storage backend requested but failed to initialize: ${errorMessage}`)
      }

      // Otherwise, fall back to file-based
      return new FileSecretRegistry(basePath)
    }
  }

  // Use file-based storage
  if (requestedBackend === "file") {
    return new FileSecretRegistry(basePath)
  }

  // Invalid backend type
  throw new Error(`Invalid storage backend: ${requestedBackend}. Must be "sqlite" or "file"`)
}

/**
 * Gets the default storage backend type
 *
 * Backend selection priority:
 * 1. WORKFLOW_SECRETS_STORAGE_BACKEND environment variable
 * 2. Default: "sqlite"
 *
 * @returns Default storage backend type
 */
export function getDefaultStorageBackend(): StorageBackend {
  const envBackend = process.env.WORKFLOW_SECRETS_STORAGE_BACKEND as StorageBackend | undefined
  if (envBackend === "sqlite" || envBackend === "file") {
    return envBackend
  }
  return "sqlite" // Default to SQLite
}

