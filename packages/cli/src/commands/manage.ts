/**
 * Plugin management commands
 * List, update, remove, and info commands for plugins
 */

import { Command } from "commander"
import { execSync } from "child_process"
import chalk from "chalk"
import * as fs from "fs-extra"
import * as path from "path"
import { discoverPlugins } from "../../../src/plugins/plugin-discovery"
import { pluginRegistry } from "../../../src/plugins/plugin-registry"

/**
 * Lists installed plugins
 */
export async function listPlugins(): Promise<void> {
  const cwd = process.cwd()

  // Check for package.json
  const packageJsonPath = path.join(cwd, "package.json")
  if (!(await fs.pathExists(packageJsonPath))) {
    throw new Error("No package.json found. Please run this command from a project directory.")
  }

  // Discover plugins
  const plugins = await discoverPlugins({
    directories: [cwd],
    scanNodeModules: true,
  })

  if (plugins.length === 0) {
    console.log(chalk.yellow("No plugins found"))
    return
  }

  console.log(chalk.blue(`Found ${plugins.length} plugin(s):\n`))

  for (const plugin of plugins) {
    console.log(chalk.cyan(`${plugin.name}@${plugin.version}`))
    if (plugin.manifest.description) {
      console.log(`  ${plugin.manifest.description}`)
    }
    if (plugin.manifest.nodeTypes.length > 0) {
      console.log(`  Node Types: ${plugin.manifest.nodeTypes.join(", ")}`)
    }
    console.log(`  Path: ${plugin.path}`)
    console.log("")
  }
}

/**
 * Shows plugin information
 */
export async function showPluginInfo(pluginName: string): Promise<void> {
  const cwd = process.cwd()

  // Try to find plugin in node_modules
  const nodeModulesPath = path.join(cwd, "node_modules", pluginName)
  let pluginPath = nodeModulesPath

  if (!(await fs.pathExists(pluginPath))) {
    // Try scoped package
    const parts = pluginName.split("/")
    if (parts.length === 2) {
      pluginPath = path.join(cwd, "node_modules", parts[0], parts[1])
    }
  }

  if (!(await fs.pathExists(pluginPath))) {
    throw new Error(`Plugin ${pluginName} not found`)
  }

  const packageJsonPath = path.join(pluginPath, "package.json")
  if (!(await fs.pathExists(packageJsonPath))) {
    throw new Error(`Plugin ${pluginName} package.json not found`)
  }

  const packageJson = await fs.readJson(packageJsonPath)

  console.log(chalk.cyan(`\n${packageJson.name}@${packageJson.version}`))
  console.log("─".repeat(50))

  if (packageJson.description) {
    console.log(`Description: ${packageJson.description}`)
  }

  if (packageJson.author) {
    console.log(`Author: ${packageJson.author}`)
  }

  if (packageJson.license) {
    console.log(`License: ${packageJson.license}`)
  }

  const workflow = packageJson.workflow as Record<string, unknown> | undefined
  if (workflow) {
    console.log("\nWorkflow Metadata:")
    if (workflow.category) {
      console.log(`  Category: ${workflow.category}`)
    }
    if (Array.isArray(workflow.nodeTypes) && workflow.nodeTypes.length > 0) {
      console.log(`  Node Types: ${(workflow.nodeTypes as string[]).join(", ")}`)
    }
    if (Array.isArray(workflow.tags) && workflow.tags.length > 0) {
      console.log(`  Tags: ${(workflow.tags as string[]).join(", ")}`)
    }
    if (Array.isArray(workflow.dependencies) && workflow.dependencies.length > 0) {
      console.log(`  Dependencies: ${(workflow.dependencies as string[]).join(", ")}`)
    }
  }

  console.log(`\nPath: ${pluginPath}`)
}

/**
 * Updates a plugin
 */
export async function updatePlugin(pluginName: string): Promise<void> {
  const cwd = process.cwd()

  console.log(chalk.blue(`Updating plugin: ${pluginName}...`))

  try {
    execSync(`npm update ${pluginName}`, { stdio: "inherit", cwd })
    console.log(chalk.green(`✓ Plugin ${pluginName} updated`))
  } catch (error) {
    throw new Error(`Failed to update plugin: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Removes a plugin
 */
export async function removePlugin(pluginName: string): Promise<void> {
  const cwd = process.cwd()

  console.log(chalk.blue(`Removing plugin: ${pluginName}...`))

  // Check if plugin is registered
  const registered = pluginRegistry.get(pluginName)
  if (registered) {
    console.log(chalk.yellow("Plugin is currently registered. Unregistering..."))
    await pluginRegistry.unregister(pluginName)
  }

  try {
    execSync(`npm uninstall ${pluginName}`, { stdio: "inherit", cwd })
    console.log(chalk.green(`✓ Plugin ${pluginName} removed`))
  } catch (error) {
    throw new Error(`Failed to remove plugin: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Registers management commands
 */
export function registerManageCommands(program: Command): void {
  // List command
  program
    .command("list")
    .description("List installed plugins")
    .action(async () => {
      try {
        await listPlugins()
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })

  // Info command
  program
    .command("info <name>")
    .description("Show plugin information")
    .action(async (name: string) => {
      try {
        await showPluginInfo(name)
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })

  // Update command
  program
    .command("update <name>")
    .description("Update a plugin to latest version")
    .action(async (name: string) => {
      try {
        await updatePlugin(name)
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })

  // Remove command
  program
    .command("remove <name>")
    .alias("rm")
    .description("Remove a plugin")
    .action(async (name: string) => {
      try {
        await removePlugin(name)
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })
}

