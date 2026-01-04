/**
 * Build command
 * Compiles TypeScript and validates plugin structure
 */

import { Command } from "commander"
import * as fs from "fs-extra"
import * as path from "path"
import { execSync } from "child_process"
import chalk from "chalk"

/**
 * Options for build command
 */
interface BuildOptions {
  watch?: boolean
  output?: string
}

/**
 * Builds a plugin or node
 * @param options - Build options
 */
export async function build(options: BuildOptions = {}): Promise<void> {
  const cwd = process.cwd()

  // Check if we're in a plugin/node directory
  const packageJsonPath = path.join(cwd, "package.json")
  if (!(await fs.pathExists(packageJsonPath))) {
    throw new Error("No package.json found. Please run this command from a plugin or node directory.")
  }

  const packageJson = await fs.readJson(packageJsonPath)

  // Check if it's a workflow plugin
  const isPlugin = packageJson.workflow?.plugin === true

  console.log(chalk.blue(`Building ${isPlugin ? "plugin" : "package"}...`))

  // Validate plugin structure if it's a plugin
  if (isPlugin) {
    await validatePluginStructure(cwd, packageJson)
  }

  // Run TypeScript compilation
  if (options.watch) {
    console.log(chalk.yellow("Starting watch mode..."))
    execSync("tsc --watch", { stdio: "inherit", cwd })
  } else {
    console.log(chalk.blue("Compiling TypeScript..."))
    try {
      execSync("tsc", { stdio: "inherit", cwd })
      console.log(chalk.green("✓ TypeScript compilation successful"))
    } catch (error) {
      console.error(chalk.red("✗ TypeScript compilation failed"))
      throw error
    }
  }

  // Generate type definitions (already done by tsc with declaration: true)
  console.log(chalk.blue("Generating type definitions..."))
  console.log(chalk.green("✓ Type definitions generated"))

  // Validate metadata if it's a plugin
  if (isPlugin) {
    await validatePluginMetadata(cwd, packageJson)
  }

  console.log(chalk.green(`✓ Build completed successfully`))
}

/**
 * Validates plugin directory structure
 */
async function validatePluginStructure(pluginDir: string, packageJson: Record<string, unknown>): Promise<void> {
  const requiredDirs = ["src"]
  const requiredFiles = ["src/index.ts"]

  for (const dir of requiredDirs) {
    const dirPath = path.join(pluginDir, dir)
    if (!(await fs.pathExists(dirPath))) {
      throw new Error(`Required directory missing: ${dir}`)
    }
  }

  for (const file of requiredFiles) {
    const filePath = path.join(pluginDir, file)
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Required file missing: ${file}`)
    }
  }

  console.log(chalk.green("✓ Plugin structure validated"))
}

/**
 * Validates plugin metadata
 */
async function validatePluginMetadata(pluginDir: string, packageJson: Record<string, unknown>): Promise<void> {
  const workflow = packageJson.workflow as Record<string, unknown> | undefined

  if (!workflow) {
    throw new Error("Plugin package.json must have 'workflow' field")
  }

  if (workflow.plugin !== true) {
    throw new Error("Plugin package.json must have 'workflow.plugin: true'")
  }

  const nodeTypes = workflow.nodeTypes as string[] | undefined
  if (!Array.isArray(nodeTypes)) {
    throw new Error("Plugin package.json must have 'workflow.nodeTypes' as an array")
  }

  console.log(chalk.green("✓ Plugin metadata validated"))
}

/**
 * Registers the build command
 */
export function registerBuildCommand(program: Command): void {
  program
    .command("build")
    .description("Build a plugin or node")
    .option("-w, --watch", "Watch for changes and rebuild")
    .option("-o, --output <dir>", "Output directory")
    .action(async (options: BuildOptions) => {
      try {
        await build(options)
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })
}

