/**
 * Secrets management module
 * Provides secure storage and retrieval of authentication credentials
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
} from "./types"

// Interfaces
export type { SecretRegistry, ExternalSecretProvider, SecretResolver } from "./interfaces"

// Encryption utilities
export { encrypt, decrypt, generateKey, deriveKey } from "./encryption"
export type { EncryptionResult } from "./encryption"

// Key management
export { getMasterKey, getSecretsStoragePath, ensureSecretsDirectory } from "./key-management"

// Registry implementation
export { FileSecretRegistry } from "./secret-registry"

// Resolver implementation
export { SecretResolverImpl } from "./secret-resolver"

// Service
export { SecretService } from "./secret-service"

// Validator
export { validateSecretData, getSecretField } from "./secret-validator"

// Mock provider for testing
export { MockExternalSecretProvider } from "./mock-provider"

