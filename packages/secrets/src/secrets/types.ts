/**
 * Secret type identifiers
 */
export type SecretType = "apiKey" | "basicAuth" | "bearerToken" | "oauth" | "custom"

/**
 * API Key secret data structure
 */
export interface ApiKeySecretData {
  /** The API key value */
  value: string
}

/**
 * Basic Auth secret data structure
 */
export interface BasicAuthSecretData {
  /** Username for Basic Authentication */
  username: string
  /** Password for Basic Authentication */
  password: string
}

/**
 * Bearer Token secret data structure
 */
export interface BearerTokenSecretData {
  /** The bearer token value */
  token: string
  /** Optional token expiration timestamp (Unix epoch in milliseconds) */
  expiresAt?: number
}

/**
 * OAuth secret data structure
 */
export interface OAuthSecretData {
  /** OAuth client ID */
  clientId: string
  /** OAuth client secret */
  clientSecret: string
  /** Optional access token */
  accessToken?: string
  /** Optional refresh token */
  refreshToken?: string
  /** Optional token URL for OAuth flow */
  tokenUrl?: string
  /** Optional OAuth scopes */
  scopes?: string[]
}

/**
 * Custom secret data structure (arbitrary key-value pairs)
 */
export interface CustomSecretData {
  [key: string]: string | number | boolean
}

/**
 * Union type for all secret data structures
 */
export type SecretData =
  | ApiKeySecretData
  | BasicAuthSecretData
  | BearerTokenSecretData
  | OAuthSecretData
  | CustomSecretData

/**
 * Secret metadata
 */
export interface SecretMetadata {
  /** Secret name (unique identifier) */
  name: string
  /** Optional description */
  description?: string
  /** Optional tags for categorization */
  tags?: string[]
  /** Creation timestamp (Unix epoch in milliseconds) */
  createdAt: number
  /** Last update timestamp (Unix epoch in milliseconds) */
  updatedAt: number
}

/**
 * Secret interface representing a stored secret
 */
export interface Secret {
  /** Unique secret identifier */
  id: string
  /** Secret type */
  type: SecretType
  /** Secret metadata */
  metadata: SecretMetadata
  /** Encrypted secret data (base64 encoded) */
  encryptedData: string
  /** Initialization vector for encryption (base64 encoded) */
  iv: string
  /** Authentication tag for GCM mode (base64 encoded) */
  authTag: string
}

/**
 * Decrypted secret for internal use
 */
export interface DecryptedSecret {
  /** Unique secret identifier */
  id: string
  /** Secret type */
  type: SecretType
  /** Secret metadata */
  metadata: SecretMetadata
  /** Decrypted secret data */
  data: SecretData
}

