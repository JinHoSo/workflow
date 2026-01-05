import type { NodeState } from "../types"
import type { InputPort, OutputPort } from "./port"
import type { NodeOutput } from "./node-execution-data"
import type { DataRecord } from "./node-execution-data"
import type { ScheduleConfig } from "./schedule"

/**
 * Properties that define a node's identity and behavior
 */
export interface NodeProperties {
  /** Unique identifier for the node */
  id: string
  /** Display name of the node (unique within workflow) */
  name: string
  /** Type of the node (e.g., "javascript", "manual-trigger")
   * When creating nodes using class constructors, this is automatically set from the class definition.
   * Required for serialization/deserialization (JSON export/import) where class information is not available.
   */
  nodeType: string
  /** Version of the node type */
  version: number
  /** Visual position [x, y] in the workflow canvas */
  position: [number, number]
  /** Whether this node is a trigger node (initiates workflow execution)
   * Defaults to false if not provided. Trigger nodes automatically set this to true.
   */
  isTrigger?: boolean
  /** Whether the node is disabled (skipped during execution) */
  disabled?: boolean
  /** User notes/annotations for the node */
  notes?: string
  /** Whether to retry execution on failure */
  retryOnFail?: boolean
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Wait time in milliseconds between retry attempts (number for fixed delay, or object for exponential backoff) */
  retryDelay?: number | { baseDelay?: number; maxDelay?: number }
  /** Whether to continue workflow execution if this node fails */
  continueOnFail?: boolean
}

/**
 * Node properties for constructor parameters
 * nodeType is optional because it's automatically set by node class constructors
 */
export type NodePropertiesInput = Omit<NodeProperties, "nodeType"> & {
  /** Optional nodeType - will be automatically set by the node class constructor */
  nodeType?: string
}

/**
 * Configuration parameters for a node
 * Key-value pairs that customize node behavior
 */
export interface NodeConfiguration {
  [key: string]:
    | string
    | number
    | boolean
    | DataRecord
    | DataRecord[]
    | NodeOutput
    | ScheduleConfig
    | null
    | undefined
}

/**
 * Core node interface representing a workflow node
 * Nodes are the fundamental execution units in a workflow
 */
export interface Node {
  /** Node properties (id, name, type, etc.) */
  properties: NodeProperties
  /** Current execution state of the node */
  state: NodeState
  /** Configuration parameters for the node */
  config: NodeConfiguration
  /** Input ports that receive data from other nodes */
  inputs: InputPort[]
  /** Output ports that send data to other nodes */
  outputs: OutputPort[]
  /** Optional annotation/comment for the node */
  annotation?: string
  /** Error information if the node execution failed */
  error?: Error
}

