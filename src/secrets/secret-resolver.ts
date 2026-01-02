import type { SecretResolver as ISecretResolver, ExternalSecretProvider } from "./interfaces"
import type { SecretData } from "./types"
import { decrypt } from "./encryption"
import { getMasterKey } from "./key-management"
import { getSecretField } from "./secret-validator"
import type { SecretRegistry } from "./interfaces"

/**
 * Implementation of SecretResolver
 * Resolves secret references to decrypted values
 */
export class SecretResolverImpl implements ISecretResolver {
  private readonly registry: SecretRegistry
  private readonly externalProviders: ExternalSecretProvider[]
  private readonly cache: Map<string, SecretData> = new Map()
  private masterKey: Buffer | null = null

  /**
   * Creates a new secret resolver
   * @param registry - Secret registry for local secrets
   * @param externalProviders - Optional external secret providers
   */
  constructor(registry: SecretRegistry, externalProviders: ExternalSecretProvider[] = []) {
    this.registry = registry
    this.externalProviders = externalProviders
  }

  /**
   * Gets or initializes the master key
   */
  private getMasterKey(): Buffer {
    if (!this.masterKey) {
      const keyConfig = getMasterKey()
      this.masterKey = keyConfig.key
    }
    return this.masterKey
  }

  /**
   * Resolves a secret from local registry or external provider
   * External providers are checked first, then local registry
   */
  private async resolveSecret(secretName: string): Promise<SecretData> {
    // Check cache first
    const cacheKey = `local:${secretName}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // Try external providers first (they take precedence)
    for (const provider of this.externalProviders) {
      try {
        if (await provider.isAvailable()) {
          const externalSecret = await provider.getSecret(secretName)
          if (externalSecret) {
            const cacheKey = `external:${provider.name}:${secretName}`
            this.cache.set(cacheKey, externalSecret)
            return externalSecret
          }
        }
      } catch {
        // Continue to next provider
        continue
      }
    }

    // Fall back to local registry if not found in external providers
    const secret = await this.registry.get(secretName)
    if (secret) {
      const masterKey = this.getMasterKey()
      const decrypted = decrypt(secret.encryptedData, secret.iv, secret.authTag, masterKey)
      this.cache.set(cacheKey, decrypted)
      return decrypted
    }

    throw new Error(`Secret "${secretName}" not found in registry or external providers`)
  }

  /**
   * Resolves a secret reference to its decrypted value
   */
  async resolve(secretName: string, fieldName?: string): Promise<string | number | boolean | SecretData> {
    const secretData = await this.resolveSecret(secretName)

    // If no field name specified, return entire secret data
    if (!fieldName) {
      return secretData
    }

    // Get specific field
    const fieldValue = getSecretField(secretData, fieldName)
    if (fieldValue === undefined) {
      throw new Error(`Field "${fieldName}" not found in secret "${secretName}"`)
    }

    return fieldValue
  }

  /**
   * Resolves all secret references in a configuration object
   */
  async resolveConfig(config: Record<string, unknown>): Promise<Record<string, unknown>> {
    const resolved: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === "string") {
        // Check if value is a secret reference
        const resolvedValue = await this.resolveStringValue(value)
        resolved[key] = resolvedValue
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        // Recursively resolve nested objects
        resolved[key] = await this.resolveConfig(value as Record<string, unknown>)
      } else {
        // Keep non-string values as-is
        resolved[key] = value
      }
    }

    return resolved
  }

  /**
   * Resolves secret references in a string value
   * Supports format: {{secrets.secretName.fieldName}} or {{secrets.secretName}}
   */
  private async resolveStringValue(value: string): Promise<unknown> {
    const secretReferenceRegex = /\{\{secrets\.([a-zA-Z0-9_-]+)(?:\.([a-zA-Z0-9_-]+))?\}\}/g
    let result = value
    let hasReference = false

    const matches = Array.from(value.matchAll(secretReferenceRegex))
    for (const match of matches) {
      hasReference = true
      const secretName = match[1]
      const fieldName = match[2]

      try {
        const resolvedValue = await this.resolve(secretName, fieldName)
        // Replace the reference with the resolved value
        // If the entire string is the reference, return the value directly
        // Otherwise, replace it as a string
        if (match[0] === value) {
          return resolvedValue
        }
        result = result.replace(match[0], String(resolvedValue))
      } catch (error) {
        throw new Error(
          `Failed to resolve secret reference "${match[0]}": ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    // If no references found, return original value
    if (!hasReference) {
      return value
    }

    // If we replaced references in a string, return the modified string
    return result
  }

  /**
   * Clears the secret resolution cache
   */
  clearCache(): void {
    this.cache.clear()
  }
}

