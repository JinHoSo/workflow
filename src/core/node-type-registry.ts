import type { NodeType, NodeTypeRegistry } from "../interfaces"

/**
 * Registry for managing node types
 * Allows registration and retrieval of node types by name and version
 * Supports semantic versioning and version resolution
 */
export class NodeTypeRegistryImpl implements NodeTypeRegistry {
  private nodeTypes: Map<string, NodeType> = new Map()

  /**
   * Retrieves a node type by name and optional version
   * If version is not specified, returns the latest version
   * @param name - Name of the node type
   * @param version - Optional version number (returns latest if not specified)
   * @returns Node type instance or undefined if not found
   */
  get(name: string, version?: number): NodeType | undefined {
    if (version !== undefined) {
      // Get specific version
      const key = `${name}@${version}`
      return this.nodeTypes.get(key)
    }

    // Get latest version
    return this.getLatestVersion(name)
  }

  /**
   * Gets the latest version of a node type
   * @param name - Name of the node type
   * @returns Latest node type instance or undefined
   */
  private getLatestVersion(name: string): NodeType | undefined {
    let latest: NodeType | undefined
    let latestVersion = 0

    for (const nodeType of this.nodeTypes.values()) {
      if (nodeType.metadata.name === name) {
        if (nodeType.metadata.version > latestVersion) {
          latestVersion = nodeType.metadata.version
          latest = nodeType
        }
      }
    }

    return latest
  }

  /**
   * Gets all registered node types
   * @returns Array of all registered node types
   */
  getAll(): NodeType[] {
    return Array.from(this.nodeTypes.values())
  }

  /**
   * Registers a new node type
   * Stores both versioned key (name@version) and unversioned key (name)
   * @param nodeType - Node type to register
   */
  register(nodeType: NodeType): void {
    const key = `${nodeType.metadata.name}@${nodeType.metadata.version}`
    this.nodeTypes.set(key, nodeType)
    // Also store with unversioned key for latest version lookup
    const existing = this.getLatestVersion(nodeType.metadata.name)
    if (!existing || nodeType.metadata.version > existing.metadata.version) {
      this.nodeTypes.set(nodeType.metadata.name, nodeType)
    }
  }

  /**
   * Unregisters a node type
   * @param name - Name of the node type
   * @param version - Optional version (unregisters specific version)
   */
  unregister(name: string, version?: number): void {
    if (version !== undefined) {
      const key = `${name}@${version}`
      this.nodeTypes.delete(key)
    } else {
      // Remove all versions
      const keysToDelete: string[] = []
      for (const key of this.nodeTypes.keys()) {
        if (key.startsWith(`${name}@`) || key === name) {
          keysToDelete.push(key)
        }
      }
      for (const key of keysToDelete) {
        this.nodeTypes.delete(key)
      }
    }
  }

  /**
   * Checks if a node type is registered
   * @param name - Name of the node type
   * @param version - Optional version
   * @returns true if node type is registered
   */
  has(name: string, version?: number): boolean {
    return this.get(name, version) !== undefined
  }
}
