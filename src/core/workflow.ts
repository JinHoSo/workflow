import type {
  Workflow as IWorkflow,
  Node,
  WorkflowLinks,
  NodeTypeRegistry,
  DataRecord,
  WorkflowSettings,
  MockData,
  WorkflowExportData,
  SerializedNode,
  NodeFactory,
} from "../interfaces"
import { nodeFactory as defaultNodeFactory, NodeFactory as NodeFactoryClass } from "./node-factory"
import { WorkflowState } from "../interfaces"
import { LinkType } from "../types"
import { NodeTypeRegistryImpl } from "./node-type-registry"
import { mapLinksByTarget } from "./connection-utils"

/**
 * Workflow class representing a collection of connected nodes
 * Manages nodes, links, and workflow-level data
 */
export class Workflow implements IWorkflow {
  id: string
  name?: string
  nodes: { [nodeName: string]: Node }
  linksBySource: WorkflowLinks
  linksByTarget: WorkflowLinks
  nodeTypeRegistry: NodeTypeRegistry
  staticData: DataRecord
  settings: WorkflowSettings
  mockData?: MockData
  state: WorkflowState

  /**
   * Creates a new Workflow instance
   * @param id - Unique identifier for the workflow
   * @param nodeTypeRegistry - Optional node type registry (creates new one if not provided)
   * @param name - Optional workflow name
   * @param nodes - Initial nodes to add to the workflow
   * @param links - Initial links between nodes
   * @param staticData - Initial static data
   * @param settings - Workflow settings
   * @param mockData - Mock data for testing
   */
  constructor(
    id: string,
    nodeTypeRegistry?: NodeTypeRegistry,
    name?: string,
    nodes: Node[] = [],
    links: WorkflowLinks = {},
    staticData: DataRecord = {},
    settings: WorkflowSettings = {},
    mockData?: MockData,
  ) {
    this.id = id
    this.name = name
    this.nodeTypeRegistry = nodeTypeRegistry ?? new NodeTypeRegistryImpl()
    this.nodes = {}
    this.linksBySource = links
    this.linksByTarget = mapLinksByTarget(links)
    this.staticData = staticData
    this.settings = settings
    this.mockData = mockData
    this.state = WorkflowState.Idle

    for (const node of nodes) {
      this.addNode(node)
    }
  }

  /**
   * Adds a node to the workflow (regular node or trigger)
   * All nodes, including triggers, are stored in the unified nodes collection
   * Triggers are identified by the isTrigger property in their properties
   * @param node - Node instance to add (can be regular node or trigger)
   */
  addNode(node: Node): void {
    this.nodes[node.properties.name] = node
  }

  /**
   * Removes a node from the workflow and cleans up all its links
   * @param nodeName - Name of the node to remove
   */
  removeNode(nodeName: string): void {
    delete this.nodes[nodeName]
    delete this.linksBySource[nodeName]
    for (const sourceNode in this.linksBySource) {
      const links = this.linksBySource[sourceNode]
      for (const inputName in links) {
        links[inputName] = links[inputName].filter((link) => link.targetNode !== nodeName)
      }
    }
    this.linksByTarget = mapLinksByTarget(this.linksBySource)
  }

  /**
   * Connects an output port of one node to an input port of another node
   * Validates port types and creates bidirectional link indexes
   * @param sourceNodeName - Name of the source node
   * @param sourceOutputName - Name of the output port on the source node
   * @param targetNodeName - Name of the target node
   * @param targetInputName - Name of the input port on the target node
   * @param linkType - Type of link (defaults to Standard)
   * @throws Error if nodes not found, ports invalid, or types mismatch
   */
  linkNodes(
    sourceNodeName: string,
    sourceOutputName: string,
    targetNodeName: string,
    targetInputName: string,
    linkType: LinkType = LinkType.Standard,
  ): void {
    const sourceNode = this.nodes[sourceNodeName]
    const targetNode = this.nodes[targetNodeName]

    if (!sourceNode || !targetNode) {
      throw new Error("Source or target node not found")
    }

    const sourcePort = sourceNode.outputs.find((p) => p.name === sourceOutputName)
    if (!sourcePort) {
      throw new Error("Source output port not found")
    }

    const targetPort = targetNode.inputs.find((p) => p.name === targetInputName)
    if (!targetPort) {
      throw new Error("Target input port not found")
    }

    if (sourcePort.dataType !== targetPort.dataType) {
      throw new Error("Port type mismatch")
    }

    if (!this.linksBySource[sourceNodeName]) {
      this.linksBySource[sourceNodeName] = {}
    }

    if (!this.linksBySource[sourceNodeName][targetInputName]) {
      this.linksBySource[sourceNodeName][targetInputName] = []
    }

    this.linksBySource[sourceNodeName][targetInputName].push({
      targetNode: targetNodeName,
      linkType: linkType,
      outputPortName: sourceOutputName,
    })

    this.linksByTarget = mapLinksByTarget(this.linksBySource)
  }

