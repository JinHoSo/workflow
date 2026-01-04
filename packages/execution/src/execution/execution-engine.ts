import type { Workflow as IWorkflow, Node, NodeInput, NodeOutput, DataRecord } from "@workflow/interfaces"
import type {
  ExecutionState,
  ExecutionContext,
  StatePersistenceHook,
  NodeExecutionMetadata,
} from "@workflow/interfaces"
import { NodeState, WorkflowState } from "@workflow/interfaces"
import { BaseNode } from "@workflow/core"
import { buildDependencyGraph, topologicalSort, getIndependentNodes } from "./dag-utils"
import { executionProtocol } from "@workflow/protocols"
import { errorHandlingProtocol } from "@workflow/protocols"
import { createRetryStrategy } from "./retry-strategy"
import { ExecutionStateManager } from "./execution-state-manager"
import type { SecretResolver } from "@workflow/secrets"

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
  /** Centralized state manager */
  private stateManager: ExecutionStateManager = new ExecutionStateManager()
  /** Optional state persistence hook */
  private persistenceHook?: StatePersistenceHook
  /** Optional secret resolver for resolving secret references in node configurations */
  private secretResolver?: SecretResolver

  /**
   * Creates a new ExecutionEngine
   * @param workflow - Workflow to execute
   * @param persistenceHook - Optional state persistence hook
   * @param secretResolver - Optional secret resolver for secret references
   */
  constructor(workflow: IWorkflow, persistenceHook?: StatePersistenceHook, secretResolver?: SecretResolver) {
    this.workflow = workflow
    this.persistenceHook = persistenceHook
    this.secretResolver = secretResolver
  }

  /**
   * Gets the current workflow state
   * @returns Current workflow state
   */
  getWorkflowState(): WorkflowState {
    return this.workflow.state
  }

  /**
   * Gets the execution state manager
   * @returns Execution state manager instance
   */
  getStateManager(): ExecutionStateManager {
    return this.stateManager
  }

  /**
   * Gets execution state for a specific node
   * @param nodeName - Name of the node
   * @returns Node output data or undefined
   */
  getNodeState(nodeName: string): NodeOutput | undefined {
    return this.stateManager.getNodeState(nodeName)
  }

  /**
   * Gets execution metadata for a specific node
   * @param nodeName - Name of the node
   * @returns Execution metadata or undefined
   */
  getNodeMetadata(nodeName: string): NodeExecutionMetadata | undefined {
    return this.stateManager.getNodeMetadata(nodeName)
  }

  /**
   * Executes the workflow starting from a trigger node
   * Resets the workflow to clean state before execution
   * Resolves dependencies and executes nodes in the correct order
   * @param triggerNodeName - Name of the trigger node to start execution
   * @param _initialData - Optional initial data for the trigger (not used, trigger should be executed before calling this)
   * @throws Error if workflow is already executing or trigger not found
   */
  async execute(triggerNodeName: string, _initialData?: NodeOutput): Promise<void> {
    if (this.workflow.state === WorkflowState.Running) {
      throw new Error("Workflow is already executing")
    }

    // Get trigger node to verify it exists (all nodes are in unified collection)
    const triggerNode = this.workflow.nodes[triggerNodeName]
    if (!triggerNode) {
      throw new Error(`Trigger node ${triggerNodeName} not found`)
    }
    // Verify it's actually a trigger node
    if (!triggerNode.properties.isTrigger) {
      throw new Error(`Node ${triggerNodeName} is not a trigger node`)
    }

    // Set secret resolver on all nodes if available
    if (this.secretResolver) {
      for (const node of Object.values(this.workflow.nodes)) {
        if (node instanceof BaseNode) {
          node.setSecretResolver(this.secretResolver)
        }
      }
    }

    // Reset workflow to clean state before execution
    // This resets regular nodes (non-trigger nodes) only
    // Trigger nodes are preserved to maintain their state and configuration
    if ("reset" in this.workflow && typeof this.workflow.reset === "function") {
      this.workflow.reset()
    }

    // Clear execution state to prevent contamination from previous executions
    this.executionState = {}
    this.nodePromises.clear()
    this.stateManager.clear()

    this.workflow.state = WorkflowState.Running
    console.log(`[ExecutionEngine] Starting workflow execution from trigger: ${triggerNodeName}`)

    // Try to recover state from persistence if available
    if (this.persistenceHook) {
      try {
        const recovered = await this.persistenceHook.recover(this.workflow.id)
        if (recovered) {
          this.stateManager.import(recovered)
          this.executionState = recovered.state
        }
      } catch (error) {
        // Log but don't fail - continue with fresh state
        console.warn("Failed to recover execution state:", error)
      }
    }

    try {
      // Initialize execution state with trigger node output
      if (triggerNode instanceof BaseNode && triggerNode.state === NodeState.Completed) {
        this.executionState[triggerNodeName] = triggerNode.getAllResults()
      }

      // Build dependency graph and perform topological sort
      const dependencyGraph = buildDependencyGraph(this.workflow)
      const executionLevels = topologicalSort(dependencyGraph)

      // Find which level contains the trigger node
      let triggerLevelIndex = -1
      for (let i = 0; i < executionLevels.length; i++) {
        if (executionLevels[i].includes(triggerNodeName)) {
          triggerLevelIndex = i
          break
        }
      }

      if (triggerLevelIndex === -1) {
        throw new Error(`Trigger node ${triggerNodeName} not found in dependency graph`)
      }

      // Execute nodes level by level, starting from trigger level
      const executedNodes = new Set<string>([triggerNodeName])
      const maxParallel = this.workflow.settings.maxParallelExecutions ?? 0 // 0 = unlimited
      const enableParallel = this.workflow.settings.enableParallelExecution ?? true

      for (let levelIndex = triggerLevelIndex; levelIndex < executionLevels.length; levelIndex++) {
        const level = executionLevels[levelIndex]

        // Filter to only nodes that haven't been executed yet
        const nodesToExecute = level.filter((nodeName) => !executedNodes.has(nodeName))

        if (nodesToExecute.length === 0) {
          continue
        }

        // Identify independent nodes at this level (can execute in parallel)
        const independentNodes = getIndependentNodes(dependencyGraph, nodesToExecute)

        if (enableParallel && independentNodes.length > 1) {
          // Execute independent nodes in parallel
          await this.executeNodesInParallel(independentNodes, executedNodes, maxParallel)
        } else {
          // Execute nodes sequentially
          for (const nodeName of nodesToExecute) {
            await this.executeNodeIfReady(nodeName, executedNodes)
          }
        }

        // Execute remaining nodes at this level sequentially (those that depend on other nodes in the same level)
        const remainingNodes = nodesToExecute.filter((nodeName) => !executedNodes.has(nodeName))
        for (const nodeName of remainingNodes) {
          await this.executeNodeIfReady(nodeName, executedNodes)
        }
      }

      this.workflow.state = WorkflowState.Completed
      console.log(`[ExecutionEngine] Workflow execution completed successfully`)
    } catch (error) {
      this.workflow.state = WorkflowState.Failed
      console.error(`[ExecutionEngine] Workflow execution failed:`, error)
      throw error
    }
  }

  /**
   * Executes a node if it's ready (has all dependencies satisfied)
   * Supports retry mechanism if configured
   * @param nodeName - Name of the node to execute
   * @param executedNodes - Set of already executed nodes
   */
  private async executeNodeIfReady(nodeName: string, executedNodes: Set<string>): Promise<void> {
    const node = this.workflow.nodes[nodeName]
    if (!node) {
      return
    }

    if (node.properties.disabled) {
      executedNodes.add(nodeName)
      return
    }

    // Wait for all input dependencies to be ready
    const context = await this.collectInputDataAndState(nodeName)

    // Check if node has any input data or can run without inputs
    const hasInputData = Object.keys(context.input).some((portName) => {
      const portData = context.input[portName]
      if (portData === undefined) return false
      const normalized = Array.isArray(portData) ? portData : [portData]
      return normalized.length > 0
    })

    // Log input data status for debugging
    if (!hasInputData && node.inputs.length > 0) {
      console.warn(
        `[ExecutionEngine] Node ${nodeName} has no input data. Input ports: ${node.inputs.map((i) => i.name).join(", ")}`,
      )
      console.warn(`[ExecutionEngine] Available input data keys: ${Object.keys(context.input).join(", ")}`)
    }

    // Nodes without inputs can still run (e.g., triggers, nodes that generate data)
    if (hasInputData || node.inputs.length === 0) {
        // Record execution start
        this.stateManager.recordNodeStart(nodeName)

        // Execute with retry if configured
        console.log(`[ExecutionEngine] Executing node: ${nodeName}`)
        if (node.properties.retryOnFail && node.properties.maxRetries) {
          await this.runNodeWithRetry(node, context, nodeName)
        } else {
          const nodePromise = this.runNode(node, context)
          this.nodePromises.set(nodeName, nodePromise)
          await nodePromise
        }
        console.log(`[ExecutionEngine] Node ${nodeName} completed`)

        // Update execution state with node output
        if (node instanceof BaseNode) {
          const finalState = node.state
          this.stateManager.recordNodeEnd(nodeName, finalState)
          if (finalState === NodeState.Completed) {
            const output = node.getAllResults()
            console.log(
              `[ExecutionEngine] Storing output for ${nodeName}:`,
              Object.keys(output),
              output,
            )
            this.executionState[nodeName] = output
            this.stateManager.setNodeState(nodeName, output)
          } else {
            console.warn(
              `[ExecutionEngine] Node ${nodeName} completed with state ${finalState}, not storing output`,
            )
          }
        }

        executedNodes.add(nodeName)

        // Persist state if hook is available
        if (this.persistenceHook) {
          try {
            const exported = this.stateManager.export()
            await this.persistenceHook.persist(this.workflow.id, exported.state, exported.metadata)
          } catch (error) {
            // Log but don't fail execution
            console.warn("Failed to persist execution state:", error)
          }
        }
      }
  }

  /**
   * Executes a node with retry mechanism
   * @param node - Node to execute
   * @param context - Execution context
   * @param nodeName - Name of the node (for promise tracking)
   */
  private async runNodeWithRetry(node: Node, context: ExecutionContext, nodeName: string): Promise<void> {
    const maxRetries = node.properties.maxRetries || 3
    const retryStrategy = createRetryStrategy(node.properties.retryDelay)
    let lastError: Error | undefined

    // Total attempts = 1 initial + maxRetries retries
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        // Prepare node for retry (except first attempt)
        // Use stop() to reset state to Idle and clear error, but preserve internal node state
        // This allows nodes to maintain internal state (like attempt counters) across retries
        if (attempt > 1 && node instanceof BaseNode) {
          node.stop()
        }

        const nodePromise = this.runNode(node, context)
        this.nodePromises.set(nodeName, nodePromise)
        await nodePromise

        // Success - return
        return
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Check if we should retry (if this is not the last attempt)
        // After attempt N fails, we can retry if N < maxRetries + 1
        // This means we check if there are more attempts remaining
        if (attempt >= maxRetries + 1) {
          // No more retries - throw the error
          throw lastError
        }

        // Calculate delay and wait before retry
        // Use attempt number for delay calculation (1-based)
        const delay = retryStrategy.calculateDelay(attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      throw lastError
    }
  }

  /**
   * Executes multiple nodes in parallel with optional concurrency limit
   * @param nodeNames - Array of node names to execute
   * @param executedNodes - Set of already executed nodes
   * @param maxParallel - Maximum number of concurrent executions (0 = unlimited)
   */
  private async executeNodesInParallel(
    nodeNames: string[],
    executedNodes: Set<string>,
    maxParallel: number,
  ): Promise<void> {
    if (maxParallel > 0 && nodeNames.length > maxParallel) {
      // Execute in batches with concurrency limit
      for (let i = 0; i < nodeNames.length; i += maxParallel) {
        const batch = nodeNames.slice(i, i + maxParallel)
        await Promise.all(
          batch.map(async (nodeName) => {
            if (!executedNodes.has(nodeName)) {
              await this.executeNodeIfReady(nodeName, executedNodes)
            }
          }),
        )
      }
    } else {
      // Execute all nodes in parallel (unlimited or within limit)
      await Promise.all(
        nodeNames.map(async (nodeName) => {
          if (!executedNodes.has(nodeName)) {
            await this.executeNodeIfReady(nodeName, executedNodes)
          }
        }),
      )
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

    if (node.state !== NodeState.Idle) {
      throw new Error(`Node ${node.properties.name} is not ready`)
    }

    try {
      // Use execution protocol for consistent execution
      await executionProtocol.executeNode({
        node,
        inputData: context.input,
        state: context.state,
        workflowId: this.workflow.id,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error(`[ExecutionEngine] Node ${node.properties.name} execution failed:`, err.message)
      // Use error handling protocol for consistent error handling
      errorHandlingProtocol.handleError(node, err)
      if (errorHandlingProtocol.shouldStopExecution(node, err)) {
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
          // Get source node from unified collection
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

          // If node is in Idle state, it hasn't been executed yet
          // This shouldn't happen in normal flow, but we'll wait a bit
          // in case it's about to start
          if (sourceNode.state === NodeState.Idle) {
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
          // Get source node from unified collection
          const sourceNode = this.workflow.nodes[link.targetNode]
          if (sourceNode) {
            // Check if node is completed or if output is available in execution state
            // (execution state is used for trigger nodes initialized in execute())
            const hasOutput = sourceNode.state === NodeState.Completed ||
                             this.executionState[link.targetNode] !== undefined
            if (hasOutput) {
              const sourceOutput = this.getNodeOutput(sourceNode, link.outputPortName)
              // Normalize to array
              const normalized = Array.isArray(sourceOutput) ? sourceOutput : [sourceOutput]
              // Filter out undefined/null values
              const validData = normalized.filter((item) => item !== undefined && item !== null)
              if (validData.length > 0) {
                portData.push(...validData)
              }
              console.log(
                `[ExecutionEngine] Collected input for ${nodeName} from ${link.targetNode}:${link.outputPortName} -> ${inputName} (${validData.length} items, raw: ${normalized.length} items)`,
              )
              if (validData.length === 0 && normalized.length > 0) {
                console.warn(
                  `[ExecutionEngine] All items filtered out (undefined/null) for ${nodeName} from ${link.targetNode}:${link.outputPortName}`,
                )
              }
            } else {
              console.warn(
                `[ExecutionEngine] Source node ${link.targetNode} is not completed (state: ${sourceNode.state}) for ${nodeName}:${inputName}`,
              )
            }
          } else {
            console.warn(`[ExecutionEngine] Source node ${link.targetNode} not found for ${nodeName}:${inputName}`)
          }
        }

        if (portData.length > 0) {
          // Single item: return as object, multiple items: return as array
          inputData[inputName] = portData.length === 1 ? portData[0] : portData
        } else {
          console.warn(`[ExecutionEngine] No input data collected for ${nodeName}:${inputName}`)
        }
      }
    }

    // Merge executionState and stateManager state to ensure all completed nodes are available
    // stateManager is the source of truth for node states
    const stateManagerState = this.stateManager.getState()
    const mergedState = { ...this.executionState, ...stateManagerState }

    // Performance optimization: Only check completed nodes directly if they're not already in mergedState
    // This avoids unnecessary iteration over all nodes when executionState/stateManager already have the data
    // We only need to check nodes that are completed but missing from mergedState (race condition fallback)
    const mergedStateKeys = new Set(Object.keys(mergedState))
    for (const [nodeKey, node] of Object.entries(this.workflow.nodes)) {
      // Skip if already in mergedState (most common case)
      if (mergedStateKeys.has(nodeKey)) {
        continue
      }

      // Only check completed nodes that are missing from mergedState
      // This handles edge cases where a node completed but state wasn't synced yet
      if (node instanceof BaseNode && node.state === NodeState.Completed) {
        const nodeOutput = node.getAllResults()
        // Include completed nodes in state, even if output appears empty
        // This allows nodes to reference completed nodes via state() function
        mergedState[nodeKey] = nodeOutput || {}
      }
    }

    return {
      input: inputData,
      state: mergedState,
    }
  }


  /**
   * Gets output data from a node
   * Uses mock data if available, otherwise gets from node output or execution state
   * @param node - Node to get output from
   * @param outputPortName - Name of the output port
   * @returns Data for the output port (single item or array)
   */
  private getNodeOutput(node: Node, outputPortName: string): DataRecord | DataRecord[] {
    if (this.workflow.mockData?.[node.properties.name]) {
      const mockOutput = this.workflow.mockData[node.properties.name]
      return mockOutput[outputPortName] || []
    }

    // Check execution state first (for trigger nodes initialized in execute())
    const nodeName = node.properties.name
    if (this.executionState[nodeName]) {
      const nodeOutput = this.executionState[nodeName]
      const portOutput = nodeOutput[outputPortName]
      if (portOutput !== undefined) {
        console.log(
          `[ExecutionEngine] getNodeOutput: Found in executionState for ${nodeName}:${outputPortName}`,
          typeof portOutput,
        )
        return portOutput
      } else {
        console.log(
          `[ExecutionEngine] getNodeOutput: No data in executionState for ${nodeName}:${outputPortName}, available ports:`,
          Object.keys(nodeOutput),
        )
      }
    }

    if (node instanceof BaseNode) {
      const result = node.getResult(outputPortName)
      console.log(
        `[ExecutionEngine] getNodeOutput: Got from BaseNode.getResult for ${nodeName}:${outputPortName}`,
        typeof result,
        result === undefined ? "undefined" : result === null ? "null" : Array.isArray(result) ? `array[${result.length}]` : "object",
      )
      return result
    }

    console.warn(`[ExecutionEngine] getNodeOutput: No output found for ${node.properties.name}:${outputPortName}`)
    return []
  }

}
