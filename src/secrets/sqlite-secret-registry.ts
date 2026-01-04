import { Database } from "sqlite3"
import { join } from "path"
import { existsSync, mkdirSync, chmodSync } from "fs"
import type { Secret, SecretType } from "./types"
import type { SecretRegistry as ISecretRegistry } from "./interfaces"
import { getSecretsStoragePath, ensureSecretsDirectory } from "./key-management"

/**
 * SQLite-based implementation of SecretRegistry
 * Stores secrets in an encrypted SQLite database
 */
export class SqliteSecretRegistry implements ISecretRegistry {
  private readonly dbPath: string
  private db: Database | null = null

  /**
   * Creates a new SQLite-based secret registry
   * @param dbPath - Optional custom database path (defaults to storagePath/secrets.db)
   * @param storagePath - Optional storage path (defaults to getSecretsStoragePath())
   */
  constructor(dbPath?: string, storagePath?: string) {
    if (dbPath) {
      this.dbPath = dbPath
    } else {
      const basePath = storagePath || getSecretsStoragePath()
      ensureSecretsDirectory(basePath)
      this.dbPath = join(basePath, "secrets.db")
    }
    this.initializeDatabase()
  }

  /**
   * Initializes the SQLite database and creates schema if needed
   */
  private initializeDatabase(): void {
    try {
      // Ensure directory exists
      const dir = join(this.dbPath, "..")
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true, mode: 0o700 })
      }

      // Open database
      this.db = new Database(this.dbPath, (err) => {
        if (err) {
          throw new Error(`Failed to open SQLite database: ${err.message}`)
        }
      })

      // Set secure file permissions (best effort, may fail on some systems)
      try {
        chmodSync(this.dbPath, 0o600) // rw-------
      } catch {
        // Ignore permission errors
      }

      // Create schema
      this.createSchema()
    } catch (error) {
      throw new Error(
        `Failed to initialize SQLite database: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /**
   * Creates the database schema
   * Uses IF NOT EXISTS to handle concurrent schema creation gracefully
   */
  private createSchema(): void {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    // Create secrets table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS secrets (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        encrypted_data TEXT NOT NULL,
        iv TEXT NOT NULL,
        auth_tag TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `

    // Create index on name for faster lookups
    const createIndexSQL = `CREATE INDEX IF NOT EXISTS idx_secrets_name ON secrets(name)`

    // Create index on type for filtering
    const createTypeIndexSQL = `CREATE INDEX IF NOT EXISTS idx_secrets_type ON secrets(type)`

    // Execute schema creation synchronously (schema creation should be fast)
    // Use IF NOT EXISTS to handle concurrent creation gracefully
    this.db.serialize(() => {
      this.db!.run(createTableSQL, (err) => {
        if (err && !err.message.includes("already exists")) {
          // Ignore "already exists" errors, but log others
          console.warn(`Warning: Failed to create secrets table: ${err.message}`)
        }
      })
      this.db!.run(createIndexSQL, (err) => {
        if (err && !err.message.includes("already exists")) {
          // Ignore "already exists" errors, but log others
          console.warn(`Warning: Failed to create name index: ${err.message}`)
        }
      })
      this.db!.run(createTypeIndexSQL, (err) => {
        if (err && !err.message.includes("already exists")) {
          // Ignore "already exists" errors, but log others
          console.warn(`Warning: Failed to create type index: ${err.message}`)
        }
      })
    })
  }

  /**
   * Gets the database connection (ensures it's initialized)
   */
  private getDatabase(): Database {
    if (!this.db) {
      throw new Error("Database not initialized")
    }
    return this.db
  }

  /**
   * Stores a secret in the registry
   */
  async store(secret: Secret): Promise<void> {
    const db = this.getDatabase()

    // Serialize tags array to JSON string
    const tagsJson = secret.metadata.tags ? JSON.stringify(secret.metadata.tags) : null

    const sql = `
      INSERT INTO secrets (
        id, name, type, encrypted_data, iv, auth_tag,
        description, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    return new Promise<void>((resolve, reject) => {
      db.run(
        sql,
        [
          secret.id,
          secret.metadata.name,
          secret.type,
          secret.encryptedData, // Already base64 string
          secret.iv, // Already base64 string
          secret.authTag, // Already base64 string
          secret.metadata.description || null,
          tagsJson,
          secret.metadata.createdAt,
          secret.metadata.updatedAt,
        ],
        function (err) {
          if (err) {
            if (err.message.includes("UNIQUE constraint")) {
              reject(new Error(`Secret "${secret.metadata.name}" already exists`))
            } else {
              reject(new Error(`Failed to store secret: ${err.message}`))
            }
          } else {
            resolve()
          }
        },
      )
    })
  }

  /**
   * Retrieves a secret by name
   */
  async get(name: string): Promise<Secret | undefined> {
    const db = this.getDatabase()

    const sql = `SELECT * FROM secrets WHERE name = ?`

    return new Promise<Secret | undefined>((resolve, reject) => {
      db.get(
        sql,
        [name],
        (err, row: unknown) => {
          if (err) {
            reject(new Error(`Failed to read secret: ${err.message}`))
            return
          }

          if (!row) {
            resolve(undefined)
            return
          }

          const r = row as {
            id: string
            name: string
            type: string
            encrypted_data: string
            iv: string
            auth_tag: string
            description: string | null
            tags: string | null
            created_at: number
            updated_at: number
          }

          // Parse tags from JSON string
          let tags: string[] | undefined
          if (r.tags) {
            try {
              tags = JSON.parse(r.tags) as string[]
            } catch {
              tags = undefined
            }
          }

          resolve({
            id: r.id,
            type: r.type as SecretType,
            metadata: {
              name: r.name,
              description: r.description || undefined,
              tags,
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            },
            encryptedData: r.encrypted_data, // Already base64 string
            iv: r.iv, // Already base64 string
            authTag: r.auth_tag, // Already base64 string
          })
        },
      )
    })
  }

  /**
   * Updates an existing secret
   */
  async update(name: string, secret: Secret): Promise<void> {
    const db = this.getDatabase()

    // Ensure the name matches
    if (secret.metadata.name !== name) {
      throw new Error(`Secret name mismatch: expected "${name}", got "${secret.metadata.name}"`)
    }

    // Serialize tags array to JSON string
    const tagsJson = secret.metadata.tags ? JSON.stringify(secret.metadata.tags) : null

    const sql = `
      UPDATE secrets SET
        type = ?,
        encrypted_data = ?,
        iv = ?,
        auth_tag = ?,
        description = ?,
        tags = ?,
        updated_at = ?
      WHERE name = ?
    `

    return new Promise<void>((resolve, reject) => {
      db.run(
        sql,
        [
          secret.type,
          secret.encryptedData, // Already base64 string
          secret.iv, // Already base64 string
          secret.authTag, // Already base64 string
          secret.metadata.description || null,
          tagsJson,
          secret.metadata.updatedAt,
          name,
        ],
        function (err) {
          if (err) {
            reject(new Error(`Failed to update secret: ${err.message}`))
            return
          }

          // Check if any rows were updated
          if (this.changes === 0) {
            reject(new Error(`Secret "${name}" does not exist`))
            return
          }

          resolve()
        },
      )
    })
  }

  /**
   * Deletes a secret by name
   */
  async delete(name: string): Promise<boolean> {
    const db = this.getDatabase()

    const sql = `DELETE FROM secrets WHERE name = ?`

    return new Promise<boolean>((resolve, reject) => {
      db.run(sql, [name], function (err) {
        if (err) {
          reject(new Error(`Failed to delete secret: ${err.message}`))
          return
        }

        resolve(this.changes > 0)
      })
    })
  }

  /**
   * Lists all secrets (metadata only)
   */
  async list(filter?: { type?: SecretType; tags?: string[] }): Promise<Secret[]> {
    const db = this.getDatabase()

    let sql = `SELECT * FROM secrets WHERE 1=1`
    const params: unknown[] = []

    if (filter?.type) {
      sql += ` AND type = ?`
      params.push(filter.type)
    }

    // Note: SQLite doesn't have great JSON support, so we'll filter tags in memory
    // For better performance with many secrets, we could use a separate tags table
    sql += ` ORDER BY name`

    return new Promise<Secret[]>((resolve, reject) => {
      db.all(
        sql,
        params,
        (err, rows: unknown) => {
          if (err) {
            reject(new Error(`Failed to list secrets: ${err.message}`))
            return
          }

          const r = rows as Array<{
            id: string
            name: string
            type: string
            encrypted_data: string
            iv: string
            auth_tag: string
            description: string | null
            tags: string | null
            created_at: number
            updated_at: number
          }>

          const secrets: Secret[] = []

          for (const row of r) {
            // Parse tags from JSON string
            let tags: string[] | undefined
            if (row.tags) {
              try {
                tags = JSON.parse(row.tags) as string[]
              } catch {
                tags = undefined
              }
            }

            // Apply tag filter if specified
            if (filter?.tags && filter.tags.length > 0) {
              const secretTags = tags || []
              const hasAllTags = filter.tags.every((tag) => secretTags.includes(tag))
              if (!hasAllTags) {
                continue
              }
            }

            secrets.push({
              id: row.id,
              type: row.type as SecretType,
              metadata: {
                name: row.name,
                description: row.description || undefined,
                tags,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
              },
              encryptedData: row.encrypted_data, // Already base64 string
              iv: row.iv, // Already base64 string
              authTag: row.auth_tag, // Already base64 string
            })
          }

          resolve(secrets)
        },
      )
    })
  }

  /**
   * Closes the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error(`Error closing database: ${err.message}`)
        }
      })
      this.db = null
    }
  }
}