  /**
   * Replaces all nodes in the workflow
   * @param nodes - Array of nodes to set
   */
  setNodes(nodes: Node[]): void {
    this.nodes = {}
    for (const node of nodes) {
      this.nodes[node.properties.name] = node
    }
  }

  /**
   * Sets all links in the workflow
   * Updates both source and target link indexes
   * @param links - Links indexed by source node
   */
  setLinks(links: WorkflowLinks): void {
    this.linksBySource = links
    this.linksByTarget = mapLinksByTarget(links)
  }

  /**
   * Sets mock data for testing
   * Mock data overrides node outputs during execution
   * @param mockData - Mock data indexed by node name
   */
  setMockData(mockData?: MockData): void {
    this.mockData = mockData
  }

  /**
   * Updates workflow settings
   * Merges new settings with existing ones
   * @param settings - Settings to update
   */
  updateSettings(settings: WorkflowSettings): void {
    this.settings = { ...this.settings, ...settings }
  }

  /**
   * Overrides static data with new values
   * Merges new static data with existing data
   * @param staticData - Static data to set
   */
  setStaticData(staticData: DataRecord): void {
    this.staticData = { ...this.staticData, ...staticData }
  }

  /**
   * Resets the workflow to initial state
   * Resets execution state and regular nodes (non-trigger nodes)
   * Trigger nodes are preserved to maintain their state and configuration
   */
  reset(): void {
    this.state = WorkflowState.Idle
    // Reset regular nodes only - triggers are identified by isTrigger property and preserved
    for (const nodeName in this.nodes) {
      const node = this.nodes[nodeName]
      // Skip trigger nodes - they maintain their state and configuration
      if (node.properties.isTrigger) {
        continue
      }
      if ("reset" in node && typeof node.reset === "function") {
        node.reset()
      }
    }
  }

