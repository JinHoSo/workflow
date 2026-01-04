/**
 * Install command
 * Installs plugins from npm
 */

import { Command } from "commander"
import { execSync } from "child_process"
import chalk from "chalk"
import * as fs from "fs-extra"
import * as path from "path"
import { pluginStructureValidator } from "@workflow/plugins"
import { pluginRegistry } from "@workflow/plugins"

/**
 * Options for install command
 */
interface InstallOptions {
  /** Version to install */
  version?: string
  /** Save as dev dependency */
  dev?: boolean
  /** Skip validation */
  skipValidation?: boolean
}

/**
 * Installs a plugin from npm
 * @param pluginName - Name of plugin to install
 * @param options - Install options
 */
export async function installPlugin(pluginName: string, options: InstallOptions = {}): Promise<void> {
  const cwd = process.cwd()

  console.log(chalk.blue(`Installing plugin: ${pluginName}...`))

  // Install npm package
  const packageSpec = options.version ? `${pluginName}@${options.version}` : pluginName
  const installCmd = options.dev ? `npm install --save-dev ${packageSpec}` : `npm install ${packageSpec}`

  try {
    console.log(chalk.blue("Installing npm package..."))
    execSync(installCmd, { stdio: "inherit", cwd })
    console.log(chalk.green("✓ Package installed"))
  } catch (error) {
    throw new Error(`Failed to install package: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Find installed plugin
  const nodeModulesPath = path.join(cwd, "node_modules", pluginName)
  if (!(await fs.pathExists(nodeModulesPath))) {
    // Try scoped package
    const scopedPath = path.join(cwd, "node_modules", `@${pluginName.split("/")[0]}`, pluginName.split("/")[1] || "")
    if (await fs.pathExists(scopedPath)) {
      await processInstalledPlugin(scopedPath, options)
      return
    }
    throw new Error(`Plugin ${pluginName} not found in node_modules`)
  }

  await processInstalledPlugin(nodeModulesPath, options)
}

/**
 * Processes an installed plugin
 */
async function processInstalledPlugin(pluginPath: string, options: InstallOptions): Promise<void> {
  // Validate plugin structure
  if (!options.skipValidation) {
    console.log(chalk.blue("Validating plugin structure..."))
    const validation = await pluginStructureValidator.validateStructure(pluginPath)

    if (!validation.valid) {
      console.error(chalk.red("Plugin validation failed:"))
      for (const error of validation.errors) {
        console.error(chalk.red(`  - ${error}`))
      }
      throw new Error("Plugin structure validation failed")
    }

    if (validation.warnings.length > 0) {
      console.log(chalk.yellow("Validation warnings:"))
      for (const warning of validation.warnings) {
        console.log(chalk.yellow(`  - ${warning}`))
      }
    }

    console.log(chalk.green("✓ Plugin structure validated"))
  }

  // TODO: Auto-register plugin
  // This would require loading the plugin module and registering it
  console.log(chalk.green(`✓ Plugin ${path.basename(pluginPath)} installed successfully`))
  console.log(chalk.yellow("\nNote: Plugin will be automatically discovered on next application start"))
}

/**
 * Registers the install command
 */
export function registerInstallCommand(program: Command): void {
  program
    .command("install <name>")
    .alias("i")
    .description("Install a plugin from npm")
    .option("-v, --version <version>", "Plugin version to install")
    .option("-D, --dev", "Install as dev dependency")
    .option("--skip-validation", "Skip plugin structure validation")
    .action(async (name: string, options: InstallOptions) => {
      try {
        await installPlugin(name, options)
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })
}

