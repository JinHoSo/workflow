/**
 * Test command
 * Runs tests for nodes and plugins
 */

import { Command } from "commander"
import { execSync } from "child_process"
import chalk from "chalk"
import * as fs from "fs-extra"
import * as path from "path"

/**
 * Options for test command
 */
interface TestOptions {
  watch?: boolean
  coverage?: boolean
  pattern?: string
}

/**
 * Runs tests
 * @param options - Test options
 */
export async function runTests(options: TestOptions = {}): Promise<void> {
  const cwd = process.cwd()

  // Check if we're in a testable directory
  const packageJsonPath = path.join(cwd, "package.json")
  if (!(await fs.pathExists(packageJsonPath))) {
    throw new Error("No package.json found. Please run this command from a plugin or node directory.")
  }

  const packageJson = await fs.readJson(packageJsonPath)

  // Check if jest is configured
  const hasJestConfig =
    (await fs.pathExists(path.join(cwd, "jest.config.js"))) ||
    (await fs.pathExists(path.join(cwd, "jest.config.ts"))) ||
    packageJson.jest !== undefined

  if (!hasJestConfig) {
    console.log(chalk.yellow("No Jest configuration found. Creating default jest.config.js..."))
    await createDefaultJestConfig(cwd)
  }

  console.log(chalk.blue("Running tests..."))

  try {
    let command = "jest"

    if (options.watch) {
      command += " --watch"
    }

    if (options.coverage) {
      command += " --coverage"
    }

    if (options.pattern) {
      command += ` --testNamePattern="${options.pattern}"`
    }

    execSync(command, { stdio: "inherit", cwd })
    console.log(chalk.green("✓ Tests completed successfully"))
  } catch (error) {
    console.error(chalk.red("✗ Tests failed"))
    throw error
  }
}

/**
 * Creates default Jest configuration
 */
async function createDefaultJestConfig(cwd: string): Promise<void> {
  const jestConfig = `module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
}
`

  await fs.writeFile(path.join(cwd, "jest.config.js"), jestConfig)
}

/**
 * Registers the test command
 */
export function registerTestCommand(program: Command): void {
  program
    .command("test")
    .description("Run tests")
    .option("-w, --watch", "Watch for changes and re-run tests")
    .option("-c, --coverage", "Generate coverage report")
    .option("-p, --pattern <pattern>", "Run tests matching pattern")
    .action(async (options: TestOptions) => {
      try {
        await runTests(options)
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })
}

