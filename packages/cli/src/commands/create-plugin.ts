/**
 * Create plugin command
 * Generates a new plugin with standard structure
 */

import { Command } from "commander"
import * as fs from "fs-extra"
import * as path from "path"
import chalk from "chalk"
import inquirer from "inquirer"

/**
 * Options for create plugin command
 */
interface CreatePluginOptions {
  output?: string
  author?: string
  description?: string
}

/**
 * Creates a new plugin with the specified name
 * @param pluginName - Name of the plugin to create
 * @param options - Command options
 */
export async function createPlugin(pluginName: string, options: CreatePluginOptions = {}): Promise<void> {
  // Validate plugin name
  if (!/^[a-z][a-z0-9-]*$/.test(pluginName)) {
    throw new Error(
      "Plugin name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens",
    )
  }

  const outputDir = options.output || process.cwd()
  const pluginDir = path.join(outputDir, pluginName)

  // Check if directory already exists
  if (await fs.pathExists(pluginDir)) {
    throw new Error(`Directory ${pluginDir} already exists`)
  }

  // Prompt for additional information if not provided
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "author",
      message: "Author name:",
      default: options.author || "",
      when: !options.author,
    },
    {
      type: "input",
      name: "description",
      message: "Plugin description:",
      default: options.description || `Workflow plugin: ${pluginName}`,
      when: !options.description,
    },
  ])

  const author = options.author || answers.author || ""
  const description = options.description || answers.description || `Workflow plugin: ${pluginName}`

  console.log(chalk.blue(`Creating plugin: ${pluginName}...`))

  // Create directory structure
  await fs.ensureDir(pluginDir)
  await fs.ensureDir(path.join(pluginDir, "src"))
  await fs.ensureDir(path.join(pluginDir, "src", "nodes"))
  await fs.ensureDir(path.join(pluginDir, "schemas"))
  await fs.ensureDir(path.join(pluginDir, "icons"))

  // Generate plugin manifest
  await generatePluginManifest(pluginDir, pluginName, author, description)

  // Generate plugin index file
  await generatePluginIndex(pluginDir)

  // Generate package.json with workflow metadata
  await generatePluginPackageJson(pluginDir, pluginName, author, description)

  // Generate README.md
  await generatePluginReadme(pluginDir, pluginName, description)

  // Generate LICENSE
  await generateLicense(pluginDir, author)

  console.log(chalk.green(`✓ Plugin created successfully at ${pluginDir}`))
  console.log(chalk.yellow(`\nNext steps:`))
  console.log(chalk.yellow(`  1. Create nodes using: workflow create:node <name> --template <template>`))
  console.log(chalk.yellow(`  2. Add nodes to src/nodes/ directory`))
  console.log(chalk.yellow(`  3. Update src/index.ts to export your nodes`))
  console.log(chalk.yellow(`  4. Update package.json workflow metadata with node types`))
}

/**
 * Generates plugin manifest file
 */
async function generatePluginManifest(
  pluginDir: string,
  pluginName: string,
  author: string,
  description: string,
): Promise<void> {
  const manifestContent = `import type { PluginManifest } from "workflow-engine"

/**
 * Plugin manifest for ${pluginName}
 */
export const manifest: PluginManifest = {
  name: "${pluginName}",
  version: "0.1.0",
  displayName: "${toTitleCase(pluginName)}",
  description: "${description}",
${author ? `  author: "${author}",` : ""}
  dependencies: [],
  nodeTypes: [],
}
`

  await fs.writeFile(path.join(pluginDir, "src", "manifest.ts"), manifestContent)
}

/**
 * Generates plugin index file
 */
async function generatePluginIndex(pluginDir: string): Promise<void> {
  const indexContent = `import type { Plugin } from "workflow-engine"
import { manifest } from "./manifest"

/**
 * Plugin entry point
 * Export all node types from this plugin
 */

// Import node types here
// Example:
// import { MyNode1 } from "./nodes/my-node-1"
// import { MyNode2 } from "./nodes/my-node-2"

/**
 * Plugin instance
 * This is the main export that will be loaded by the plugin system
 */
export const plugin: Plugin = {
  manifest,
  nodeTypes: [
    // Add your node classes here
    // Example:
    // MyNode1,
    // MyNode2,
  ],
  // Optional: Add initialization logic
  // initialize: async () => {
  //   // Plugin initialization code
  // },
  // Optional: Add cleanup logic
  // cleanup: async () => {
  //   // Plugin cleanup code
  // },
}
`

  await fs.writeFile(path.join(pluginDir, "src", "index.ts"), indexContent)
}

