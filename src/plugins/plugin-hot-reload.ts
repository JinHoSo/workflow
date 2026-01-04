/**
 * Hot reloading for plugin development
 * Watches for file changes and reloads plugins automatically
 */

import * as chokidar from "chokidar"
import * as path from "path"
import type { PluginRegistry } from "./plugin-registry"
import type { Plugin } from "./plugin-manifest"

/**
 * Options for hot reloading
 */
export interface HotReloadOptions {
  /** Directories to watch */
  watchDirs?: string[]
  /** File patterns to watch */
  patterns?: string[]
  /** Whether to preserve state during reload */
  preserveState?: boolean
}

/**
 * Hot reload event types
 */
export type HotReloadEvent = "change" | "add" | "unlink" | "error"

/**
 * Hot reload event handler
 */
export type HotReloadEventHandler = (event: HotReloadEvent, filePath: string) => void | Promise<void>

/**
 * Manages hot reloading for plugins during development
 */
export class PluginHotReloader {
  private watchers: chokidar.FSWatcher[] = []
  private pluginRegistry?: PluginRegistry
  private eventHandlers: HotReloadEventHandler[] = []
  private isWatching = false

  /**
   * Sets the plugin registry to use for reloading
   * @param registry - Plugin registry instance
   */
  setPluginRegistry(registry: PluginRegistry): void {
    this.pluginRegistry = registry
  }

  /**
   * Adds an event handler
   * @param handler - Event handler function
   */
  on(handler: HotReloadEventHandler): void {
    this.eventHandlers.push(handler)
  }

  /**
   * Removes an event handler
   * @param handler - Event handler function
   */
  off(handler: HotReloadEventHandler): void {
    const index = this.eventHandlers.indexOf(handler)
    if (index > -1) {
      this.eventHandlers.splice(index, 1)
    }
  }

  /**
   * Starts watching for changes
   * @param options - Hot reload options
   */
  async start(options: HotReloadOptions = {}): Promise<void> {
    if (!chokidar) {
      throw new Error("chokidar is required for hot reloading. Install it with: npm install chokidar")
    }

    if (this.isWatching) {
      throw new Error("Hot reloader is already watching")
    }

    const watchDirs = options.watchDirs || [process.cwd()]
    const patterns = options.patterns || ["**/*.ts", "**/*.js"]

    for (const dir of watchDirs) {
      const watcher = chokidar!.watch(patterns, {
        cwd: dir,
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
      })

      watcher.on("change", async (filePath) => {
        await this.handleChange("change", path.join(dir, filePath), options)
      })

      watcher.on("add", async (filePath) => {
        await this.handleChange("add", path.join(dir, filePath), options)
      })

      watcher.on("unlink", async (filePath) => {
        await this.handleChange("unlink", path.join(dir, filePath), options)
      })

      watcher.on("error", async (error) => {
        await this.handleError(error)
      })

      this.watchers.push(watcher)
    }

    this.isWatching = true
  }

  /**
   * Stops watching for changes
   */
  async stop(): Promise<void> {
    for (const watcher of this.watchers) {
      await watcher.close()
    }
    this.watchers = []
    this.isWatching = false
  }

  /**
   * Handles file change events
   */
  private async handleChange(
    event: HotReloadEvent,
    filePath: string,
    options: HotReloadOptions,
  ): Promise<void> {
    // Notify event handlers
    for (const handler of this.eventHandlers) {
      try {
        await handler(event, filePath)
      } catch (error) {
        console.error(`Error in hot reload handler: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Try to reload plugin if registry is available
    if (this.pluginRegistry && this.isPluginFile(filePath)) {
      await this.reloadPlugin(filePath, options)
    }
  }

  /**
   * Handles errors
   */
  private async handleError(error: Error): Promise<void> {
    for (const handler of this.eventHandlers) {
      try {
        await handler("error", error.message)
      } catch (handlerError) {
        console.error(`Error in hot reload error handler: ${handlerError instanceof Error ? handlerError.message : String(handlerError)}`)
      }
    }
  }

  /**
   * Checks if a file is a plugin file
   */
  private isPluginFile(filePath: string): boolean {
    return filePath.includes("src") && (filePath.endsWith(".ts") || filePath.endsWith(".js"))
  }

  /**
   * Reloads a plugin
   */
  private async reloadPlugin(filePath: string, options: HotReloadOptions): Promise<void> {
    // Find plugin directory
    const pluginDir = this.findPluginDir(filePath)
    if (!pluginDir) {
      return
    }

    try {
      // In a real implementation, this would:
      // 1. Clear module cache for the plugin
      // 2. Re-require the plugin module
      // 3. Unregister old plugin
      // 4. Register new plugin
      // For now, we'll just log the reload attempt
      console.log(`Reloading plugin at ${pluginDir}...`)

      // TODO: Implement actual plugin reloading
      // This requires module cache management which is complex
    } catch (error) {
      console.error(`Failed to reload plugin: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Finds plugin directory from file path
   */
  private findPluginDir(filePath: string): string | null {
    let current = path.dirname(filePath)

    while (current !== path.dirname(current)) {
      const packageJsonPath = path.join(current, "package.json")
      if (require("fs").existsSync(packageJsonPath)) {
        try {
          const packageJson = require(packageJsonPath)
          if (packageJson.workflow?.plugin === true) {
            return current
          }
        } catch {
          // Continue searching
        }
      }
      current = path.dirname(current)
    }

    return null
  }

  /**
   * Gets reload status
   */
  getStatus(): { watching: boolean; watchers: number } {
    return {
      watching: this.isWatching,
      watchers: this.watchers.length,
    }
  }
}

/**
 * Global hot reloader instance
 */
export const pluginHotReloader = new PluginHotReloader()

