import type { Node } from "./node"
import type { WorkflowLinks } from "./connection"
import type { NodeTypeRegistry } from "./node-type"
import type { DataRecord } from "./node-execution-data"
import type { NodeOutput } from "./node-execution-data"
import type { NodeProperties, NodeConfiguration } from "./node"
import type { InputPort, OutputPort } from "./port"

/**
 * Execution state of a workflow
 */
export enum WorkflowState {
  /** Workflow is idle, not executing */
  Idle = "idle",
  /** Workflow is currently executing */
  Running = "running",
  /** Workflow execution completed successfully */
  Completed = "completed",
  /** Workflow execution failed with an error */
  Failed = "failed",
}

/**
 * Workflow-level settings
 */
export interface WorkflowSettings {
  /** Timezone for workflow execution (e.g., "America/New_York") */
  timezone?: string
  /** Maximum number of nodes that can execute in parallel (0 = unlimited, default: unlimited) */
  maxParallelExecutions?: number
  /** Whether parallel execution is enabled (default: true) */
  enableParallelExecution?: boolean
  /** Additional custom settings */
  [key: string]: string | number | boolean | undefined
}

/**
 * Mock data for testing - allows overriding node outputs with fixed data
 * Used for testing workflows without executing certain nodes
 */
export interface MockData {
  [nodeName: string]: NodeOutput
}

/**
 * Serialized node data for export/import
 * Contains all data needed to reconstruct a node instance
 */
export interface SerializedNode {
  /** Node properties (id, name, nodeType, version, position, etc.) */
  properties: NodeProperties
  /** Node configuration */
  config: NodeConfiguration
  /** Input port definitions */
  inputs: InputPort[]
  /** Output port definitions */
  outputs: OutputPort[]
  /** Optional annotation */
  annotation?: string
}

/**
 * Workflow export data format
 * Complete serialized representation of a workflow
 */
export interface WorkflowExportData {
  /** Export format version */
  version: number
  /** Workflow id */
  id: string
  /** Workflow name */
  name?: string
  /** Serialized nodes */
  nodes: SerializedNode[]
  /** Links between nodes (indexed by source node) */
  linksBySource: WorkflowLinks
  /** Workflow settings */
  settings: WorkflowSettings
  /** Static data */
  staticData: DataRecord
  /** Mock data (optional) */
  mockData?: MockData
}

/**
 * Node factory function type
 * Creates a node instance from serialized node data
 */
export type NodeFactory = (serializedNode: SerializedNode) => Node

/**
 * Core workflow interface
 * Represents a collection of connected nodes forming an executable pipeline
 * All nodes, including triggers, are stored in a unified collection
 */
export interface Workflow {
  /** Unique identifier for the workflow */
  id: string
  /** Optional name of the workflow */
  name?: string
  /** Unified collection of all nodes (regular nodes and triggers) keyed by node name */
  nodes: { [nodeName: string]: Node }
  /** Links indexed by source node (for finding outputs) */
  linksBySource: WorkflowLinks
  /** Links indexed by destination node (for finding inputs) */
  linksByTarget: WorkflowLinks
  /** Registry of available node types */
  nodeTypeRegistry: NodeTypeRegistry
  /** Static data storage for workflow-level state (persists across executions) */
  staticData: DataRecord
  /** Workflow settings (timezone, etc.) */
  settings: WorkflowSettings
  /** Mock data for testing (overrides node outputs) */
  mockData?: MockData
  /** Current execution state of the workflow */
  state: WorkflowState
  /**
   * Adds a node to the workflow (regular node or trigger)
   * Triggers are identified by the isTrigger property in their properties
   * @param node - Node instance to add (can be regular node or trigger)
   */
  addNode(node: Node): void
}

