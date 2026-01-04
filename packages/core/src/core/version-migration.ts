import type { Node, SerializedNode, NodeTypeRegistry } from "@workflow/interfaces"
import { versionCompatibilityTracker } from "./version-compatibility"

/**
 * Migration result
 */
export interface MigrationResult {
  /** Whether migration was successful */
  success: boolean
  /** Migrated node data */
  migratedNode?: SerializedNode
  /** Migration messages */
  messages: string[]
  /** Errors encountered during migration */
  errors: string[]
}

/**
 * Version migration utilities for node types
 * Handles migration of nodes from one version to another
 */
export class VersionMigration {
  /**
   * Migrates a node from one version to another
   * @param node - Node to migrate
   * @param targetVersion - Target version to migrate to
   * @param registry - Node type registry
   * @returns Migration result
   */
  migrateNode(
    node: Node | SerializedNode,
    targetVersion: number,
    registry: NodeTypeRegistry,
  ): MigrationResult {
    const messages: string[] = []
    // errors will be populated if migration fails - initialized here for early returns
    let errors: string[] = []

    // Get node type information
    const nodeTypeName = node.properties.nodeType
    const currentVersion = node.properties.version

    // Check if migration is needed
    if (currentVersion === targetVersion) {
      return {
        success: true,
        messages: [`Node ${node.properties.name} is already at version ${targetVersion}`],
        errors: [],
      }
    }

    // Check compatibility
    const canMigrate = versionCompatibilityTracker.canMigrate(
      nodeTypeName,
      currentVersion,
      targetVersion,
    )

    if (!canMigrate) {
      const compatibility = versionCompatibilityTracker.checkCompatibility(
        nodeTypeName,
        currentVersion,
        targetVersion,
      )

      errors = [
        `Cannot migrate node ${node.properties.name} from version ${currentVersion} to ${targetVersion}: ${compatibility?.migrationRequired || "Incompatible versions"}`,
      ]
      return {
        success: false,
        errors,
        messages: [],
      }
    }

    // Get target node type
    const targetNodeType = registry.get(nodeTypeName, targetVersion)
    if (!targetNodeType) {
      errors = [`Target node type ${nodeTypeName}@${targetVersion} not found in registry`]
      return {
        success: false,
        errors,
        messages: [],
      }
    }

    // Perform migration
    try {
      const migratedNode = this.performMigration(node, targetVersion, targetNodeType)
      messages.push(
        `Successfully migrated node ${node.properties.name} from version ${currentVersion} to ${targetVersion}`,
      )

      return {
        success: true,
        migratedNode,
        messages,
        errors: [],
      }
    } catch (error) {
      errors = [
        `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
      ]
      return {
        success: false,
        errors,
        messages,
      }
    }
  }

  /**
   * Performs the actual migration of node data
   * @param node - Node to migrate
   * @param targetVersion - Target version
   * @param targetNodeType - Target node type
   * @returns Migrated serialized node
   */
  private performMigration(
    node: Node | SerializedNode,
    targetVersion: number,
    targetNodeType: import("@workflow/interfaces").NodeType,
  ): SerializedNode {
    // Create migrated node with updated version
    const migratedNode: SerializedNode = {
      properties: {
        ...node.properties,
        version: targetVersion,
      },
      config: { ...node.config },
      inputs: [...node.inputs],
      outputs: [...node.outputs],
      annotation: node.annotation,
    }

    // Apply schema-based migration if target node type has a schema
    if (targetNodeType.configurationSchema) {
      // Validate and potentially transform configuration
      // This is a simplified version - full implementation would use schema transformation
      migratedNode.config = this.migrateConfiguration(
        node.config,
        targetNodeType.configurationSchema,
      )
    }

    return migratedNode
  }

  /**
   * Migrates node configuration based on schema
   * @param config - Current configuration
   * @param schema - Target schema
   * @returns Migrated configuration
   */
  private migrateConfiguration(
    config: import("@workflow/interfaces").NodeConfiguration,
    schema: import("@workflow/interfaces").JsonSchema,
  ): import("@workflow/interfaces").NodeConfiguration {
    // Basic migration: keep existing config values that are still valid
    // Remove invalid properties based on schema
    const migrated: import("@workflow/interfaces").NodeConfiguration = {}

    if (schema.properties && typeof schema.properties === "object") {
      for (const key in config) {
        if (key in schema.properties) {
          migrated[key] = config[key]
        }
      }
    } else {
      // If no schema properties defined, keep all config
      return { ...config }
    }

    return migrated
  }

  /**
   * Migrates multiple nodes in a workflow
   * @param nodes - Array of nodes to migrate
   * @param targetVersion - Target version (applies to all nodes of the same type)
   * @param registry - Node type registry
   * @returns Map of node names to migration results
   */
  migrateNodes(
    nodes: (Node | SerializedNode)[],
    targetVersion: number,
    registry: NodeTypeRegistry,
  ): Map<string, MigrationResult> {
    const results = new Map<string, MigrationResult>()

    for (const node of nodes) {
      const result = this.migrateNode(node, targetVersion, registry)
      results.set(node.properties.name, result)
    }

    return results
  }

  /**
   * Migrates nodes to their latest versions
   * @param nodes - Array of nodes to migrate
   * @param registry - Node type registry
   * @returns Map of node names to migration results
   */
  migrateToLatest(nodes: (Node | SerializedNode)[], registry: NodeTypeRegistry): Map<string, MigrationResult> {
    const results = new Map<string, MigrationResult>()

    for (const node of nodes) {
      const nodeTypeName = node.properties.nodeType
      const latestNodeType = registry.get(nodeTypeName) // Get latest version

      if (latestNodeType) {
        const targetVersion = latestNodeType.metadata.version
        const result = this.migrateNode(node, targetVersion, registry)
        results.set(node.properties.name, result)
      } else {
        results.set(node.properties.name, {
          success: false,
          errors: [`Node type ${nodeTypeName} not found in registry`],
          messages: [],
        })
      }
    }

    return results
  }
}

/**
 * Global version migration instance
 */
export const versionMigration = new VersionMigration()

