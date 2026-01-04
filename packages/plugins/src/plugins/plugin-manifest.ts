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
  /** Plugin category */
  category?: string
  /** Plugin tags for search and filtering */
  tags?: string[]
  /** Path to plugin icon */
  icon?: string
  /** Node type metadata */
  nodeTypeMetadata?: Record<
    string,
    {
      /** Display name for the node type */
      displayName?: string
      /** Description for the node type */
      description?: string
      /** Category for the node type */
      category?: string
      /** Tags for the node type */
      tags?: string[]
      /** Icon path for the node type */
      icon?: string
    }
  >
}

/**
 * Plugin interface for node type packages
 */
export interface Plugin {
  /** Plugin manifest */
  manifest: PluginManifest
  /** Node type classes provided by this plugin */
  nodeTypes: Array<new (properties: import("@workflow/interfaces").NodeProperties) => import("@workflow/core").BaseNode>
  /** Optional initialization function */
  initialize?: () => void | Promise<void>
  /** Optional cleanup function */
  cleanup?: () => void | Promise<void>
}

