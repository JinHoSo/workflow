/**
 * Mock secret registry for testing
 */

import type { SecretRegistry } from "../interfaces"
import type { Secret, SecretType } from "../types"

export class MockSecretRegistry implements SecretRegistry {
  private secrets: Map<string, Secret> = new Map()

  async store(secret: Secret): Promise<void> {
    if (this.secrets.has(secret.metadata.name)) {
      throw new Error(`Secret ${secret.metadata.name} already exists`)
    }
    this.secrets.set(secret.metadata.name, secret)
  }

  async get(name: string): Promise<Secret | undefined> {
    return this.secrets.get(name)
  }

  async update(name: string, secret: Secret): Promise<void> {
    if (!this.secrets.has(name)) {
      throw new Error(`Secret ${name} does not exist`)
    }
    this.secrets.set(name, secret)
  }

  async delete(name: string): Promise<boolean> {
    return this.secrets.delete(name)
  }

  async list(filter?: { type?: SecretType; tags?: string[] }): Promise<Secret[]> {
    const secrets = Array.from(this.secrets.values())
    if (!filter) {
      return secrets
    }
    return secrets.filter((secret) => {
      if (filter.type && secret.type !== filter.type) {
        return false
      }
      if (filter.tags && filter.tags.length > 0) {
        const secretTags = secret.metadata.tags || []
        return filter.tags.some((tag) => secretTags.includes(tag))
      }
      return true
    })
  }

  clear() {
    this.secrets.clear()
  }
}

