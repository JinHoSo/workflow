import type { Plugin } from "./plugin-manifest"

/**
 * Plugin registry for managing and loading plugins
 */
export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map()

  /**
   * Registers a plugin
   * @param plugin - Plugin to register
   * @throws Error if plugin dependencies are not satisfied or plugin is already registered
   */
  async register(plugin: Plugin): Promise<void> {
    const key = `${plugin.manifest.name}@${plugin.manifest.version}`

    // Check if already registered
    if (this.plugins.has(key)) {
      throw new Error(`Plugin ${key} is already registered`)
    }

    // Validate dependencies
    if (plugin.manifest.dependencies) {
      for (const dep of plugin.manifest.dependencies) {
        const [depName, depVersion] = dep.split("@")
        const depKey = depVersion ? `${depName}@${depVersion}` : depName
        if (!this.plugins.has(depKey) && !this.findPluginByName(depName)) {
          throw new Error(`Plugin ${key} requires dependency ${dep} which is not registered`)
        }
      }
    }

    // Initialize plugin if provided
    if (plugin.initialize) {
      await plugin.initialize()
    }

    // Register plugin
    this.plugins.set(key, plugin)

    // Register node types if registry is available
    // Note: This is a simplified version - full implementation would create NodeType instances
    // For now, we just store the plugin information
    // TODO: Integrate with NodeTypeRegistry to register node types from plugins
  }

  /**
   * Unregisters a plugin
   * @param pluginName - Name of the plugin to unregister
   * @param version - Optional version (unregisters specific version)
   */
  async unregister(pluginName: string, version?: string): Promise<void> {
    const key = version ? `${pluginName}@${version}` : this.findPluginKeyByName(pluginName)
    if (!key) {
      throw new Error(`Plugin ${pluginName}${version ? `@${version}` : ""} not found`)
    }

    const plugin = this.plugins.get(key)
    if (plugin) {
      // Cleanup plugin if provided
      if (plugin.cleanup) {
        await plugin.cleanup()
      }

      this.plugins.delete(key)
    }
  }

  /**
   * Gets a registered plugin
   * @param pluginName - Name of the plugin
   * @param version - Optional version (returns latest if not specified)
   * @returns Plugin instance or undefined
   */
  get(pluginName: string, version?: string): Plugin | undefined {
    if (version) {
      return this.plugins.get(`${pluginName}@${version}`)
    }

    // Find latest version
    const key = this.findPluginKeyByName(pluginName)
    return key ? this.plugins.get(key) : undefined
  }

  /**
   * Gets all registered plugins
   * @returns Array of all registered plugins
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Finds plugin key by name (returns latest version)
   * @param pluginName - Name of the plugin
   * @returns Plugin key or undefined
   */
  private findPluginKeyByName(pluginName: string): string | undefined {
    let latestKey: string | undefined
    let latestVersion = ""

    for (const key of this.plugins.keys()) {
      const [name, version] = key.split("@")
      if (name === pluginName) {
        if (!latestVersion || this.compareVersions(version, latestVersion) > 0) {
          latestVersion = version
          latestKey = key
        }
      }
    }

    return latestKey
  }

  /**
   * Finds plugin by name (returns latest version)
   * @param pluginName - Name of the plugin
   * @returns Plugin instance or undefined
   */
  private findPluginByName(pluginName: string): Plugin | undefined {
    const key = this.findPluginKeyByName(pluginName)
    return key ? this.plugins.get(key) : undefined
  }

  /**
   * Compares two semantic versions
   * @param v1 - First version
   * @param v2 - Second version
   * @returns Positive if v1 > v2, negative if v1 < v2, 0 if equal
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split(".").map(Number)
    const parts2 = v2.split(".").map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0
      const part2 = parts2[i] || 0
      if (part1 > part2) return 1
      if (part1 < part2) return -1
    }

    return 0
  }
}

/**
 * Global plugin registry instance
 */
export const pluginRegistry = new PluginRegistry()

