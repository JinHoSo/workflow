import type { Node } from "./node"
import type { NodeOutput } from "./node-execution-data"

/**
 * Interface for trigger nodes
 * Triggers are special nodes that initiate workflow execution
 * They extend WorkflowNode and add a trigger method to start the workflow
 */
export interface WorkflowTrigger extends Node {
  /**
   * Triggers the workflow execution
   * @param data - Optional initial data to pass to the workflow (port name based)
   */
  trigger(data?: NodeOutput): void
}

