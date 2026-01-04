/**
 * Publish command
 * Publishes plugins to npm registry
 */

import { Command } from "commander"
import { execSync } from "child_process"
import chalk from "chalk"
import * as fs from "fs-extra"
import * as path from "path"
import { build } from "./build"

/**
 * Options for publish command
 */
interface PublishOptions {
  /** Dry run without actually publishing */
  dryRun?: boolean
  /** Version to bump (patch, minor, major) */
  bump?: "patch" | "minor" | "major"
  /** Skip build step */
  skipBuild?: boolean
}

/**
 * Publishes a plugin to npm
 * @param options - Publish options
 */
export async function publish(options: PublishOptions = {}): Promise<void> {
  const cwd = process.cwd()

  // Check if we're in a plugin directory
  const packageJsonPath = path.join(cwd, "package.json")
  if (!(await fs.pathExists(packageJsonPath))) {
    throw new Error("No package.json found. Please run this command from a plugin directory.")
  }

  const packageJson = await fs.readJson(packageJsonPath)

  // Check if it's a workflow plugin
  const isPlugin = packageJson.workflow?.plugin === true
  if (!isPlugin) {
    throw new Error("This is not a workflow plugin. Only plugins can be published.")
  }

  console.log(chalk.blue(`Publishing plugin: ${packageJson.name}...`))

  // Validate version
  if (!packageJson.version) {
    throw new Error("Package version is required in package.json")
  }

  // Bump version if requested
  if (options.bump) {
    await bumpVersion(packageJsonPath, options.bump)
    // Reload package.json after bump
    const updatedPackageJson = await fs.readJson(packageJsonPath)
    console.log(chalk.green(`Version bumped to ${updatedPackageJson.version}`))
  }

  // Build before publish (unless skipped)
  if (!options.skipBuild) {
    console.log(chalk.blue("Building plugin..."))
    try {
      await build({})
    } catch (error) {
      throw new Error(`Build failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Validate plugin structure
  await validatePluginStructure(cwd, packageJson)

  // Publish to npm
  if (options.dryRun) {
    console.log(chalk.yellow("Dry run mode - would publish:"))
    console.log(`  Package: ${packageJson.name}`)
    console.log(`  Version: ${packageJson.version}`)
    console.log(`  Files: dist/, src/`)
  } else {
    console.log(chalk.blue("Publishing to npm..."))
    try {
      execSync("npm publish", { stdio: "inherit", cwd })
      console.log(chalk.green(`✓ Successfully published ${packageJson.name}@${packageJson.version}`))
    } catch (error) {
      console.error(chalk.red("✗ Failed to publish"))
      throw error
    }
  }
}

/**
 * Bumps version in package.json
 */
async function bumpVersion(packageJsonPath: string, type: "patch" | "minor" | "major"): Promise<void> {
  const packageJson = await fs.readJson(packageJsonPath)
  const currentVersion = packageJson.version as string

  const parts = currentVersion.split(".").map(Number)
  if (parts.length !== 3) {
    throw new Error(`Invalid version format: ${currentVersion}`)
  }

  let [major, minor, patch] = parts

  switch (type) {
    case "major":
      major++
      minor = 0
      patch = 0
      break
    case "minor":
      minor++
      patch = 0
      break
    case "patch":
      patch++
      break
  }

  packageJson.version = `${major}.${minor}.${patch}`
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 })
}

/**
 * Validates plugin structure before publishing
 */
async function validatePluginStructure(
  pluginDir: string,
  packageJson: Record<string, unknown>,
): Promise<void> {
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

  // Check required files
  const requiredFiles = ["src/index.ts", "package.json"]
  for (const file of requiredFiles) {
    const filePath = path.join(pluginDir, file)
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Required file missing: ${file}`)
    }
  }

  // Check dist directory exists (if not skipping build)
  const distPath = path.join(pluginDir, "dist")
  if (!(await fs.pathExists(distPath))) {
    throw new Error("dist/ directory not found. Run 'workflow build' first.")
  }

  console.log(chalk.green("✓ Plugin structure validated"))
}

/**
 * Registers the publish command
 */
export function registerPublishCommand(program: Command): void {
  program
    .command("publish")
    .description("Publish a plugin to npm")
    .option("-d, --dry-run", "Dry run without actually publishing")
    .option("-b, --bump <type>", "Bump version (patch, minor, major)")
    .option("--skip-build", "Skip build step")
    .action(async (options: PublishOptions) => {
      try {
        await publish(options)
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })
}

