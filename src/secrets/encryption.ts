import { createCipheriv, createDecipheriv, randomBytes } from "crypto"
import type { SecretData } from "./types"

/**
 * Encryption algorithm and key size
 */
const ALGORITHM = "aes-256-gcm"
const KEY_SIZE = 32 // 256 bits
const IV_SIZE = 12 // 96 bits for GCM (recommended)

/**
 * Encryption result containing encrypted data and metadata
 */
export interface EncryptionResult {
  /** Encrypted data (base64 encoded) */
  encrypted: string
  /** Initialization vector (base64 encoded) */
  iv: string
  /** Authentication tag (base64 encoded) */
  authTag: string
}

/**
 * Encrypts data using AES-256-GCM
 * @param data - Data to encrypt (will be JSON stringified)
 * @param key - Encryption key (must be 32 bytes for AES-256)
 * @returns Encryption result with encrypted data, IV, and auth tag
 * @throws Error if encryption fails
 */
export function encrypt(data: SecretData, key: Buffer): EncryptionResult {
  if (key.length !== KEY_SIZE) {
    throw new Error(`Encryption key must be ${KEY_SIZE} bytes (256 bits)`)
  }

  try {
    // Generate random IV
    const iv = randomBytes(IV_SIZE)

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv)

    // Encrypt data
    const dataString = JSON.stringify(data)
    let encrypted = cipher.update(dataString, "utf8", "base64")
    encrypted += cipher.final("base64")

    // Get authentication tag
    const authTag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
    }
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Decrypts data using AES-256-GCM
 * @param encrypted - Encrypted data (base64 encoded)
 * @param iv - Initialization vector (base64 encoded)
 * @param authTag - Authentication tag (base64 encoded)
 * @param key - Decryption key (must be 32 bytes for AES-256)
 * @returns Decrypted and parsed secret data
 * @throws Error if decryption fails or authentication fails
 */
export function decrypt(
  encrypted: string,
  iv: string,
  authTag: string,
  key: Buffer,
): SecretData {
  if (key.length !== KEY_SIZE) {
    throw new Error(`Decryption key must be ${KEY_SIZE} bytes (256 bits)`)
  }

  try {
    // Convert base64 strings to buffers
    const ivBuffer = Buffer.from(iv, "base64")
    const authTagBuffer = Buffer.from(authTag, "base64")
    const encryptedBuffer = Buffer.from(encrypted, "base64")

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, ivBuffer)
    decipher.setAuthTag(authTagBuffer)

    // Decrypt data
    let decrypted = decipher.update(encryptedBuffer, undefined, "utf8")
    decrypted += decipher.final("utf8")

    // Parse JSON
    return JSON.parse(decrypted) as SecretData
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unsupported state")) {
      throw new Error("Decryption failed: Authentication tag mismatch - data may be corrupted or key is incorrect")
    }
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Generates a random encryption key
 * @returns 32-byte (256-bit) random key
 */
export function generateKey(): Buffer {
  return randomBytes(KEY_SIZE)
}

/**
 * Derives an encryption key from a password or master key string
 * Uses PBKDF2 with SHA-256
 * @param masterKey - Master key string (password)
 * @param salt - Optional salt (if not provided, generates a random one)
 * @returns Derived key (32 bytes) and salt
 */
export function deriveKey(masterKey: string, salt?: Buffer): { key: Buffer; salt: Buffer } {
  const crypto = require("crypto")
  const SALT_SIZE = 16
  const ITERATIONS = 100000

  const saltBuffer = salt || randomBytes(SALT_SIZE)
  const key = crypto.pbkdf2Sync(masterKey, saltBuffer, ITERATIONS, KEY_SIZE, "sha256")

  return { key, salt: saltBuffer }
}

