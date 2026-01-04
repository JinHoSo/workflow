import type { ExecutionState, NodeExecutionMetadata, NodeOutput } from "@workflow/interfaces"
import { NodeState } from "@workflow/interfaces"

/**
 * Centralized execution state manager
 * Tracks execution state for all nodes in a workflow
 */
export class ExecutionStateManager {
  private state: ExecutionState = {}
  private metadata: Map<string, NodeExecutionMetadata> = new Map()

  /**
   * Gets the current execution state
   * @returns Current execution state
   */
  getState(): ExecutionState {
    return { ...this.state }
  }

  /**
   * Gets execution state for a specific node
   * @param nodeName - Name of the node
   * @returns Node output data or undefined
   */
  getNodeState(nodeName: string): NodeOutput | undefined {
    return this.state[nodeName]
  }

  /**
   * Sets execution state for a node
   * @param nodeName - Name of the node
   * @param output - Output data from the node
   */
  setNodeState(nodeName: string, output: NodeOutput): void {
    this.state[nodeName] = output
  }

  /**
   * Gets execution metadata for a node
   * @param nodeName - Name of the node
   * @returns Execution metadata or undefined
   */
  getNodeMetadata(nodeName: string): NodeExecutionMetadata | undefined {
    return this.metadata.get(nodeName)
  }

  /**
   * Sets execution metadata for a node
   * @param nodeName - Name of the node
   * @param metadata - Execution metadata
   */
  setNodeMetadata(nodeName: string, metadata: NodeExecutionMetadata): void {
    this.metadata.set(nodeName, metadata)
  }

  /**
   * Records node execution start
   * @param nodeName - Name of the node
   */
  recordNodeStart(nodeName: string): void {
    const metadata: NodeExecutionMetadata = {
      startTime: Date.now(),
      endTime: undefined,
      duration: undefined,
      status: NodeState.Running,
    }
    this.metadata.set(nodeName, metadata)
  }

  /**
   * Records node execution completion
   * @param nodeName - Name of the node
   * @param status - Final status of the node
   */
  recordNodeEnd(nodeName: string, status: NodeState): void {
    const metadata = this.metadata.get(nodeName)
    if (metadata) {
      metadata.endTime = Date.now()
      metadata.duration = metadata.endTime - metadata.startTime
      metadata.status = status
    }
  }

  /**
   * Clears all execution state
   */
  clear(): void {
    this.state = {}
    this.metadata.clear()
  }

  /**
   * Gets all node metadata
   * @returns Map of node names to their metadata
   */
  getAllMetadata(): Map<string, NodeExecutionMetadata> {
    return new Map(this.metadata)
  }

  /**
   * Exports execution state for persistence
   * @returns Serializable execution state
   */
  export(): { state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> } {
    const metadataRecord: Record<string, NodeExecutionMetadata> = {}
    for (const [nodeName, metadata] of this.metadata.entries()) {
      metadataRecord[nodeName] = metadata
    }
    return {
      state: { ...this.state },
      metadata: metadataRecord,
    }
  }

  /**
   * Imports execution state from persistence
   * @param data - Serialized execution state
   */
  import(data: { state: ExecutionState; metadata: Record<string, NodeExecutionMetadata> }): void {
    this.state = { ...data.state }
    this.metadata.clear()
    for (const [nodeName, metadata] of Object.entries(data.metadata)) {
      this.metadata.set(nodeName, metadata)
    }
  }
}

