import type { NodeType, NodeTypeRegistry, NodeInput, NodeOutput, Node } from "@workflow/interfaces"
import type { Plugin } from "@workflow/plugins"
import { BaseNode } from "./base-node"

/**
 * Registry for managing node types
 * Allows registration and retrieval of node types by name and version
 * Supports semantic versioning and version resolution
 * Supports plugin-based node type registration
 */
export class NodeTypeRegistryImpl implements NodeTypeRegistry {
  private nodeTypes: Map<string, NodeType> = new Map()
  /** Map of plugin keys to node type keys for cleanup */
  private pluginNodeTypes: Map<string, string[]> = new Map()

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

  /**
   * Registers node types from a plugin
   * Creates NodeType instances from plugin's node classes and registers them
   * @param plugin - Plugin containing node type classes
   * @throws Error if node type metadata cannot be determined or registration fails
   */
  registerFromPlugin(plugin: Plugin): void {
    const pluginKey = `${plugin.manifest.name}@${plugin.manifest.version}`
    const registeredKeys: string[] = []

    for (const NodeClass of plugin.nodeTypes) {
      // Create NodeType instance from node class
      const nodeType = this.createNodeTypeFromClass(NodeClass, plugin.manifest.name)

      // Register the node type
      this.register(nodeType)

      const nodeTypeKey = `${nodeType.metadata.name}@${nodeType.metadata.version}`
      registeredKeys.push(nodeTypeKey)
    }

    // Track which node types came from this plugin for cleanup
    this.pluginNodeTypes.set(pluginKey, registeredKeys)
  }

  /**
   * Unregisters all node types from a plugin
   * @param pluginKey - Plugin key (name@version)
   */
  unregisterFromPlugin(pluginKey: string): void {
    const nodeTypeKeys = this.pluginNodeTypes.get(pluginKey)
    if (nodeTypeKeys) {
      for (const key of nodeTypeKeys) {
        const [name, versionStr] = key.split("@")
        const version = versionStr ? Number.parseInt(versionStr, 10) : undefined
        this.unregister(name, version)
      }
      this.pluginNodeTypes.delete(pluginKey)
    }
  }

  /**
   * Creates a NodeType instance from a BaseNode class
   * Extracts metadata from the class and creates a wrapper that implements NodeType interface
   * @param NodeClass - Node class constructor
   * @param pluginName - Name of the plugin providing this node type
   * @returns NodeType instance
   */
  private createNodeTypeFromClass(
    NodeClass: new (properties: import("@workflow/interfaces").NodeProperties) => BaseNode,
    pluginName: string,
  ): NodeType {
    // Extract node type name from class name (e.g., "JavaScriptNode" -> "javascript")
    const nodeTypeName = NodeClass.name
      .replace(/Node$/, "")
      .replace(/([A-Z])/g, "-$1")
      .toLowerCase()
      .replace(/^-/, "")

    // Create a temporary instance to extract configuration schema if available
    // We'll use a minimal properties object - the actual node will be created with proper properties later
    const tempProperties: import("@workflow/interfaces").NodeProperties = {
      id: "temp-id",
      name: "temp",
      nodeType: nodeTypeName,
      version: 1,
      position: [0, 0],
      isTrigger: false,
    }
    const tempInstance = new NodeClass(tempProperties)

    // Get configuration schema if available (BaseNode has a protected configurationSchema property)
    // We need to access it through a type assertion since it's protected
    type BaseNodeWithSchema = BaseNode & {
      configurationSchema?: import("@workflow/interfaces").JsonSchema
    }
    const configurationSchema = (tempInstance as BaseNodeWithSchema).configurationSchema

    // Create NodeType metadata
    const metadata: import("@workflow/interfaces").NodeTypeMetadata = {
      name: nodeTypeName,
      displayName: NodeClass.name.replace(/([A-Z])/g, " $1").trim(),
      description: `Node type provided by plugin ${pluginName}`,
      version: 1, // Default version, can be enhanced to extract from class
    }

    // Create NodeType instance that wraps the node class
    return {
      metadata,
      configurationSchema,
      /**
       * Runs the node with given input data
       * Creates a node instance and executes it
       */
      async run(node: Node, inputData: NodeInput): Promise<NodeOutput> {
        // If node is already an instance of the correct class, use it directly
        if (node instanceof NodeClass) {
          const executionContext: import("@workflow/interfaces").ExecutionContext = {
            input: inputData,
            state: {}, // State will be provided by execution engine
          }
          return await node.run(executionContext)
        }

        // Otherwise, create a new instance (this shouldn't normally happen)
        // but we support it for flexibility
        const nodeInstance = new NodeClass(node.properties)
        if ("setup" in nodeInstance && typeof nodeInstance.setup === "function") {
          nodeInstance.setup(node.config)
        }
        const executionContext: import("@workflow/interfaces").ExecutionContext = {
          input: inputData,
          state: {},
        }
        return await nodeInstance.run(executionContext)
      },
    }
  }
}
