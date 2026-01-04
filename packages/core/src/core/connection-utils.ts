import type { WorkflowLinks } from "@workflow/interfaces"

/**
 * Maps links from source-based indexing to target-based indexing
 * Creates a reverse index for efficient lookup of nodes connected to a target
 * @param links - Links indexed by source node
 * @returns Links indexed by target node
 */
export function mapLinksByTarget(links: WorkflowLinks): WorkflowLinks {
  const targetLinks: WorkflowLinks = {}

  for (const sourceNode in links) {
    if (!Object.prototype.hasOwnProperty.call(links, sourceNode)) {
      continue
    }

    const nodeLinks = links[sourceNode]
    for (const inputName in nodeLinks) {
      if (!Object.prototype.hasOwnProperty.call(nodeLinks, inputName)) {
        continue
      }

      for (const link of nodeLinks[inputName]) {
        if (!targetLinks[link.targetNode]) {
          targetLinks[link.targetNode] = {}
        }

        if (!targetLinks[link.targetNode][inputName]) {
          targetLinks[link.targetNode][inputName] = []
        }

        targetLinks[link.targetNode][inputName].push({
          targetNode: sourceNode,
          linkType: link.linkType,
          outputPortName: link.outputPortName,
        })
      }
    }
  }

  return targetLinks
}
