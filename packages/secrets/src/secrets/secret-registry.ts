import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from "fs"
import { join } from "path"
import type { Secret, SecretType } from "./types"
import type { SecretRegistry as ISecretRegistry } from "./interfaces"
import { getSecretsStoragePath, ensureSecretsDirectory } from "./key-management"

/**
 * File-based implementation of SecretRegistry
 * Stores secrets as encrypted JSON files
 */
export class FileSecretRegistry implements ISecretRegistry {
  private readonly storagePath: string

  /**
   * Creates a new file-based secret registry
   * @param storagePath - Optional custom storage path (defaults to ~/.workflow/secrets)
   */
  constructor(storagePath?: string) {
    this.storagePath = storagePath || getSecretsStoragePath()
    ensureSecretsDirectory(this.storagePath)
  }

  /**
   * Gets the file path for a secret
   * @param name - Secret name
   * @returns File path
   */
  private getSecretFilePath(name: string): string {
    // Sanitize name to prevent directory traversal
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, "_")
    return join(this.storagePath, `${sanitizedName}.json`)
  }

  /**
   * Stores a secret in the registry
   */
  async store(secret: Secret): Promise<void> {
    const filePath = this.getSecretFilePath(secret.metadata.name)

    // Check if secret already exists
    if (existsSync(filePath)) {
      throw new Error(`Secret "${secret.metadata.name}" already exists`)
    }

    // Write secret to file
    try {
      const secretData = JSON.stringify(secret, null, 2)
      writeFileSync(filePath, secretData, { mode: 0o600 }) // rw-------
    } catch (error) {
      throw new Error(`Failed to store secret: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Retrieves a secret by name
   */
  async get(name: string): Promise<Secret | undefined> {
    const filePath = this.getSecretFilePath(name)

    if (!existsSync(filePath)) {
      return undefined
    }

    try {
      const secretData = readFileSync(filePath, "utf8")
      return JSON.parse(secretData) as Secret
    } catch (error) {
      throw new Error(`Failed to read secret: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Updates an existing secret
   */
  async update(name: string, secret: Secret): Promise<void> {
    const filePath = this.getSecretFilePath(name)

    if (!existsSync(filePath)) {
      throw new Error(`Secret "${name}" does not exist`)
    }

    // Ensure the name matches
    if (secret.metadata.name !== name) {
      throw new Error(`Secret name mismatch: expected "${name}", got "${secret.metadata.name}"`)
    }

    // Update timestamp
    secret.metadata.updatedAt = Date.now()

    try {
      const secretData = JSON.stringify(secret, null, 2)
      writeFileSync(filePath, secretData, { mode: 0o600 })
    } catch (error) {
      throw new Error(`Failed to update secret: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Deletes a secret by name
   */
  async delete(name: string): Promise<boolean> {
    const filePath = this.getSecretFilePath(name)

    if (!existsSync(filePath)) {
      return false
    }

    try {
      unlinkSync(filePath)
      return true
    } catch (error) {
      throw new Error(`Failed to delete secret: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Lists all secrets (metadata only)
   */
  async list(filter?: { type?: SecretType; tags?: string[] }): Promise<Secret[]> {
    const secrets: Secret[] = []

    try {
      const files = readdirSync(this.storagePath)
      for (const file of files) {
        if (!file.endsWith(".json")) {
          continue
        }

        try {
          const filePath = join(this.storagePath, file)
          const secretData = readFileSync(filePath, "utf8")
          const secret = JSON.parse(secretData) as Secret

          // Apply filters
          if (filter) {
            if (filter.type && secret.type !== filter.type) {
              continue
            }
            if (filter.tags && filter.tags.length > 0) {
              const secretTags = secret.metadata.tags || []
              const hasAllTags = filter.tags.every((tag) => secretTags.includes(tag))
              if (!hasAllTags) {
                continue
              }
            }
          }

          secrets.push(secret)
        } catch {
          // Skip invalid secret files
          continue
        }
      }
    } catch (error) {
      throw new Error(`Failed to list secrets: ${error instanceof Error ? error.message : String(error)}`)
    }

    return secrets
  }
}

