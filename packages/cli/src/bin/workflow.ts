#!/usr/bin/env node

/**
 * Workflow CLI entry point
 * Provides commands for node and plugin development
 */

import { Command } from "commander"
import * as fs from "fs"
import * as path from "path"

// Read version from package.json
const packageJsonPath = path.join(__dirname, "../../package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
const version = packageJson.version

const program = new Command()

/**
 * Main CLI program setup
 */
program
  .name("workflow")
  .description("CLI tool for workflow node and plugin development")
  .version(version, "-v, --version", "display version number")

// Import and register commands
import { registerCreateNodeCommand } from "../commands/create-node"
import { registerCreatePluginCommand } from "../commands/create-plugin"
import { registerBuildCommand } from "../commands/build"
import { registerTestCommand } from "../commands/test"
import { registerValidateCommand } from "../commands/validate"
import { registerPublishCommand } from "../commands/publish"
import { registerSearchCommand } from "../commands/search"
import { registerInstallCommand } from "../commands/install"
import { registerManageCommands } from "../commands/manage"
import { registerDevCommand } from "../commands/dev"

registerCreateNodeCommand(program)
registerCreatePluginCommand(program)
registerBuildCommand(program)
registerTestCommand(program)
registerValidateCommand(program)
registerPublishCommand(program)
registerSearchCommand(program)
registerInstallCommand(program)
registerManageCommands(program)
registerDevCommand(program)

// Help command is built-in to commander
// Version command is added above

// If no command provided, show help
if (process.argv.length === 2) {
  program.help()
}

program.parse(process.argv)