/**
 * Generates plugin package.json with workflow metadata
 */
async function generatePluginPackageJson(
  pluginDir: string,
  pluginName: string,
  author: string,
  description: string,
): Promise<void> {
  const packageName = pluginName.startsWith("@workflow/") ? pluginName : `@workflow/plugin-${pluginName}`

  const packageJson = {
    name: packageName,
    version: "0.1.0",
    description,
    main: "dist/index.js",
    types: "dist/index.d.ts",
    keywords: ["workflow", "workflow-plugin", pluginName],
    author: author || "",
    license: "MIT",
    workflow: {
      plugin: true,
      nodeTypes: [],
    },
    scripts: {
      build: "tsc",
      "build:watch": "tsc --watch",
      test: "jest",
      lint: "eslint src --ext .ts",
      "lint:fix": "eslint src --ext .ts --fix",
      typecheck: "tsc --noEmit",
    },
    dependencies: {
      "workflow-engine": "^0.1.0",
    },
    devDependencies: {
      "@types/node": "^20.11.24",
      "@typescript-eslint/eslint-plugin": "^6.21.0",
      "@typescript-eslint/parser": "^6.21.0",
      eslint: "^8.56.0",
      jest: "^29.7.0",
      "ts-jest": "^29.1.2",
      typescript: "^5.3.3",
    },
    engines: {
      node: ">=18.0.0",
    },
    files: ["dist", "src"],
  }

  await fs.writeFile(path.join(pluginDir, "package.json"), JSON.stringify(packageJson, null, 2) + "\n")

  // Generate tsconfig.json for the plugin
  await generatePluginTsConfig(pluginDir)
}

/**
 * Generates TypeScript configuration for the plugin
 */
async function generatePluginTsConfig(pluginDir: string): Promise<void> {
  const tsConfig = {
    extends: "../../tsconfig.json",
    compilerOptions: {
      outDir: "./dist",
      rootDir: "./src",
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist", "**/*.test.ts"],
  }

  await fs.writeFile(path.join(pluginDir, "tsconfig.json"), JSON.stringify(tsConfig, null, 2) + "\n")
}

/**
 * Generates plugin README.md
 */
async function generatePluginReadme(pluginDir: string, pluginName: string, description: string): Promise<void> {
  const readmeContent = `# ${toTitleCase(pluginName)}

${description}

## Installation

\`\`\`bash
npm install @workflow/plugin-${pluginName}
\`\`\`

## Usage

This plugin provides the following node types:

- TODO: List your node types here

## Development

\`\`\`bash
# Build the plugin
npm run build

# Run tests
npm test

# Lint code
npm run lint
\`\`\`

## License

MIT
`

  await fs.writeFile(path.join(pluginDir, "README.md"), readmeContent)
}

/**
 * Generates LICENSE file
 */
async function generateLicense(pluginDir: string, author: string): Promise<void> {
  const year = new Date().getFullYear()
  const copyright = author ? `Copyright (c) ${year} ${author}` : `Copyright (c) ${year}`

  const licenseContent = `MIT License

${copyright}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`

  await fs.writeFile(path.join(pluginDir, "LICENSE"), licenseContent)
}

/**
 * Converts kebab-case to Title Case
 */
function toTitleCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Registers the create plugin command
 */
export function registerCreatePluginCommand(program: Command): void {
  program
    .command("create:plugin <name>")
    .alias("cp")
    .description("Create a new plugin")
    .option("-o, --output <dir>", "Output directory", process.cwd())
    .option("-a, --author <author>", "Author name")
    .option("-d, --description <description>", "Plugin description")
    .action(async (name: string, options: CreatePluginOptions) => {
      try {
        await createPlugin(name, options)
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })
}

