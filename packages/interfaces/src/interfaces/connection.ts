import type { LinkType } from "../types"

/**
 * Represents a link from one node to another
 */
export interface NodeLink {
  /** Name of the destination node */
  targetNode: string
  /** Type of link (Standard, Alternative, etc.) */
  linkType: LinkType
  /** Name of the output port on the source node */
  outputPortName: string
}

/**
 * Links grouped by input port name
 * Maps input port names to arrays of links
 */
export interface NodeLinks {
  [inputName: string]: NodeLink[]
}

/**
 * Links indexed by source node name
 * Maps source node names to their output links
 */
export interface WorkflowLinks {
  [nodeName: string]: NodeLinks
}

