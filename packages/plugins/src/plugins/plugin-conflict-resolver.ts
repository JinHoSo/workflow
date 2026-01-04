/**
 * Plugin conflict resolution
 * Handles conflicts when multiple plugins provide the same node type
 */

import type { Plugin, PluginManifest } from "./plugin-manifest"
import type { DiscoveredPlugin } from "./plugin-discovery"

/**
 * Conflict resolution strategy
 */
export type ConflictResolutionStrategy = "latest" | "first" | "explicit" | "error"

/**
 * Node type conflict information
 */
export interface NodeTypeConflict {
  /** Node type name that has conflicts */
  nodeType: string
  /** Plugins providing this node type */
  plugins: Array<{
    /** Plugin name */
    name: string
    /** Plugin version */
    version: string
    /** Plugin key (name@version) */
    key: string
  }>
  /** Selected plugin (after resolution) */
  selected?: string
}

/**
 * Conflict resolution result
 */
export interface ConflictResolutionResult {
  /** Whether conflicts were resolved */
  resolved: boolean
  /** List of conflicts found */
  conflicts: NodeTypeConflict[]
  /** Resolution strategy used */
  strategy: ConflictResolutionStrategy
  /** Errors if resolution failed */
  errors?: string[]
}

/**
 * Resolves conflicts between plugins
 */
export class PluginConflictResolver {
  private strategy: ConflictResolutionStrategy = "latest"
  private explicitSelections: Map<string, string> = new Map() // nodeType -> pluginKey

  /**
   * Sets the conflict resolution strategy
   * @param strategy - Resolution strategy
   */
  setStrategy(strategy: ConflictResolutionStrategy): void {
    this.strategy = strategy
  }

  /**
   * Explicitly selects a plugin for a node type
   * @param nodeType - Node type name
   * @param pluginKey - Plugin key (name@version)
   */
  selectPlugin(nodeType: string, pluginKey: string): void {
    this.explicitSelections.set(nodeType, pluginKey)
  }

  /**
   * Detects conflicts in discovered plugins
   * @param plugins - Array of discovered plugins
   * @returns Conflict resolution result
   */
  detectConflicts(plugins: DiscoveredPlugin[]): ConflictResolutionResult {
    const nodeTypeMap = new Map<string, Array<{ name: string; version: string; key: string }>>()

    // Build map of node types to plugins
    for (const plugin of plugins) {
      const key = `${plugin.name}@${plugin.version}`
      for (const nodeType of plugin.manifest.nodeTypes) {
        if (!nodeTypeMap.has(nodeType)) {
          nodeTypeMap.set(nodeType, [])
        }
        nodeTypeMap.get(nodeType)?.push({
          name: plugin.name,
          version: plugin.version,
          key,
        })
      }
    }

    // Find conflicts (node types provided by multiple plugins)
    const conflicts: NodeTypeConflict[] = []
    for (const [nodeType, pluginList] of nodeTypeMap.entries()) {
      if (pluginList.length > 1) {
        conflicts.push({
          nodeType,
          plugins: pluginList,
        })
      }
    }

    return {
      resolved: conflicts.length === 0,
      conflicts,
      strategy: this.strategy,
    }
  }

  /**
   * Resolves conflicts using the configured strategy
   * @param conflicts - Array of conflicts to resolve
   * @returns Resolution result
   */
  resolveConflicts(conflicts: NodeTypeConflict[]): ConflictResolutionResult {
    const errors: string[] = []

    for (const conflict of conflicts) {
      // Check for explicit selection first
      const explicit = this.explicitSelections.get(conflict.nodeType)
      if (explicit) {
        const found = conflict.plugins.find((p) => p.key === explicit)
        if (found) {
          conflict.selected = explicit
          continue
        } else {
          errors.push(
            `Explicitly selected plugin ${explicit} for node type ${conflict.nodeType} not found in conflicts`,
          )
        }
      }

      // Apply strategy
      switch (this.strategy) {
        case "latest":
          conflict.selected = this.selectLatest(conflict.plugins)
          break
        case "first":
          conflict.selected = conflict.plugins[0].key
          break
        case "explicit":
          errors.push(
            `No explicit selection for node type ${conflict.nodeType}. Available plugins: ${conflict.plugins.map((p) => p.key).join(", ")}`,
          )
          break
        case "error":
          errors.push(
            `Conflict detected for node type ${conflict.nodeType}. Multiple plugins provide it: ${conflict.plugins.map((p) => p.key).join(", ")}`,
          )
          break
      }
    }

    return {
      resolved: errors.length === 0,
      conflicts,
      strategy: this.strategy,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Selects the latest version plugin
   */
  private selectLatest(plugins: Array<{ version: string; key: string }>): string {
    let latest = plugins[0]

    for (const plugin of plugins) {
      if (this.compareVersions(plugin.version, latest.version) > 0) {
        latest = plugin
      }
    }

    return latest.key
  }

  /**
   * Compares two semantic versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split(".").map(Number)
    const parts2 = v2.split(".").map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0
      const part2 = parts2[i] || 0
      if (part1 > part2) return 1
      if (part1 < part2) return -1
    }

    return 0
  }

  /**
   * Gets conflict report as formatted string
   */
  getConflictReport(result: ConflictResolutionResult): string {
    if (result.conflicts.length === 0) {
      return "No conflicts detected."
    }

    const lines: string[] = []
    lines.push(`Found ${result.conflicts.length} conflict(s):`)

    for (const conflict of result.conflicts) {
      lines.push(`\n  Node Type: ${conflict.nodeType}`)
      lines.push(`    Provided by:`)
      for (const plugin of conflict.plugins) {
        const marker = plugin.key === conflict.selected ? "✓ (selected)" : ""
        lines.push(`      - ${plugin.key} ${marker}`)
      }
    }

    if (result.errors && result.errors.length > 0) {
      lines.push(`\nErrors:`)
      for (const error of result.errors) {
        lines.push(`  - ${error}`)
      }
    }

    return lines.join("\n")
  }
}

/**
 * Global conflict resolver instance
 */
export const pluginConflictResolver = new PluginConflictResolver()

