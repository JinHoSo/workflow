/**
 * Dev command
 * Development mode with hot reloading
 */

import { Command } from "commander"
import chalk from "chalk"
import { pluginHotReloader } from "@workflow/plugins"
import { pluginRegistry } from "@workflow/plugins"

/**
 * Options for dev command
 */
interface DevOptions {
  /** Directories to watch */
  watch?: string[]
}

/**
 * Starts development mode with hot reloading
 * @param options - Dev options
 */
export async function startDevMode(options: DevOptions = {}): Promise<void> {
  console.log(chalk.blue("Starting development mode with hot reloading..."))

  // Set up hot reloader
  pluginHotReloader.setPluginRegistry(pluginRegistry)

  // Add event handlers
  pluginHotReloader.on(async (event, filePath) => {
    if (event === "change") {
      console.log(chalk.yellow(`File changed: ${filePath}`))
    } else if (event === "add") {
      console.log(chalk.green(`File added: ${filePath}`))
    } else if (event === "unlink") {
      console.log(chalk.red(`File removed: ${filePath}`))
    } else if (event === "error") {
      console.error(chalk.red(`Error: ${filePath}`))
    }
  })

  // Start watching
  const watchDirs = options.watch || [process.cwd()]
  await pluginHotReloader.start({
    watchDirs,
    preserveState: true,
  })

  const status = pluginHotReloader.getStatus()
  console.log(chalk.green(`✓ Hot reloading active (watching ${status.watchers} directory/ies)`))
  console.log(chalk.yellow("\nPress Ctrl+C to stop\n"))

  // Keep process alive
  process.on("SIGINT", async () => {
    console.log(chalk.yellow("\nStopping hot reloader..."))
    await pluginHotReloader.stop()
    process.exit(0)
  })
}

/**
 * Registers the dev command
 */
export function registerDevCommand(program: Command): void {
  program
    .command("dev")
    .description("Start development mode with hot reloading")
    .option("-w, --watch <dirs...>", "Directories to watch", (val) => val.split(","))
    .action(async (options: DevOptions) => {
      try {
        await startDevMode(options)
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })
}

