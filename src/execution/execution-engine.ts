import type { Workflow as IWorkflow, Node, NodeInput, NodeOutput, DataRecord } from "../interfaces"
import type { ExecutionState, ExecutionContext } from "../interfaces/execution-state"
import { WorkflowState } from "../interfaces"
import { NodeState } from "../types"
import { BaseNode } from "../core/base-node"

/**
 * Execution engine that orchestrates workflow execution
 * Handles node execution order, data flow, and error handling
 */
export class ExecutionEngine {
  private workflow: IWorkflow
  /** Execution state tracking all node outputs */
  private executionState: ExecutionState = {}
  /** Map of node names to their execution promises (for async waiting) */
  private nodePromises: Map<string, Promise<void>> = new Map()

  /**
   * Creates a new ExecutionEngine
   * @param workflow - Workflow to execute
   */
  constructor(workflow: IWorkflow) {
    this.workflow = workflow
  }

  /**
   * Executes the workflow starting from a trigger node
   * Resolves dependencies and executes nodes in the correct order
   * @param triggerNodeName - Name of the trigger node to start execution
   * @param _initialData - Optional initial data for the trigger (not used, trigger should be executed before calling this)
   * @throws Error if workflow is already executing or trigger not found
   */
  async execute(triggerNodeName: string, _initialData?: NodeOutput): Promise<void> {
    if (this.workflow.state !== WorkflowState.Idle) {
      throw new Error("Workflow is already executing")
    }

    this.workflow.state = WorkflowState.Running

    try {
      const triggerNode = this.workflow.nodes[triggerNodeName]
      if (!triggerNode) {
        throw new Error(`Trigger node ${triggerNodeName} not found`)
      }

      // Initialize execution state with trigger node output
      if (triggerNode instanceof BaseNode && triggerNode.state === NodeState.Completed) {
        this.executionState[triggerNodeName] = triggerNode.getAllResults()
      }

      const executedNodes = new Set<string>([triggerNodeName])
      const queue = this.getConnectedNodes(triggerNodeName)

      while (queue.length > 0) {
        const nodeName = queue.shift()
        if (!nodeName || executedNodes.has(nodeName)) {
          continue
        }

        const node = this.workflow.nodes[nodeName]
        if (!node) {
          continue
        }

        if (node.properties.disabled) {
          continue
        }

        // Wait for all input dependencies to be ready (async support)
        const context = await this.collectInputDataAndState(nodeName)

        // Check if node has any input data or can run without inputs
        const hasInputData = Object.keys(context.input).some((portName) => {
          const portData = context.input[portName]
          if (portData === undefined) return false
          const normalized = Array.isArray(portData) ? portData : [portData]
          return normalized.length > 0
        })

        // Nodes without inputs can still run (e.g., triggers, nodes that generate data)
        if (hasInputData || node.inputs.length === 0) {
          const nodePromise = this.runNode(node, context)
          this.nodePromises.set(nodeName, nodePromise)
          await nodePromise

          // Update execution state with node output
          if (node instanceof BaseNode && node.state === NodeState.Completed) {
            this.executionState[nodeName] = node.getAllResults()
          }

          executedNodes.add(nodeName)
          const connected = this.getConnectedNodes(nodeName)
          queue.push(...connected)
        }
      }

      this.workflow.state = WorkflowState.Completed
    } catch (error) {
      this.workflow.state = WorkflowState.Failed
      throw error
    }
  }

  /**
   * Executes a single node
   * Skips execution if mock data is available for the node
   * @param node - Node to execute
   * @param context - Execution context containing input data and state
   * @throws Error if node is not ready or execution fails (unless continueOnFail is set)
   */
  private async runNode(node: Node, context: ExecutionContext): Promise<void> {
    if (this.workflow.mockData?.[node.properties.name]) {
      return
    }

    if (node.state !== NodeState.Ready) {
      throw new Error(`Node ${node.properties.name} is not ready`)
    }

    try {
      if (node instanceof BaseNode) {
        await node.run(context)
      }
    } catch (error) {
      node.error = error instanceof Error ? error : new Error(String(error))
      node.state = NodeState.Failed
      if (!node.properties.continueOnFail) {
        throw error
      }
    }
  }

