import type { ExternalSecretProvider } from "./interfaces"
import type { SecretData } from "./types"

/**
 * Mock external secret provider for testing
 * Simulates an external secret provider like HashiCorp Vault or AWS Secrets Manager
 */
export class MockExternalSecretProvider implements ExternalSecretProvider {
  readonly name: string
  private secrets: Map<string, SecretData> = new Map()
  private available: boolean = true

  /**
   * Creates a new mock external secret provider
   * @param name - Provider name
   */
  constructor(name: string = "mock") {
    this.name = name
  }

  /**
   * Adds a secret to the mock provider
   * @param secretName - Secret name
   * @param data - Secret data
   */
  addSecret(secretName: string, data: SecretData): void {
    this.secrets.set(secretName, data)
  }

  /**
   * Removes a secret from the mock provider
   * @param secretName - Secret name
   */
  removeSecret(secretName: string): void {
    this.secrets.delete(secretName)
  }

  /**
   * Sets the availability status of the provider
   * @param available - Whether the provider is available
   */
  setAvailable(available: boolean): void {
    this.available = available
  }

  /**
   * Clears all secrets from the mock provider
   */
  clear(): void {
    this.secrets.clear()
  }

  /**
   * Retrieves a secret from the external provider
   */
  async getSecret(secretName: string): Promise<SecretData | undefined> {
    if (!this.available) {
      throw new Error(`Provider ${this.name} is not available`)
    }
    return this.secrets.get(secretName)
  }

  /**
   * Checks if the provider is available and configured
   */
  async isAvailable(): Promise<boolean> {
    return this.available
  }
}

