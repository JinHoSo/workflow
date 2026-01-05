import * as path from "path"
import type { Plugin } from "./plugin-manifest"
import type { NodeTypeRegistry } from "@workflow/interfaces"
import { discoverPlugins, type DiscoveryOptions, type DiscoveredPlugin } from "./plugin-discovery"

/**
 * Plugin loading strategy
 */
export type LoadingStrategy = "eager" | "lazy"

/**
 * Plugin registry for managing and loading plugins
 * Integrates with NodeTypeRegistry to automatically register node types from plugins
 */
export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map()
  private nodeTypeRegistry?: NodeTypeRegistry
  private loadingStrategy: LoadingStrategy = "eager"
  private discoveredPlugins: Map<string, DiscoveredPlugin> = new Map()

  /**
   * Sets the node type registry to use for plugin node type registration
   * @param registry - Node type registry instance
   */
  setNodeTypeRegistry(registry: NodeTypeRegistry): void {
    this.nodeTypeRegistry = registry
  }

  /**
   * Registers a plugin
   * Automatically registers node types from the plugin in NodeTypeRegistry if available
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

    // Register node types from plugin in NodeTypeRegistry if available
    if (this.nodeTypeRegistry && plugin.nodeTypes.length > 0) {
      // Use the registry's plugin integration method
      if ("registerFromPlugin" in this.nodeTypeRegistry && typeof this.nodeTypeRegistry.registerFromPlugin === "function") {
        this.nodeTypeRegistry.registerFromPlugin(plugin)
      }
    }
  }

  /**
   * Unregisters a plugin
   * Automatically unregisters node types from the plugin in NodeTypeRegistry if available
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
      // Unregister node types from NodeTypeRegistry if available
      if (this.nodeTypeRegistry && "unregisterFromPlugin" in this.nodeTypeRegistry && typeof this.nodeTypeRegistry.unregisterFromPlugin === "function") {
        this.nodeTypeRegistry.unregisterFromPlugin(key)
      }

      // Cleanup plugin if provided
      if (plugin.cleanup) {
        await plugin.cleanup()
      }

      this.plugins.delete(key)
    }
  }

  /**
   * Gets a registered plugin
   * @param pluginName - Name of the plugin, or "plugin@version" format
   * @param version - Optional version (returns latest if not specified)
   * @returns Plugin instance or undefined
   */
  get(pluginName: string, version?: string): Plugin | undefined {
    // Check if pluginName contains version (format: "plugin@version")
    if (pluginName.includes("@") && !version) {
      const [name, ver] = pluginName.split("@")
      return this.plugins.get(`${name}@${ver}`)
    }

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
   * Sets the loading strategy for plugins
   * @param strategy - Loading strategy (eager or lazy)
   */
  setLoadingStrategy(strategy: LoadingStrategy): void {
    this.loadingStrategy = strategy
  }

  /**
   * Discovers plugins in the specified directories
   * @param options - Discovery options
   * @returns Array of discovered plugins
   */
  async discover(options: DiscoveryOptions = {}): Promise<DiscoveredPlugin[]> {
    const discovered = await discoverPlugins(options)

    // Store discovered plugins
    for (const plugin of discovered) {
      const key = `${plugin.name}@${plugin.version}`
      this.discoveredPlugins.set(key, plugin)
    }

    // Auto-load if strategy is eager
    if (this.loadingStrategy === "eager") {
      await this.loadDiscoveredPlugins(discovered)
    }

    return discovered
  }

  /**
   * Loads discovered plugins
   * @param discovered - Array of discovered plugins to load
   */
  async loadDiscoveredPlugins(discovered: DiscoveredPlugin[]): Promise<void> {
    for (const discoveredPlugin of discovered) {
      try {
        // Try to load the plugin module
        const plugin = await this.loadPluginFromPath(discoveredPlugin.path)
        if (plugin) {
          await this.register(plugin)
        }
      } catch (error) {
        // Log error but continue loading other plugins
        console.error(`Failed to load plugin ${discoveredPlugin.name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  /**
   * Loads a plugin from a file path
   * @param pluginPath - Path to plugin directory
   * @returns Plugin instance or undefined
   */
  private async loadPluginFromPath(pluginPath: string): Promise<Plugin | undefined> {
    try {
      // Try to load from dist/index.js (compiled) or src/index.ts (development)
      const distPath = require.resolve(path.join(pluginPath, "dist", "index.js"))
      if (distPath) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pluginModule = require(distPath)
        return pluginModule.plugin as Plugin
      }
    } catch {
      // Try src path or other locations
      try {
        const srcPath = require.resolve(path.join(pluginPath, "src", "index.ts"))
        if (srcPath) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pluginModule = require(srcPath)
          return pluginModule.plugin as Plugin
        }
      } catch {
        // Plugin not found or not loadable
        return undefined
      }
    }

    return undefined
  }

  /**
   * Gets all discovered plugins
   * @returns Array of discovered plugins
   */
  getDiscoveredPlugins(): DiscoveredPlugin[] {
    return Array.from(this.discoveredPlugins.values())
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

