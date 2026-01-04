/**
 * Plugin discovery utilities
 * Scans npm packages and local directories for workflow plugins
 */

import * as fs from "fs-extra"
import * as path from "path"
import type { PluginManifest } from "@workflow/plugins"

/**
 * Plugin discovery result
 */
export interface DiscoveredPlugin {
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Plugin path */
  path: string
  /** Plugin manifest */
  manifest: PluginManifest
  /** Package.json content */
  packageJson: Record<string, unknown>
}

/**
 * Options for plugin discovery
 */
export interface DiscoveryOptions {
  /** Directories to scan for plugins */
  directories?: string[]
  /** Whether to scan node_modules */
  scanNodeModules?: boolean
  /** Cache results */
  useCache?: boolean
}

/**
 * Discovers plugins in the specified directories
 * @param options - Discovery options
 * @returns Array of discovered plugins
 */
export async function discoverPlugins(options: DiscoveryOptions = {}): Promise<DiscoveredPlugin[]> {
  const plugins: DiscoveredPlugin[] = []
  const directories = options.directories || [process.cwd()]

  for (const dir of directories) {
    // Scan local directory
    const localPlugins = await scanDirectory(dir)
    plugins.push(...localPlugins)

    // Scan node_modules if requested
    if (options.scanNodeModules) {
      const nodeModulesPath = path.join(dir, "node_modules")
      if (await fs.pathExists(nodeModulesPath)) {
        const npmPlugins = await scanNodeModules(nodeModulesPath)
        plugins.push(...npmPlugins)
      }
    }
  }

  return plugins
}

/**
 * Scans a directory for plugins
 */
async function scanDirectory(dir: string): Promise<DiscoveredPlugin[]> {
  const plugins: DiscoveredPlugin[] = []

  if (!(await fs.pathExists(dir))) {
    return plugins
  }

  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const pluginPath = path.join(dir, entry.name)
      const plugin = await tryLoadPlugin(pluginPath)
      if (plugin) {
        plugins.push(plugin)
      }
    }
  }

  return plugins
}

/**
 * Scans node_modules for workflow plugins
 */
async function scanNodeModules(nodeModulesDir: string): Promise<DiscoveredPlugin[]> {
  const plugins: DiscoveredPlugin[] = []

  if (!(await fs.pathExists(nodeModulesDir))) {
    return plugins
  }

  const entries = await fs.readdir(nodeModulesDir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      const packagePath = path.join(nodeModulesDir, entry.name)
      const plugin = await tryLoadPlugin(packagePath)
      if (plugin) {
        plugins.push(plugin)
      }
    }
  }

  return plugins
}

/**
 * Attempts to load a plugin from a directory
 * @param pluginPath - Path to potential plugin directory
 * @returns Plugin if found, undefined otherwise
 */
async function tryLoadPlugin(pluginPath: string): Promise<DiscoveredPlugin | undefined> {
  const packageJsonPath = path.join(pluginPath, "package.json")

  if (!(await fs.pathExists(packageJsonPath))) {
    return undefined
  }

  try {
    const packageJson = await fs.readJson(packageJsonPath)

    // Check if it's a workflow plugin
    const workflow = packageJson.workflow as Record<string, unknown> | undefined
    if (!workflow || workflow.plugin !== true) {
      return undefined
    }

    // Try to load manifest
    const manifest = await loadPluginManifest(pluginPath, packageJson)

    return {
      name: packageJson.name as string,
      version: packageJson.version as string,
      path: pluginPath,
      manifest,
      packageJson,
    }
  } catch (error) {
    // Silently skip invalid plugins
    return undefined
  }
}

/**
 * Loads plugin manifest from package.json or manifest file
 */
async function loadPluginManifest(
  pluginPath: string,
  packageJson: Record<string, unknown>,
): Promise<PluginManifest> {
  // Try to load from src/manifest.ts or src/manifest.js
  const manifestPaths = [
    path.join(pluginPath, "src", "manifest.ts"),
    path.join(pluginPath, "src", "manifest.js"),
    path.join(pluginPath, "dist", "manifest.js"),
  ]

  for (const manifestPath of manifestPaths) {
    if (await fs.pathExists(manifestPath)) {
      try {
        // For TypeScript files, we'd need to compile first
        // For now, we'll extract from package.json
        break
      } catch {
        // Continue to next path
      }
    }
  }

  // Extract manifest from package.json workflow metadata
  const workflow = packageJson.workflow as Record<string, unknown> | undefined
  const nodeTypes = (workflow?.nodeTypes as string[]) || []

  return {
    name: packageJson.name as string,
    version: packageJson.version as string,
    displayName: (packageJson.displayName as string) || (packageJson.name as string),
    description: (packageJson.description as string) || "",
    author: (packageJson.author as string) || "",
    dependencies: (workflow?.dependencies as string[]) || [],
    nodeTypes,
  }
}

/**
 * Checks if a package is a workflow plugin
 */
export function isWorkflowPlugin(packageJson: Record<string, unknown>): boolean {
  const workflow = packageJson.workflow as Record<string, unknown> | undefined
  return workflow?.plugin === true
}

/**
 * Gets plugin metadata from package.json
 */
export function getPluginMetadata(packageJson: Record<string, unknown>): {
  nodeTypes: string[]
  dependencies: string[]
} {
  const workflow = packageJson.workflow as Record<string, unknown> | undefined
  return {
    nodeTypes: (workflow?.nodeTypes as string[]) || [],
    dependencies: (workflow?.dependencies as string[]) || [],
  }
}

