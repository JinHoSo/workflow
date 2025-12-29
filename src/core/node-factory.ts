import type { Node, SerializedNode } from "../interfaces"
import type { NodeTypeRegistry } from "../interfaces/node-type"
import { BaseNode } from "./base-node"

/**
 * Node factory function type
 * Creates a node instance from serialized node data
 */
export type NodeFactoryFunction = (serializedNode: SerializedNode) => Node

/**
 * Node factory for creating node instances
 * Supports versioned node types and plugin-based node creation
 */
export class NodeFactory {
  private factories: Map<string, NodeFactoryFunction> = new Map()
  private nodeTypeRegistry?: NodeTypeRegistry

  /**
   * Sets the node type registry to use for node creation
   * @param registry - Node type registry instance
   */
  setNodeTypeRegistry(registry: NodeTypeRegistry): void {
    this.nodeTypeRegistry = registry
  }

  /**
   * Registers a factory function for a node type
   * @param nodeType - Node type name
   * @param version - Node type version
   * @param factory - Factory function
   */
  register(nodeType: string, version: number, factory: NodeFactoryFunction): void {
    const key = `${nodeType}@${version}`
    this.factories.set(key, factory)
  }

  /**
   * Creates a node instance from serialized node data
   * @param serializedNode - Serialized node data
   * @returns Node instance
   * @throws Error if node type is not found or factory is not registered
   */
  create(serializedNode: SerializedNode): Node {
    const { nodeType, version } = serializedNode.properties
    const key = `${nodeType}@${version}`

    // Try to get factory function
    const factory = this.factories.get(key)
    if (factory) {
      return factory(serializedNode)
    }

    // Try to get from node type registry if available
    if (this.nodeTypeRegistry) {
      const nodeTypeDef = this.nodeTypeRegistry.get(nodeType, version)
      if (nodeTypeDef) {
        // Create node instance from node type
        // This is a simplified version - full implementation would use node type's factory
        throw new Error(`Node type ${key} found in registry but factory not implemented`)
      }
    }

    throw new Error(`No factory registered for node type ${key}`)
  }

  /**
   * Creates a default factory that creates BaseNode instances
   * This is a fallback for nodes that don't have specific factories
   * @param serializedNode - Serialized node data
   * @returns BaseNode instance
   */
  createDefault(serializedNode: SerializedNode): BaseNode {
    // This creates a minimal BaseNode instance
    // Subclasses should override this or register proper factories
    return new (class extends BaseNode {
      protected async process(): Promise<import("../interfaces").NodeOutput> {
        return {}
      }
    })(serializedNode.properties)
  }
}

/**
 * Global node factory instance
 */
export const nodeFactory = new NodeFactory()

