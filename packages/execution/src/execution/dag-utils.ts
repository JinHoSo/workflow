import type { Workflow as IWorkflow } from "@workflow/interfaces"

/**
 * Dependency graph representation
 * Maps node names to their dependencies (nodes that must execute before this node)
 */
export interface DependencyGraph {
  [nodeName: string]: string[]
}

/**
 * Builds a dependency graph from workflow connections
 * @param workflow - Workflow to analyze
 * @returns Dependency graph mapping each node to its dependencies
 */
export function buildDependencyGraph(workflow: IWorkflow): DependencyGraph {
  const graph: DependencyGraph = {}

  // Initialize all nodes with empty dependencies
  for (const nodeName in workflow.nodes) {
    graph[nodeName] = []
  }

  // Build dependencies from links
  // linksByTarget[nodeName] contains all links that target this node
  // In linksByTarget, link.targetNode actually refers to the source node (reverse index)
  for (const targetNodeName in workflow.linksByTarget) {
    const links = workflow.linksByTarget[targetNodeName]
    if (!links) continue

    const dependencies = new Set<string>()

    // For each input port, find all source nodes
    for (const inputName in links) {
      const inputLinks = links[inputName]
      for (const link of inputLinks) {
        // In linksByTarget (reverse index), link.targetNode is the source node name
        // This is because mapLinksByTarget swaps source and target for reverse lookup
        dependencies.add(link.targetNode)
      }
    }

    graph[targetNodeName] = Array.from(dependencies)
  }

  return graph
}

/**
 * Detects circular dependencies in a dependency graph
 * @param graph - Dependency graph to check
 * @returns Array of cycles found (each cycle is an array of node names forming a cycle)
 */
export function detectCycles(graph: DependencyGraph): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  /**
   * DFS to detect cycles
   */
  function dfs(nodeName: string, path: string[]): void {
    visited.add(nodeName)
    recursionStack.add(nodeName)
    path.push(nodeName)

    const dependencies = graph[nodeName] || []
    for (const dep of dependencies) {
      if (!visited.has(dep)) {
        dfs(dep, [...path])
      } else if (recursionStack.has(dep)) {
        // Found a cycle - extract the cycle from the path
        const cycleStart = path.indexOf(dep)
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), dep])
        }
      }
    }

    recursionStack.delete(nodeName)
  }

  // Check all nodes
  for (const nodeName in graph) {
    if (!visited.has(nodeName)) {
      dfs(nodeName, [])
    }
  }

  return cycles
}

/**
 * Performs topological sort using Kahn's algorithm
 * Returns nodes grouped by dependency level (nodes at same level can execute in parallel)
 * @param graph - Dependency graph
 * @returns Array of arrays, where each inner array contains nodes at the same dependency level
 * @throws Error if circular dependencies are detected
 */
export function topologicalSort(graph: DependencyGraph): string[][] {
  // Detect cycles first
  const cycles = detectCycles(graph)
  if (cycles.length > 0) {
    const cycleDescriptions = cycles.map((cycle) => cycle.join(" -> "))
    throw new Error(
      `Circular dependencies detected: ${cycleDescriptions.join("; ")}. Workflow execution cannot proceed.`,
    )
  }

  // Calculate in-degree for each node (number of incoming dependencies)
  // In-degree = how many nodes must be processed before this node
  // For node A, in-degree = number of nodes that A depends on
  const inDegree: Record<string, number> = {}
  for (const nodeName in graph) {
    // In-degree is the number of dependencies this node has
    inDegree[nodeName] = (graph[nodeName] || []).length
  }

  // Find all nodes with no incoming dependencies (entry points)
  const queue: string[] = []
  for (const nodeName in inDegree) {
    if (inDegree[nodeName] === 0) {
      queue.push(nodeName)
    }
  }

  const levels: string[][] = []
  const processed = new Set<string>()

  // Process nodes level by level
  while (queue.length > 0) {
    const currentLevel: string[] = []
    const currentLevelSize = queue.length

    // Process all nodes at current level
    for (let i = 0; i < currentLevelSize; i++) {
      const nodeName = queue.shift()!
      if (processed.has(nodeName)) {
        continue
      }

      currentLevel.push(nodeName)
      processed.add(nodeName)

      // Decrease in-degree for all nodes that depend on this node
      // Find nodes that have this node as a dependency
      for (const otherNodeName in graph) {
        const otherDependencies = graph[otherNodeName] || []
        if (otherDependencies.includes(nodeName)) {
          if (inDegree[otherNodeName] !== undefined) {
            inDegree[otherNodeName]--
            // If in-degree becomes 0, add to queue for next level
            if (inDegree[otherNodeName] === 0 && !processed.has(otherNodeName)) {
              queue.push(otherNodeName)
            }
          }
        }
      }
    }

    if (currentLevel.length > 0) {
      levels.push(currentLevel)
    }
  }

  // Check if all nodes were processed
  const allNodes = Object.keys(graph)
  const unprocessed = allNodes.filter((node) => !processed.has(node))
  if (unprocessed.length > 0) {
    throw new Error(
      `Some nodes could not be processed (possible circular dependencies): ${unprocessed.join(", ")}`,
    )
  }

  return levels
}

/**
 * Gets all nodes that have no dependencies on each other (can execute in parallel)
 * @param graph - Dependency graph
 * @param level - Array of node names at the same dependency level
 * @returns Array of node names that are independent (no dependencies between them)
 */
export function getIndependentNodes(graph: DependencyGraph, level: string[]): string[] {
  // Nodes at the same level are independent if they don't depend on each other
  const independent: string[] = []

  for (const nodeName of level) {
    const dependencies = graph[nodeName] || []
    // Check if this node depends on any other node in the same level
    const dependsOnLevelNode = dependencies.some((dep) => level.includes(dep))
    if (!dependsOnLevelNode) {
      independent.push(nodeName)
    }
  }

  return independent
}

