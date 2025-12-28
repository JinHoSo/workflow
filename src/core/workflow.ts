import type {
  Workflow as IWorkflow,
  WorkflowNode,
  WorkflowLinks,
  NodeTypeRegistry,
  DataRecord,
  WorkflowSettings,
  PinData,
} from "../interfaces"
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
  nodes: { [nodeName: string]: WorkflowNode }
  linksBySource: WorkflowLinks
  linksByTarget: WorkflowLinks
  nodeTypeRegistry: NodeTypeRegistry
  staticData: DataRecord
  settings: WorkflowSettings
  pinData?: PinData
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
   * @param pinData - Pin data for testing
   */
  constructor(
    id: string,
    nodeTypeRegistry?: NodeTypeRegistry,
    name?: string,
    nodes: WorkflowNode[] = [],
    links: WorkflowLinks = {},
    staticData: DataRecord = {},
    settings: WorkflowSettings = {},
    pinData?: PinData,
  ) {
    this.id = id
    this.name = name
    this.nodeTypeRegistry = nodeTypeRegistry ?? new NodeTypeRegistryImpl()
    this.nodes = {}
    this.linksBySource = links
    this.linksByTarget = mapLinksByTarget(links)
    this.staticData = staticData
    this.settings = settings
    this.pinData = pinData
    this.state = WorkflowState.Idle

    for (const node of nodes) {
      this.addNode(node)
    }
  }

  /**
   * Adds a node to the workflow
   * @param node - Node instance to add
   */
  addNode(node: WorkflowNode): void {
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
    if (!this.nodes[sourceNodeName] || !this.nodes[targetNodeName]) {
      throw new Error("Source or target node not found")
    }

    const sourceNode = this.nodes[sourceNodeName]
    const targetNode = this.nodes[targetNodeName]

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
  setNodes(nodes: WorkflowNode[]): void {
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
   * Sets pin data for testing
   * Pin data overrides node outputs during execution
   * @param pinData - Pin data indexed by node name
   */
  setPinData(pinData?: PinData): void {
    this.pinData = pinData
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
   * Resets execution state and all nodes
   */
  reset(): void {
    this.state = WorkflowState.Idle
    for (const nodeName in this.nodes) {
      const node = this.nodes[nodeName]
      if ("reset" in node && typeof node.reset === "function") {
        node.reset()
      }
    }
  }
}
