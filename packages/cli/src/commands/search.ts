/**
 * Search command
 * Searches for plugins in npm registry
 */

import { Command } from "commander"
import chalk from "chalk"
import npmFetch from "npm-registry-fetch"

/**
 * Options for search command
 */
interface SearchOptions {
  /** Search query */
  query?: string
  /** Category filter */
  category?: string
  /** Node type filter */
  nodeType?: string
  /** Limit results */
  limit?: number
}

/**
 * Plugin search result
 */
interface PluginSearchResult {
  name: string
  version: string
  description?: string
  keywords?: string[]
  author?: string
  workflow?: {
    plugin: boolean
    nodeTypes?: string[]
    category?: string
    tags?: string[]
  }
}

/**
 * Searches for plugins in npm registry
 * @param options - Search options
 */
export async function searchPlugins(options: SearchOptions = {}): Promise<void> {
  const query = options.query || ""
  const limit = options.limit || 20

  console.log(chalk.blue(`Searching for plugins${query ? `: ${query}` : ""}...`))

  try {
    // Search npm registry
    const searchParams = new URLSearchParams()
    searchParams.set("text", `keywords:workflow-plugin ${query}`)
    searchParams.set("size", String(limit))

    const response = await npmFetch.json("/-/v1/search", {
      query: searchParams,
    })

    const results = (response.objects as Array<{ package: PluginSearchResult }>).map(
      (obj) => obj.package,
    )

    // Filter by category if specified
    let filtered = results
    if (options.category) {
      filtered = filtered.filter(
        (pkg) => pkg.workflow?.category === options.category,
      )
    }

    // Filter by node type if specified
    if (options.nodeType) {
      filtered = filtered.filter((pkg) =>
        pkg.workflow?.nodeTypes?.includes(options.nodeType!),
      )
    }

    // Display results
    if (filtered.length === 0) {
      console.log(chalk.yellow("No plugins found"))
      return
    }

    console.log(chalk.green(`\nFound ${filtered.length} plugin(s):\n`))

    for (const pkg of filtered) {
      console.log(chalk.cyan(pkg.name))
      if (pkg.description) {
        console.log(`  ${pkg.description}`)
      }
      console.log(`  Version: ${pkg.version}`)
      if (pkg.workflow?.nodeTypes && pkg.workflow.nodeTypes.length > 0) {
        console.log(`  Node Types: ${pkg.workflow.nodeTypes.join(", ")}`)
      }
      if (pkg.workflow?.category) {
        console.log(`  Category: ${pkg.workflow.category}`)
      }
      if (pkg.workflow?.tags && pkg.workflow.tags.length > 0) {
        console.log(`  Tags: ${pkg.workflow.tags.join(", ")}`)
      }
      console.log("")
    }
  } catch (error) {
    console.error(
      chalk.red(`Error searching plugins: ${error instanceof Error ? error.message : String(error)}`),
    )
    throw error
  }
}

/**
 * Registers the search command
 */
export function registerSearchCommand(program: Command): void {
  program
    .command("search [query]")
    .description("Search for plugins in npm registry")
    .option("-c, --category <category>", "Filter by category")
    .option("-n, --node-type <type>", "Filter by node type")
    .option("-l, --limit <number>", "Limit results", "20")
    .action(async (query: string | undefined, options: SearchOptions) => {
      try {
        await searchPlugins({ ...options, query })
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })
}

