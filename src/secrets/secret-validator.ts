import type { SecretType, SecretData, ApiKeySecretData, BasicAuthSecretData, BearerTokenSecretData, OAuthSecretData, CustomSecretData } from "./types"

/**
 * Validates secret data based on secret type
 * @param type - Secret type
 * @param data - Secret data to validate
 * @throws Error if validation fails
 */
export function validateSecretData(type: SecretType, data: SecretData): void {
  switch (type) {
    case "apiKey": {
      const apiKeyData = data as ApiKeySecretData
      if (!apiKeyData.value || typeof apiKeyData.value !== "string" || apiKeyData.value.trim().length === 0) {
        throw new Error("API Key secret must have a non-empty 'value' field")
      }
      break
    }

    case "basicAuth": {
      const basicAuthData = data as BasicAuthSecretData
      if (!basicAuthData.username || typeof basicAuthData.username !== "string" || basicAuthData.username.trim().length === 0) {
        throw new Error("Basic Auth secret must have a non-empty 'username' field")
      }
      if (!basicAuthData.password || typeof basicAuthData.password !== "string") {
        throw new Error("Basic Auth secret must have a 'password' field")
      }
      break
    }

    case "bearerToken": {
      const bearerTokenData = data as BearerTokenSecretData
      if (!bearerTokenData.token || typeof bearerTokenData.token !== "string" || bearerTokenData.token.trim().length === 0) {
        throw new Error("Bearer Token secret must have a non-empty 'token' field")
      }
      if (bearerTokenData.expiresAt !== undefined && typeof bearerTokenData.expiresAt !== "number") {
        throw new Error("Bearer Token 'expiresAt' field must be a number (Unix timestamp in milliseconds)")
      }
      break
    }

    case "oauth": {
      const oauthData = data as OAuthSecretData
      if (!oauthData.clientId || typeof oauthData.clientId !== "string" || oauthData.clientId.trim().length === 0) {
        throw new Error("OAuth secret must have a non-empty 'clientId' field")
      }
      if (!oauthData.clientSecret || typeof oauthData.clientSecret !== "string" || oauthData.clientSecret.trim().length === 0) {
        throw new Error("OAuth secret must have a non-empty 'clientSecret' field")
      }
      if (oauthData.scopes !== undefined && !Array.isArray(oauthData.scopes)) {
        throw new Error("OAuth 'scopes' field must be an array of strings")
      }
      break
    }

    case "custom": {
      const customData = data as CustomSecretData
      const keys = Object.keys(customData)
      if (keys.length === 0) {
        throw new Error("Custom secret must have at least one field")
      }
      // Validate that all values are primitive types
      for (const key of keys) {
        const value = customData[key]
        if (value !== null && typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
          throw new Error(`Custom secret field "${key}" must be a string, number, or boolean`)
        }
      }
      break
    }

    default:
      throw new Error(`Unknown secret type: ${type}`)
  }
}

/**
 * Gets a field value from secret data
 * @param data - Secret data
 * @param fieldName - Field name to retrieve
 * @returns Field value, or undefined if field doesn't exist
 */
export function getSecretField(data: SecretData, fieldName: string): string | number | boolean | undefined {
  if (fieldName in data) {
    const value = (data as Record<string, unknown>)[fieldName]
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value
    }
  }
  return undefined
}