  /**
   * Collects input data and state for a node, waiting for all dependencies to complete
   * Supports async execution - waits for all source nodes to finish before proceeding
   * @param nodeName - Name of the node to collect input for
   * @returns Execution context with input data and state
   */
  private async collectInputDataAndState(nodeName: string): Promise<ExecutionContext> {
    const links = this.workflow.linksByTarget[nodeName]
    const inputData: NodeInput = {}

    if (links) {
      // Wait for all source nodes to complete (async support)
      // n8n-style: Directly await node execution promises instead of polling
      const sourceNodeNames = new Set<string>()
      for (const inputName in links) {
        for (const link of links[inputName]) {
          sourceNodeNames.add(link.targetNode)
        }
      }

      // Wait for all source nodes to complete by awaiting their promises
      await Promise.all(
        Array.from(sourceNodeNames).map(async (sourceNodeName) => {
          const sourceNode = this.workflow.nodes[sourceNodeName]
          if (!sourceNode) return

          // If node is already completed, no need to wait
          if (sourceNode.state === NodeState.Completed) {
            return
          }

          // If node is running, wait for its execution promise
          if (sourceNode.state === NodeState.Running) {
            const promise = this.nodePromises.get(sourceNodeName)
            if (promise) {
              // Directly await the promise - no polling needed
              await promise
            } else {
              // This shouldn't happen, but if it does, the node might have been started
              // outside of our control. Wait a bit and check again.
              // This is a safety fallback, not the primary mechanism.
              let attempts = 0
              while (sourceNode.state === NodeState.Running && attempts < 100) {
                await new Promise((resolve) => setTimeout(resolve, 50))
                attempts++
                // Check if promise was added in the meantime
                const newPromise = this.nodePromises.get(sourceNodeName)
                if (newPromise) {
                  await newPromise
                  return
                }
              }
              if (sourceNode.state === NodeState.Running) {
                throw new Error(
                  `Node ${sourceNodeName} is running but no execution promise found. This may indicate a race condition.`,
                )
              }
            }
            return
          }

          // If node is not ready or failed, throw error
          if (sourceNode.state === NodeState.Failed) {
            throw new Error(`Source node ${sourceNodeName} failed`)
          }

          // If node is in Idle or Ready state, it hasn't been executed yet
          // This shouldn't happen in normal flow, but we'll wait a bit
          // in case it's about to start
          if (sourceNode.state === NodeState.Idle || sourceNode.state === NodeState.Ready) {
            // Wait a short time to see if execution starts
            await new Promise((resolve) => setTimeout(resolve, 10))
            const promise = this.nodePromises.get(sourceNodeName)
            if (promise) {
              await promise
            }
          }
        }),
      )

      // Now collect input data from completed source nodes
      for (const inputName in links) {
        const inputLinks = links[inputName]
        const portData: DataRecord[] = []

        for (const link of inputLinks) {
          const sourceNode = this.workflow.nodes[link.targetNode]
          if (sourceNode && sourceNode.state === NodeState.Completed) {
            const sourceOutput = this.getNodeOutput(sourceNode, link.outputPortName)
            // Normalize to array
            const normalized = Array.isArray(sourceOutput) ? sourceOutput : [sourceOutput]
            portData.push(...normalized)
          }
        }

        if (portData.length > 0) {
          // Single item: return as object, multiple items: return as array
          inputData[inputName] = portData.length === 1 ? portData[0] : portData
        }
      }
    }

    return {
      input: inputData,
      state: { ...this.executionState },
    }
  }


  /**
   * Gets output data from a node
   * Uses mock data if available, otherwise gets from node output
   * @param node - Node to get output from
   * @param outputPortName - Name of the output port
   * @returns Data for the output port (single item or array)
   */
  private getNodeOutput(node: Node, outputPortName: string): DataRecord | DataRecord[] {
    if (this.workflow.mockData?.[node.properties.name]) {
      const mockOutput = this.workflow.mockData[node.properties.name]
      return mockOutput[outputPortName] || []
    }

    if (node instanceof BaseNode) {
      return node.getResult(outputPortName)
    }

    return []
  }

  /**
   * Gets all nodes connected to a source node's outputs
   * @param nodeName - Name of the source node
   * @returns Array of connected node names
   */
  private getConnectedNodes(nodeName: string): string[] {
    const links = this.workflow.linksBySource[nodeName]
    if (!links) {
      return []
    }

    const connected: string[] = []
    for (const inputName in links) {
      for (const link of links[inputName]) {
        if (!connected.includes(link.targetNode)) {
          connected.push(link.targetNode)
        }
      }
    }
    return connected
  }
}
