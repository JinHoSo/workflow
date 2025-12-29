import type {
  Node,
  NodeProperties,
  NodeConfiguration,
  InputPort,
  OutputPort,
  NodeOutput,
  DataRecord,
} from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import { NodeState } from "../types"
import { LinkType } from "../types"

/**
 * Abstract base class for all workflow nodes
 * Provides common functionality for port management, state tracking, and execution
 * Subclasses must implement process() to define node-specific behavior
 */
export abstract class BaseNode implements Node {
  properties: NodeProperties
  state: NodeState
  config: NodeConfiguration
  inputs: InputPort[]
  outputs: OutputPort[]
  annotation?: string
  error?: Error
  protected resultData: NodeOutput = {}

  /**
   * Creates a new WorkflowNodeBase instance
   * @param properties - Node properties (id, name, type, etc.)
   */
  constructor(properties: NodeProperties) {
    this.properties = properties
    this.state = NodeState.Idle
    this.config = {}
    this.inputs = []
    this.outputs = []
  }

  /**
   * Gets result data for a specific output port
   * @param outputPortName - Name of the output port
   * @returns Data for the specified output port (single item or array)
   */
  getResult(outputPortName: string): DataRecord | DataRecord[] {
    const result = this.resultData[outputPortName]
    if (result === undefined) {
      return []
    }
    return result
  }

  /**
   * Gets all result data from all output ports
   * @returns Output data indexed by port name
   */
  getAllResults(): NodeOutput {
    return this.resultData
  }

  /**
   * Adds an input port to the node
   * @param name - Unique name for the input port
   * @param dataType - Data type that this port accepts
   * @param linkType - Type of link (defaults to Standard)
   */
  addInput(name: string, dataType: string, linkType: LinkType = LinkType.Standard): void {
    const port: InputPort = {
      name,
      dataType,
      linkType,
    }
    this.inputs.push(port)
  }

  /**
   * Adds an output port to the node
   * @param name - Unique name for the output port
   * @param dataType - Data type that this port produces
   * @param linkType - Type of link (defaults to Standard)
   */
  addOutput(name: string, dataType: string, linkType: LinkType = LinkType.Standard): void {
    const port: OutputPort = {
      name,
      dataType,
      linkType,
    }
    this.outputs.push(port)
  }

  /**
   * Sets the node state with validation
   * Only allows valid state transitions
   * @param state - New state to set
   * @throws Error if the transition is invalid
   */
  setState(state: NodeState): void {
    if (this.canTransition(this.state, state)) {
      this.state = state
      if (state === NodeState.Failed && !this.error) {
        this.error = new Error("Node execution failed")
      }
    } else {
      throw new Error(`${this.properties.name}: Invalid state transition from ${this.state} to ${state}`)
    }
  }

  /**
   * Gets the current node state
   * @returns Current NodeState
   */
  getState(): NodeState {
    return this.state
  }

  /**
   * Configures the node with parameters
   * Validates configuration and updates config if valid
   * Does not change node state - nodes can execute from Idle state if they have valid configuration
   * @param config - Configuration parameters
   * @throws Error if configuration is invalid
   */
  setup(config: NodeConfiguration): void {
    if (this.validateConfig(config)) {
      this.config = { ...this.config, ...config }
      // State is not changed - nodes can execute from Idle state if they have valid configuration
    } else {
      throw new Error("Invalid configuration")
    }
  }

  /**
   * Runs the node with execution context
   * Calls process() and handles state transitions and errors
   * @param context - Execution context containing input data and state
   * @returns Output data (port name based)
   * @throws Error if node is not in Idle state or execution fails
   */
  async run(context: ExecutionContext): Promise<NodeOutput> {
    if (this.state !== NodeState.Idle) {
      throw new Error(`Cannot run node in ${this.state} state`)
    }

    try {
      this.setState(NodeState.Running)
      const result = await this.process(context)
      this.resultData = result
      this.setState(NodeState.Completed)
      return result
    } catch (error) {
      this.error = error instanceof Error ? error : new Error(String(error))
      this.setState(NodeState.Failed)
      throw error
    }
  }

  /**
   * Stops node execution
   * Resets state to Idle and clears error
   */
  stop(): void {
    if (this.state === NodeState.Completed || this.state === NodeState.Failed) {
      this.setState(NodeState.Idle)
      this.error = undefined
    }
  }

  /**
   * Resets the node to initial state
   * Clears error and result data, but preserves configuration
   * Always sets state to Idle regardless of configuration
   */
  reset(): void {
    // Preserve configuration - nodes should remain configured after reset
    this.error = undefined
    this.resultData = {}
    this.state = NodeState.Idle
  }

  /**
   * Sets an annotation/comment on the node
   * @param annotation - Annotation text
   */
  setAnnotation(annotation: string): void {
    this.annotation = annotation
  }

  /**
   * Removes the annotation from the node
   */
  removeAnnotation(): void {
    this.annotation = undefined
  }

  /**
   * Abstract method that subclasses must implement
   * Contains the node-specific processing logic
   * All nodes must implement async processing for consistency
   * @param context - Execution context containing input data and state
   * @returns Promise that resolves to output data (port name based)
   */
  protected abstract process(context: ExecutionContext): Promise<NodeOutput>

  /**
   * Validates node configuration
   * Override in subclasses to add custom validation
   * @param _config - Configuration to validate
   * @returns true if configuration is valid
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected validateConfig(_config: NodeConfiguration): boolean {
    return true
  }

  /**
   * Checks if a state transition is valid
   * @param from - Current state
   * @param to - Target state
   * @returns true if the transition is allowed
   */
  private canTransition(from: NodeState, to: NodeState): boolean {
    const validTransitions: Record<NodeState, NodeState[]> = {
      [NodeState.Idle]: [NodeState.Running],
      [NodeState.Running]: [NodeState.Completed, NodeState.Failed],
      [NodeState.Completed]: [NodeState.Idle],
      [NodeState.Failed]: [NodeState.Idle],
    }

    return validTransitions[from]?.includes(to) ?? false
  }
}
