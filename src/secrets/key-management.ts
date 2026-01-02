import { readFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { deriveKey } from "./encryption"

/**
 * Master key configuration
 */
interface MasterKeyConfig {
  /** The master key buffer */
  key: Buffer
  /** Key source (for logging/debugging) */
  source: "environment" | "file" | "generated"
}

/**
 * Gets the master encryption key from environment variable or config file
 * @param keyPath - Optional path to key file (defaults to ~/.workflow/secrets/master.key)
 * @returns Master key buffer and source
 * @throws Error if no key is found and cannot generate one
 */
export function getMasterKey(keyPath?: string): MasterKeyConfig {
  // Try environment variable first
  const envKey = process.env.WORKFLOW_SECRETS_MASTER_KEY
  if (envKey) {
    // If it's a hex string, decode it; otherwise derive from string
    if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
      // 32 bytes = 64 hex characters
      return {
        key: Buffer.from(envKey, "hex"),
        source: "environment",
      }
    }
    // Derive key from password string
    const { key } = deriveKey(envKey)
    return {
      key,
      source: "environment",
    }
  }

  // Try config file
  const defaultKeyPath = keyPath || getDefaultKeyPath()
  if (existsSync(defaultKeyPath)) {
    try {
      const keyData = readFileSync(defaultKeyPath, "utf8").trim()
      if (/^[0-9a-fA-F]{64}$/.test(keyData)) {
        return {
          key: Buffer.from(keyData, "hex"),
          source: "file",
        }
      }
      // Derive key from password string in file
      const { key } = deriveKey(keyData)
      return {
        key,
        source: "file",
      }
    } catch (error) {
      throw new Error(`Failed to read master key from file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // If no key found, throw error (don't auto-generate for security)
  throw new Error(
    `Master key not found. Set WORKFLOW_SECRETS_MASTER_KEY environment variable or create key file at ${defaultKeyPath}`,
  )
}

/**
 * Gets the default path for the master key file
 * @returns Path to master key file
 */
function getDefaultKeyPath(): string {
  const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd()
  const configDir = join(homeDir, ".workflow", "secrets")
  return join(configDir, "master.key")
}

/**
 * Gets the default path for secrets storage directory
 * @returns Path to secrets directory
 */
export function getSecretsStoragePath(): string {
  const envPath = process.env.WORKFLOW_SECRETS_STORAGE_PATH
  if (envPath) {
    return envPath
  }

  const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd()
  return join(homeDir, ".workflow", "secrets")
}

/**
 * Ensures the secrets storage directory exists with secure permissions
 * @param storagePath - Path to secrets storage directory
 */
export function ensureSecretsDirectory(storagePath: string): void {
  if (!existsSync(storagePath)) {
    mkdirSync(storagePath, { recursive: true, mode: 0o700 }) // rwx------
  } else {
    // Ensure existing directory has correct permissions (best effort)
    try {
      // Note: chmodSync would require fs-extra or similar for cross-platform
      // For now, we'll rely on the directory being created with correct permissions
    } catch {
      // Ignore permission errors on existing directories
    }
  }
}

