import type { Secret, SecretType, SecretData } from "./types"

/**
 * Interface for secret registry operations
 */
export interface SecretRegistry {
  /**
   * Stores a secret in the registry
   * @param secret - The secret to store (with encrypted data)
   * @throws Error if secret with same name already exists
   */
  store(secret: Secret): Promise<void>

  /**
   * Retrieves a secret by name
   * @param name - Secret name
   * @returns The secret if found, undefined otherwise
   */
  get(name: string): Promise<Secret | undefined>

  /**
   * Updates an existing secret
   * @param name - Secret name
   * @param secret - Updated secret (with encrypted data)
   * @throws Error if secret does not exist
   */
  update(name: string, secret: Secret): Promise<void>

  /**
   * Deletes a secret by name
   * @param name - Secret name
   * @returns true if secret was deleted, false if it didn't exist
   */
  delete(name: string): Promise<boolean>

  /**
   * Lists all secrets (metadata only, no decrypted data)
   * @param filter - Optional filter by type or tags
   * @returns Array of secret metadata
   */
  list(filter?: { type?: SecretType; tags?: string[] }): Promise<Secret[]>
}

/**
 * Interface for external secret providers (e.g., HashiCorp Vault, AWS Secrets Manager)
 */
export interface ExternalSecretProvider {
  /**
   * Provider name/identifier
   */
  readonly name: string

  /**
   * Retrieves a secret from the external provider
   * @param secretName - Name of the secret to retrieve
   * @returns Decrypted secret data, or undefined if not found
   * @throws Error if provider is unavailable or access is denied
   */
  getSecret(secretName: string): Promise<SecretData | undefined>

  /**
   * Checks if the provider is available and configured
   * @returns true if provider is available
   */
  isAvailable(): Promise<boolean>
}

/**
 * Interface for secret resolution
 */
export interface SecretResolver {
  /**
   * Resolves a secret reference to its decrypted value
   * @param secretName - Name of the secret
   * @param fieldName - Optional field name within the secret
   * @returns The decrypted field value, or the entire secret data if fieldName is not provided
   * @throws Error if secret is not found or field does not exist
   */
  resolve(secretName: string, fieldName?: string): Promise<string | number | boolean | SecretData>

  /**
   * Resolves all secret references in a configuration object
   * @param config - Configuration object that may contain secret references
   * @returns Configuration object with all secret references resolved
   */
  resolveConfig(config: Record<string, unknown>): Promise<Record<string, unknown>>

  /**
   * Clears the secret resolution cache
   */
  clearCache(): void
}