  /**
   * Exports the workflow to JSON format
   * Serializes all workflow data (nodes, links, settings, staticData, mockData)
   * @returns JSON string representation of the workflow
   */
  export(): string {
    const exportData: WorkflowExportData = {
      version: 1,
      id: this.id,
      name: this.name,
      nodes: this.serializeNodes(),
      linksBySource: this.linksBySource,
      settings: this.settings,
      staticData: this.staticData,
      mockData: this.mockData,
    }
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Serializes all nodes in the workflow (both regular nodes and triggers)
   * @returns Array of serialized node data
   */
  private serializeNodes(): SerializedNode[] {
    const serializedNodes: SerializedNode[] = []
    // Serialize all nodes (including triggers) from unified collection
    for (const nodeName in this.nodes) {
      const node = this.nodes[nodeName]
      serializedNodes.push({
        properties: node.properties,
        config: node.config,
        inputs: node.inputs,
        outputs: node.outputs,
        annotation: node.annotation,
      })
    }
    return serializedNodes
  }

  /**
   * Imports a workflow from JSON format
   * Creates a new Workflow instance from serialized data
   * @param json - JSON string representation of the workflow
   * @param nodeFactory - Factory function to create node instances from serialized data
   * @param nodeTypeRegistry - Optional node type registry (creates new one if not provided)
   * @returns New Workflow instance
   * @throws Error if JSON is invalid, validation fails, or node types are missing
   */
  static import(
    json: string,
    nodeFactoryFn?: NodeFactory | NodeFactoryClass | ((serializedNode: SerializedNode) => Node),
    nodeTypeRegistry?: NodeTypeRegistry,
  ): Workflow {
    let exportData: WorkflowExportData
    try {
      exportData = JSON.parse(json)
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Validate export data structure
    Workflow.validateImportData(exportData)

    // Validate node types exist (if registry provided)
    if (nodeTypeRegistry) {
      Workflow.validateNodeTypes(exportData.nodes, nodeTypeRegistry)
    }

    // Reconstruct nodes using factory
    const nodes: Node[] = []
    if (nodeFactoryFn) {
      // Use provided factory (either function or NodeFactory instance)
      if (nodeFactoryFn instanceof NodeFactoryClass) {
        // NodeFactory instance
        for (const serializedNode of exportData.nodes) {
          nodes.push(nodeFactoryFn.create(serializedNode))
        }
      } else if (typeof nodeFactoryFn === "function") {
        // Plain function
        for (const serializedNode of exportData.nodes) {
          nodes.push(nodeFactoryFn(serializedNode))
        }
      } else {
        throw new Error("Invalid node factory: must be a function or NodeFactory instance")
      }
    } else {
      // Use default factory
      for (const serializedNode of exportData.nodes) {
        nodes.push(defaultNodeFactory.create(serializedNode))
      }
    }

    // Create workflow instance
    const workflow = new Workflow(
      exportData.id,
      nodeTypeRegistry,
      exportData.name,
      nodes,
      exportData.linksBySource,
      exportData.staticData,
      exportData.settings,
      exportData.mockData,
    )

    // Restore node configuration, ports, and annotation
    for (const serializedNode of exportData.nodes) {
      const node = workflow.nodes[serializedNode.properties.name]
      if (node) {
        // Restore ports (clear existing and add from serialized data)
        if ("inputs" in node && Array.isArray(node.inputs)) {
          node.inputs.length = 0
          for (const inputPort of serializedNode.inputs) {
            if ("addInput" in node && typeof node.addInput === "function") {
              node.addInput(inputPort.name, inputPort.dataType, inputPort.linkType)
            }
          }
        }
        if ("outputs" in node && Array.isArray(node.outputs)) {
          node.outputs.length = 0
          for (const outputPort of serializedNode.outputs) {
            if ("addOutput" in node && typeof node.addOutput === "function") {
              node.addOutput(outputPort.name, outputPort.dataType, outputPort.linkType)
            }
          }
        }
        // Restore configuration (nodes extend WorkflowNodeBase which has setup method)
        if ("setup" in node && typeof node.setup === "function") {
          node.setup(serializedNode.config)
        }
        // Restore annotation if present
        if (serializedNode.annotation && "setAnnotation" in node && typeof node.setAnnotation === "function") {
          node.setAnnotation(serializedNode.annotation)
        }
      }
    }

    // Validate links reference existing nodes
    Workflow.validateLinks(exportData.linksBySource, exportData.nodes)

    return workflow
  }

  /**
   * Validates imported workflow data structure
   * @param data - Import data to validate
   * @throws Error if validation fails
   */
  private static validateImportData(data: unknown): asserts data is WorkflowExportData {
    if (typeof data !== "object" || data === null) {
      throw new Error("Import data must be an object")
    }

    const exportData = data as Partial<WorkflowExportData>

    if (typeof exportData.version !== "number") {
      throw new Error("Missing or invalid version field")
    }

    if (exportData.version !== 1) {
      throw new Error(`Unsupported export format version: ${exportData.version}`)
    }

    if (typeof exportData.id !== "string") {
      throw new Error("Missing or invalid id field")
    }

    if (!Array.isArray(exportData.nodes)) {
      throw new Error("Missing or invalid nodes array")
    }

    if (typeof exportData.linksBySource !== "object" || exportData.linksBySource === null) {
      throw new Error("Missing or invalid linksBySource field")
    }

    if (typeof exportData.settings !== "object" || exportData.settings === null) {
      throw new Error("Missing or invalid settings field")
    }

    if (typeof exportData.staticData !== "object" || exportData.staticData === null) {
      throw new Error("Missing or invalid staticData field")
    }
  }

  /**
   * Validates that all node types exist in the registry
   * @param nodes - Serialized nodes to validate
   * @param registry - Node type registry
   * @throws Error if any node types are missing
   */
  private static validateNodeTypes(nodes: SerializedNode[], registry: NodeTypeRegistry): void {
    const missingTypes: string[] = []
    for (const node of nodes) {
      const nodeType = registry.get(node.properties.nodeType, node.properties.version)
      if (!nodeType) {
        missingTypes.push(`${node.properties.nodeType}@${node.properties.version}`)
      }
    }
    if (missingTypes.length > 0) {
      throw new Error(
        `Missing node types in registry: ${missingTypes.join(", ")}. Please ensure all node types are registered before importing.`,
      )
    }
  }

  /**
   * Validates that all link references point to existing nodes
   * @param links - Links to validate
   * @param nodes - Serialized nodes
   * @throws Error if any link references are invalid
   */
  private static validateLinks(links: WorkflowLinks, nodes: SerializedNode[]): void {
    const nodeNames = new Set(nodes.map((n) => n.properties.name))

    for (const sourceNodeName in links) {
      if (!nodeNames.has(sourceNodeName)) {
        throw new Error(`Link references non-existent source node: ${sourceNodeName}`)
      }

      const nodeLinks = links[sourceNodeName]
      for (const inputName in nodeLinks) {
        const linkArray = nodeLinks[inputName]
        for (const link of linkArray) {
          if (!nodeNames.has(link.targetNode)) {
            throw new Error(`Link references non-existent target node: ${link.targetNode}`)
          }
        }
      }
    }
  }
}
