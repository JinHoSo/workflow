import type { NodeType, NodeTypeRegistry } from "../interfaces"

/**
 * Registry for managing node types
 * Allows registration and retrieval of node types by name and version
 */
export class NodeTypeRegistryImpl implements NodeTypeRegistry {
  private nodeTypes: Map<string, NodeType> = new Map()

  /**
   * Retrieves a node type by name and optional version
   * @param name - Name of the node type
   * @param version - Optional version number (returns latest if not specified)
   * @returns Node type instance or undefined if not found
   */
  get(name: string, version?: number): NodeType | undefined {
    const key = version !== undefined ? `${name}@${version}` : name
    return this.nodeTypes.get(key)
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
    if (!this.nodeTypes.has(nodeType.metadata.name)) {
      this.nodeTypes.set(nodeType.metadata.name, nodeType)
    }
  }
}
