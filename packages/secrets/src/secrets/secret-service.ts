import { randomUUID } from "crypto"
import type { Secret, DecryptedSecret, SecretType, SecretData, SecretMetadata } from "./types"
import type { SecretRegistry } from "./interfaces"
import { encrypt } from "./encryption"
import { getMasterKey } from "./key-management"
import { validateSecretData } from "./secret-validator"

/**
 * Service for managing secrets (CRUD operations)
 */
export class SecretService {
  private readonly registry: SecretRegistry
  private masterKey: Buffer | null = null

  /**
   * Creates a new secret service
   * @param registry - Secret registry for storing secrets
   */
  constructor(registry: SecretRegistry) {
    this.registry = registry
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
   * Creates a new secret
   * @param name - Secret name (must be unique)
   * @param type - Secret type
   * @param data - Secret data
   * @param metadata - Optional metadata (description, tags)
   * @returns The created secret (with encrypted data)
   * @throws Error if secret already exists or validation fails
   */
  async createSecret(
    name: string,
    type: SecretType,
    data: SecretData,
    metadata?: { description?: string; tags?: string[] },
  ): Promise<Secret> {
    // Validate secret data
    validateSecretData(type, data)

    // Check if secret already exists
    const existing = await this.registry.get(name)
    if (existing) {
      throw new Error(`Secret "${name}" already exists`)
    }

    // Encrypt data
    const masterKey = this.getMasterKey()
    const encrypted = encrypt(data, masterKey)

    // Create secret metadata
    const now = Date.now()
    const secretMetadata: SecretMetadata = {
      name,
      description: metadata?.description,
      tags: metadata?.tags,
      createdAt: now,
      updatedAt: now,
    }

    // Create secret object
    const secret: Secret = {
      id: randomUUID(),
      type,
      metadata: secretMetadata,
      encryptedData: encrypted.encrypted,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    }

    // Store secret
    await this.registry.store(secret)

    return secret
  }

  /**
   * Gets a secret by name (returns decrypted data)
   * @param name - Secret name
   * @returns Decrypted secret
   * @throws Error if secret is not found
   */
  async getSecret(name: string): Promise<DecryptedSecret> {
    const secret = await this.registry.get(name)
    if (!secret) {
      throw new Error(`Secret "${name}" not found`)
    }

    // Decrypt data
    const masterKey = this.getMasterKey()
    const { decrypt: decryptFn } = await import("./encryption")
    const decryptedData = decryptFn(secret.encryptedData, secret.iv, secret.authTag, masterKey)

    return {
      id: secret.id,
      type: secret.type,
      metadata: secret.metadata,
      data: decryptedData,
    }
  }

  /**
   * Updates an existing secret
   * @param name - Secret name
   * @param data - Updated secret data (optional, only update if provided)
   * @param metadata - Updated metadata (optional, only update if provided)
   * @returns The updated secret (with encrypted data)
   * @throws Error if secret is not found or validation fails
   */
  async updateSecret(
    name: string,
    data?: SecretData,
    metadata?: { description?: string; tags?: string[] },
  ): Promise<Secret> {
    const existing = await this.registry.get(name)
    if (!existing) {
      throw new Error(`Secret "${name}" not found`)
    }

    // Update data if provided
    let encryptedData = existing.encryptedData
    let iv = existing.iv
    let authTag = existing.authTag
    const type = existing.type

    if (data) {
      // Validate new data
      validateSecretData(existing.type, data)

      // Encrypt new data
      const masterKey = this.getMasterKey()
      const encrypted = encrypt(data, masterKey)
      encryptedData = encrypted.encrypted
      iv = encrypted.iv
      authTag = encrypted.authTag
    }

    // Update metadata
    const updatedMetadata: SecretMetadata = {
      ...existing.metadata,
      description: metadata?.description !== undefined ? metadata.description : existing.metadata.description,
      tags: metadata?.tags !== undefined ? metadata.tags : existing.metadata.tags,
      updatedAt: Date.now(),
    }

    // Create updated secret
    const updatedSecret: Secret = {
      id: existing.id,
      type,
      metadata: updatedMetadata,
      encryptedData,
      iv,
      authTag,
    }

    // Update in registry
    await this.registry.update(name, updatedSecret)

    return updatedSecret
  }

  /**
   * Deletes a secret by name
   * @param name - Secret name
   * @returns true if secret was deleted, false if it didn't exist
   */
  async deleteSecret(name: string): Promise<boolean> {
    return await this.registry.delete(name)
  }

  /**
   * Lists all secrets (metadata only, no decrypted data)
   * @param filter - Optional filter by type or tags
   * @returns Array of secrets (with encrypted data, not decrypted)
   */
  async listSecrets(filter?: { type?: SecretType; tags?: string[] }): Promise<Secret[]> {
    return await this.registry.list(filter)
  }
}

