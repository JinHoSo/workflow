/**
 * Plugin manifest defining plugin metadata and dependencies
 */
export interface PluginManifest {
  /** Plugin name (unique identifier) */
  name: string
  /** Plugin version (semantic versioning) */
  version: string
  /** Human-readable display name */
  displayName: string
  /** Plugin description */
  description?: string
  /** Author information */
  author?: string
  /** Plugin dependencies (other plugins required) */
  dependencies?: string[]
  /** Node types provided by this plugin */
  nodeTypes: string[]
}

/**
 * Plugin interface for node type packages
 */
export interface Plugin {
  /** Plugin manifest */
  manifest: PluginManifest
  /** Node type classes provided by this plugin */
  nodeTypes: Array<new (properties: import("../interfaces").NodeProperties) => import("../core/base-node").BaseNode>
  /** Optional initialization function */
  initialize?: () => void | Promise<void>
  /** Optional cleanup function */
  cleanup?: () => void | Promise<void>
}

