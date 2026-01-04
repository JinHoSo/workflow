/**
 * Validate command
 * Validates nodes and plugins for protocol compliance
 */

import { Command } from "commander"
import chalk from "chalk"
import * as fs from "fs-extra"
import * as path from "path"
import {
  protocolValidator,
  type ProtocolComplianceResult,
  type ProtocolComplianceIssue,
} from "@workflow/protocols"
import { executionProtocol } from "@workflow/protocols"
import { dataFlowProtocol } from "@workflow/protocols"
import { errorHandlingProtocol } from "@workflow/protocols"
import type { Node } from "@workflow/interfaces"
// import { BaseNode } from "@workflow/core" // Unused import removed

/**
 * Options for validate command
 */
interface ValidateOptions {
  /** Output format */
  format?: "text" | "json"
  /** Fix suggestions */
  suggest?: boolean
  /** Only show errors */
  errorsOnly?: boolean
}

/**
 * Validates a node or plugin for protocol compliance
 * @param options - Validation options
 */
export async function validate(options: ValidateOptions = {}): Promise<void> {
  const cwd = process.cwd()

  // Try to find nodes to validate
  const nodes = await findNodesToValidate(cwd)

  if (nodes.length === 0) {
    console.log(chalk.yellow("No nodes found to validate"))
    return
  }

  console.log(chalk.blue(`Validating ${nodes.length} node(s)...`))

  const results: Array<{ node: Node; result: ProtocolComplianceResult }> = []

  for (const node of nodes) {
    const result = protocolValidator.validateAllProtocols(
      node,
      executionProtocol,
      dataFlowProtocol,
      errorHandlingProtocol,
    )
    results.push({ node, result })
  }

  // Report results
  if (options.format === "json") {
    reportJson(results, options)
  } else {
    reportText(results, options)
  }

  // Exit with error code if any issues found
  const hasErrors = results.some((r) => !r.result.compliant)
  if (hasErrors) {
    process.exit(1)
  }
}

/**
 * Finds nodes to validate in the current directory
 */
async function findNodesToValidate(cwd: string): Promise<Node[]> {
  const nodes: Node[] = []

  // Check if we're in a node directory
  const nodeFiles = await findNodeFiles(cwd)

  for (const nodeFile of nodeFiles) {
    try {
      // Try to load and instantiate the node
      // This is a simplified version - in practice, you'd need proper module loading
      const node = await loadNodeFromFile(nodeFile)
      if (node) {
        nodes.push(node)
      }
    } catch (error) {
      console.warn(chalk.yellow(`Failed to load node from ${nodeFile}: ${error instanceof Error ? error.message : String(error)}`))
    }
  }

  return nodes
}

/**
 * Finds node files in directory
 */
async function findNodeFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  if (!(await fs.pathExists(dir))) {
    return files
  }

  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      const filePath = path.join(dir, entry.name)
      const content = await fs.readFile(filePath, "utf-8")
      // Check if file contains a node class
      if (content.includes("extends BaseNode") || content.includes("extends TriggerNodeBase")) {
        files.push(filePath)
      }
    } else if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
      const subFiles = await findNodeFiles(path.join(dir, entry.name))
      files.push(...subFiles)
    }
  }

  return files
}

/**
 * Loads a node from a file (simplified - would need proper TypeScript compilation in practice)
 */
async function loadNodeFromFile(_filePath: string): Promise<Node | null> {
  // In a real implementation, this would:
  // 1. Compile TypeScript if needed
  // 2. Load the module
  // 3. Find the node class
  // 4. Instantiate it
  // For now, return null as this requires a more complex setup
  return null
}

/**
 * Reports validation results in text format
 */
function reportText(
  results: Array<{ node: Node; result: ProtocolComplianceResult }>,
  options: ValidateOptions,
): void {
  let totalErrors = 0
  let totalWarnings = 0

  for (const { node, result } of results) {
    const nodeName = node.properties.name
    const errors = result.issues.filter((i) => i.severity === "error")
    const warnings = result.issues.filter((i) => i.severity === "warning")

    if (options.errorsOnly && errors.length === 0) {
      continue
    }

    totalErrors += errors.length
    totalWarnings += warnings.length

    if (result.compliant && !options.errorsOnly) {
      console.log(chalk.green(`✓ ${nodeName}: Compliant`))
    } else if (!result.compliant) {
      console.log(chalk.red(`✗ ${nodeName}: Not Compliant`))
    }

    // Report errors
    for (const issue of errors) {
      console.log(chalk.red(`  [${issue.protocol.toUpperCase()}] ${issue.message}`))
      if (options.suggest) {
        const suggestion = getFixSuggestion(issue)
        if (suggestion) {
          console.log(chalk.yellow(`    Suggestion: ${suggestion}`))
        }
      }
    }

    // Report warnings
    if (!options.errorsOnly) {
      for (const issue of warnings) {
        console.log(chalk.yellow(`  [${issue.protocol.toUpperCase()}] ${issue.message}`))
        if (options.suggest) {
          const suggestion = getFixSuggestion(issue)
          if (suggestion) {
            console.log(chalk.yellow(`    Suggestion: ${suggestion}`))
          }
        }
      }
    }
  }

  console.log("\n" + chalk.blue("Summary:"))
  console.log(`  Errors: ${totalErrors}`)
  if (!options.errorsOnly) {
    console.log(`  Warnings: ${totalWarnings}`)
  }
}

/**
 * Reports validation results in JSON format
 */
function reportJson(
  results: Array<{ node: Node; result: ProtocolComplianceResult }>,
  options: ValidateOptions,
): void {
  const output = results.map(({ node, result }) => ({
    node: {
      name: node.properties.name,
      type: node.properties.nodeType,
      version: node.properties.version,
    },
    compliant: result.compliant,
    issues: options.errorsOnly
      ? result.issues.filter((i) => i.severity === "error")
      : result.issues,
  }))

  console.log(JSON.stringify(output, null, 2))
}

/**
 * Gets fix suggestion for an issue
 */
function getFixSuggestion(issue: ProtocolComplianceIssue): string | null {
  if (issue.protocol === "execution") {
    if (issue.message.includes("not a BaseNode instance")) {
      return "Ensure your node class extends BaseNode"
    }
    if (issue.message.includes("not in Idle state")) {
      return "Reset the node state before execution: node.reset()"
    }
    if (issue.message.includes("does not have a run() method")) {
      return "BaseNode provides run() method automatically. Check your class extends BaseNode correctly"
    }
  }

  if (issue.protocol === "data-flow") {
    if (issue.message.includes("no output ports")) {
      return "Add output ports in constructor: this.addOutput('output', 'any')"
    }
    if (issue.message.includes("invalid dataType")) {
      return "Ensure port dataType is a string: this.addInput('input', 'any')"
    }
  }

  if (issue.protocol === "error-handling") {
    if (issue.message.includes("does not have an error property")) {
      return "BaseNode provides error property automatically. Extend BaseNode"
    }
    if (issue.message.includes("does not have continueOnFail")) {
      return "Add continueOnFail to node properties (optional but recommended)"
    }
  }

  return null
}

/**
 * Registers the validate command
 */
export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Validate nodes and plugins for protocol compliance")
    .option("-f, --format <format>", "Output format (text, json)", "text")
    .option("-s, --suggest", "Show fix suggestions")
    .option("-e, --errors-only", "Only show errors")
    .action(async (options: ValidateOptions) => {
      try {
        await validate(options)
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })
}

