import type { Node } from "./node"
import type { NodeInput, NodeOutput } from "./node-execution-data"

/**
 * JSON Schema type definition
 * This is a generic type that matches any JSON Schema structure
 */
export type JsonSchema = Record<string, unknown>

/**
 * Metadata describing a node type
 */
export interface NodeTypeMetadata {
  /** Internal name of the node type */
  name: string
  /** Human-readable display name */
  displayName: string
  /** Optional description of what the node does */
  description?: string
  /** Version number of the node type */
  version: number
}

/**
 * Defines the behavior of a node type
 * Node types implement this interface to provide execution logic
 */
export interface NodeType {
  /** Metadata describing this node type */
  metadata: NodeTypeMetadata
  /** JSON Schema for node configuration validation */
  configurationSchema?: JsonSchema
  /**
   * Executes the node with given input data
   * @param node - The node instance to execute
   * @param inputData - Input data from connected nodes (port name based)
   * @returns Output data (port name based)
   */
  run(node: Node, inputData: NodeInput): Promise<NodeOutput> | NodeOutput
}

/**
 * Registry for managing node types
 * Allows registration and retrieval of node types by name and version
 * Supports plugin-based node type registration
 */
export interface NodeTypeRegistry {
  /**
   * Retrieves a node type by name and optional version
   * @param name - Name of the node type
   * @param version - Optional version number (returns latest if not specified)
   * @returns Node type instance or undefined if not found
   */
  get(name: string, version?: number): NodeType | undefined
  /**
   * Gets all registered node types
   * @returns Array of all registered node types
   */
  getAll(): NodeType[]
  /**
   * Registers a new node type
   * @param nodeType - Node type to register
   */
  register(nodeType: NodeType): void
  /**
   * Registers node types from a plugin
   * Creates NodeType instances from plugin's node classes and registers them
   * @param plugin - Plugin containing node type classes
   * @throws Error if node type metadata cannot be determined or registration fails
   */
  /**
   * Registers node types from a plugin
   * Plugin type is defined in @workflow/plugins package
   * This method is optional to avoid circular dependencies
   */
  registerFromPlugin?(plugin: unknown): void
  /**
   * Unregisters all node types from a plugin
   * @param pluginKey - Plugin key (name@version)
   */
  unregisterFromPlugin?(pluginKey: string): void
}

