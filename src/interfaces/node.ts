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
  /** Type of the node (e.g., "javascript", "manual-trigger") */
  nodeType: string
  /** Version of the node type */
  version: number
  /** Visual position [x, y] in the workflow canvas */
  position: [number, number]
  /** Whether the node is disabled (skipped during execution) */
  disabled?: boolean
  /** User notes/annotations for the node */
  notes?: string
  /** Whether to retry execution on failure */
  retryOnFail?: boolean
  /** Maximum number of retry attempts */
  maxRetries?: number
  /** Wait time in milliseconds between retry attempts */
  retryDelay?: number
  /** Whether to continue workflow execution if this node fails */
  continueOnFail?: boolean
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
export interface WorkflowNode {
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

