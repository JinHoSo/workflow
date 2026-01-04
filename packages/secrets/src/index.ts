/**
 * @workflow/secrets package entry point
 * Exports secrets management functionality
 */

// Types
export type {
  SecretType,
  SecretData,
  ApiKeySecretData,
  BasicAuthSecretData,
  BearerTokenSecretData,
  OAuthSecretData,
  CustomSecretData,
  SecretMetadata,
  Secret,
  DecryptedSecret,
} from "./secrets/types"

// Interfaces
export type { SecretRegistry, ExternalSecretProvider, SecretResolver } from "./secrets/interfaces"

// Encryption utilities
export { encrypt, decrypt, generateKey, deriveKey } from "./secrets/encryption"
export type { EncryptionResult } from "./secrets/encryption"

// Key management
export { getMasterKey, getSecretsStoragePath, ensureSecretsDirectory } from "./secrets/key-management"

// Registry implementation
export { FileSecretRegistry } from "./secrets/secret-registry"
export { SqliteSecretRegistry } from "./secrets/sqlite-secret-registry"

// Storage factory
export { createSecretRegistry, getDefaultStorageBackend } from "./secrets/storage-factory"
export type { StorageBackend } from "./secrets/storage-factory"

// Resolver implementation
export { SecretResolverImpl } from "./secrets/secret-resolver"

// Service
export { SecretService } from "./secrets/secret-service"

// Validator
export { validateSecretData, getSecretField } from "./secrets/secret-validator"

// Mock provider for testing
export { MockExternalSecretProvider } from "./secrets/mock-provider"

