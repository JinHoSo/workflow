import type { LinkType } from "../types"

/**
 * Base interface for node ports (input/output)
 * Ports are connection points on nodes that allow data to flow between nodes
 */
export interface Port {
  /** Unique name of the port within the node */
  name: string
  /** Data type that this port accepts/produces */
  dataType: string
  /** Type of link (Standard, Alternative, etc.) */
  linkType: LinkType
}

/**
 * Interface for input ports - ports that receive data from other nodes
 */
export interface InputPort extends Port {}

/**
 * Interface for output ports - ports that send data to other nodes
 */
export interface OutputPort extends Port {}

