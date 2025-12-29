import type { WorkflowNode } from "./node"
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
export type NodeFactory = (serializedNode: SerializedNode) => WorkflowNode

/**
 * Core workflow interface
 * Represents a collection of connected nodes forming an executable pipeline
 */
export interface Workflow {
  /** Unique identifier for the workflow */
  id: string
  /** Optional name of the workflow */
  name?: string
  /** Collection of nodes keyed by node name */
  nodes: { [nodeName: string]: WorkflowNode }
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
}

