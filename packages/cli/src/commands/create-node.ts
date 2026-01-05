/**
 * Create node command
 * Generates a new node with template files
 */

import { Command } from "commander"
import * as fs from "fs-extra"
import * as path from "path"
import chalk from "chalk"

/**
 * Node template types
 */
export type NodeTemplate = "basic" | "http" | "trigger"

/**
 * Options for create node command
 */
interface CreateNodeOptions {
  template?: NodeTemplate
  output?: string
}

/**
 * Creates a new node with the specified template
 * @param nodeName - Name of the node to create
 * @param options - Command options
 */
export async function createNode(nodeName: string, options: CreateNodeOptions = {}): Promise<void> {
  const template = options.template || "basic"
  const outputDir = options.output || process.cwd()
  const nodeDir = path.join(outputDir, nodeName)

  // Validate node name
  if (!/^[a-z][a-z0-9-]*$/.test(nodeName)) {
    throw new Error(
      "Node name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens",
    )
  }

  // Check if directory already exists
  if (await fs.pathExists(nodeDir)) {
    throw new Error(`Directory ${nodeDir} already exists`)
  }

  console.log(chalk.blue(`Creating ${template} node: ${nodeName}...`))

  // Create directory structure
  await fs.ensureDir(nodeDir)

  // Generate files based on template
  switch (template) {
    case "basic":
      await generateBasicNode(nodeDir, nodeName)
      break
    case "http":
      await generateHttpNode(nodeDir, nodeName)
      break
    case "trigger":
      await generateTriggerNode(nodeDir, nodeName)
      break
    default:
      throw new Error(`Unknown template: ${template}`)
  }

  console.log(chalk.green(`✓ Node created successfully at ${nodeDir}`))
}

/**
 * Generates a basic node template
 */
async function generateBasicNode(nodeDir: string, nodeName: string): Promise<void> {
  const className = toPascalCase(nodeName)
  const nodeFileName = `${nodeName}.ts`

  // Generate node TypeScript file
  const nodeContent = `import { BaseNode } from "../../core/base-node"
import type { NodePropertiesInput, NodeConfiguration, NodeOutput } from "../../interfaces"
import type { ExecutionContext } from "../../interfaces/execution-state"
import { LinkType } from "../../types"
import { ${nodeName}Schema } from "./schema"

/**
 * Configuration interface for ${className} node
 */
export interface ${className}Configuration extends NodeConfiguration {
  // Add your configuration properties here
}

/**
 * ${className} node implementation
 * Extends BaseNode to provide custom node functionality
 */
export class ${className} extends BaseNode {
  /** Node type identifier for this class */
  static readonly nodeType = "${nodeName}"

  /**
   * Configuration schema for validation
   */
  protected configurationSchema = ${nodeName}Schema

  /**
   * Creates a new ${className} instance
   * @param properties - Node properties (nodeType will be automatically set)
   */
  constructor(properties: NodePropertiesInput) {
    super({
      ...properties,
      nodeType: ${className}.nodeType,
    })

    // Define input ports
    this.addInput("input", "any", LinkType.Standard)

    // Define output ports
    this.addOutput("output", "any", LinkType.Standard)
  }

  /**
   * Processes the node execution
   * @param context - Execution context
   * @returns Output data
   */
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const config = this.config as ${className}Configuration

    // Get input data
    const inputData = context.inputData["input"] || []

    // Process the data
    // TODO: Implement your node logic here

    // Return output data
    return {
      output: inputData,
    }
  }
}
`

  await fs.writeFile(path.join(nodeDir, nodeFileName), nodeContent)

  // Generate schema file
  await generateSchemaFile(nodeDir, nodeName)

  // Generate index file
  await generateIndexFile(nodeDir, nodeName, className)

  // Generate test file
  await generateTestFile(nodeDir, nodeName, className)

  // Generate package.json
  await generatePackageJson(nodeDir, nodeName)
}

/**
 * Generates an HTTP node template
 */
async function generateHttpNode(nodeDir: string, nodeName: string): Promise<void> {
  const className = toPascalCase(nodeName)
  const nodeFileName = `${nodeName}.ts`

  const nodeContent = `import { BaseNode } from "../../core/base-node"
import type { NodePropertiesInput, NodeConfiguration, NodeOutput, DataRecord } from "../../interfaces"
import type { ExecutionContext } from "../../interfaces/execution-state"
import { LinkType } from "../../types"
import { ${nodeName}Schema } from "./schema"

/**
 * HTTP methods supported by the node
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

/**
 * Configuration interface for ${className} node
 */
export interface ${className}Configuration extends NodeConfiguration {
  /** HTTP method to use */
  method?: HttpMethod
  /** Base URL for the request */
  url?: string
  /** Custom headers */
  headers?: Record<string, string>
  /** Request body */
  body?: string | DataRecord
}

/**
 * ${className} node implementation
 * Extends BaseNode to provide HTTP request functionality
 */
export class ${className} extends BaseNode {
  /** Node type identifier for this class */
  static readonly nodeType = "${nodeName}"

  /**
   * Configuration schema for validation
   */
  protected configurationSchema = ${nodeName}Schema

  /**
   * Creates a new ${className} instance
   * @param properties - Node properties (nodeType will be automatically set)
   */
  constructor(properties: NodePropertiesInput) {
    super({
      ...properties,
      nodeType: ${className}.nodeType,
    })

    // Define input ports
    this.addInput("input", "any", LinkType.Standard)

    // Define output ports
    this.addOutput("output", "any", LinkType.Standard)
    this.addOutput("error", "any", LinkType.Standard)
  }

  /**
   * Processes the node execution
   * @param context - Execution context
   * @returns Output data
   */
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const config = this.config as ${className}Configuration

    // Get input data
    const inputData = context.inputData["input"] || []

    // TODO: Implement HTTP request logic
    // Example:
    // const response = await fetch(config.url, {
    //   method: config.method || "GET",
    //   headers: config.headers,
    //   body: config.body ? JSON.stringify(config.body) : undefined,
    // })

    // Return output data
    return {
      output: inputData,
    }
  }
}
`

  await fs.writeFile(path.join(nodeDir, nodeFileName), nodeContent)

  // Generate HTTP-specific schema
  await generateHttpSchemaFile(nodeDir, nodeName)

  // Generate index file
  await generateIndexFile(nodeDir, nodeName, className)

  // Generate test file
  await generateTestFile(nodeDir, nodeName, className)

  // Generate package.json
  await generatePackageJson(nodeDir, nodeName)
}

/**
 * Generates a trigger node template
 */
async function generateTriggerNode(nodeDir: string, nodeName: string): Promise<void> {
  const className = toPascalCase(nodeName)
  const nodeFileName = `${nodeName}.ts`

  const nodeContent = `import { TriggerNodeBase } from "../../core/base-trigger"
import type { NodePropertiesInput, NodeConfiguration, NodeOutput } from "../../interfaces"
import type { ExecutionContext } from "../../interfaces/execution-state"
import { LinkType } from "../../types"
import { ${nodeName}Schema } from "./schema"

/**
 * Configuration interface for ${className} node
 */
export interface ${className}Configuration extends NodeConfiguration {
  // Add your trigger configuration properties here
}

/**
 * ${className} trigger node implementation
 * Extends TriggerNodeBase to provide trigger functionality
 */
export class ${className} extends TriggerNodeBase {
  /** Node type identifier for this class */
  static readonly nodeType = "${nodeName}"

  /**
   * Configuration schema for validation
   */
  protected configurationSchema = ${nodeName}Schema

  /**
   * Creates a new ${className} instance
   * @param properties - Node properties (nodeType will be automatically set)
   */
  constructor(properties: NodePropertiesInput) {
    super({
      ...properties,
      nodeType: ${className}.nodeType,
      isTrigger: true,
    })

    // Define output ports
    this.addOutput("output", "any", LinkType.Standard)
  }

  /**
   * Processes the node execution
   * @param context - Execution context
   * @returns Output data
   */
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const config = this.config as ${className}Configuration

    // TODO: Implement trigger logic
    // For triggers, this method is called when the trigger is activated

    // Return output data
    return {
      output: [],
    }
  }
}
`

  await fs.writeFile(path.join(nodeDir, nodeFileName), nodeContent)

  // Generate schema file
  await generateSchemaFile(nodeDir, nodeName)

  // Generate index file
  await generateIndexFile(nodeDir, nodeName, className)

  // Generate test file
  await generateTestFile(nodeDir, nodeName, className)

  // Generate package.json
  await generatePackageJson(nodeDir, nodeName)
}

/**
 * Generates a schema file
 */
async function generateSchemaFile(nodeDir: string, nodeName: string): Promise<void> {
  const schemaContent = `import type { JsonSchema } from "../../schemas/schema-validator"

/**
 * JSON Schema for ${toPascalCase(nodeName)} configuration
 */
export const ${nodeName}Schema: JsonSchema = {
  type: "object",
  properties: {
    // Add your configuration properties here
  },
  additionalProperties: false,
}
`

  await fs.writeFile(path.join(nodeDir, "schema.ts"), schemaContent)
}

/**
 * Generates an HTTP-specific schema file
 */
async function generateHttpSchemaFile(nodeDir: string, nodeName: string): Promise<void> {
  const schemaContent = `import type { JsonSchema } from "../../schemas/schema-validator"

/**
 * JSON Schema for ${toPascalCase(nodeName)} configuration
 */
export const ${nodeName}Schema: JsonSchema = {
  type: "object",
  properties: {
    method: {
      type: "string",
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      description: "HTTP method to use",
    },
    url: {
      type: "string",
      format: "uri",
      description: "Base URL for the request",
    },
    headers: {
      type: "object",
      additionalProperties: {
        type: "string",
      },
      description: "Custom headers",
    },
    body: {
      description: "Request body",
    },
  },
  additionalProperties: false,
}
`

  await fs.writeFile(path.join(nodeDir, "schema.ts"), schemaContent)
}

/**
 * Generates an index file
 */
async function generateIndexFile(nodeDir: string, nodeName: string, className: string): Promise<void> {
  const indexContent = `/**
 * ${toPascalCase(nodeName)} node exports
 */

export { ${className} } from "./${nodeName}"
export { ${nodeName}Schema } from "./schema"
export type { ${className}Configuration } from "./${nodeName}"
`

  await fs.writeFile(path.join(nodeDir, "index.ts"), indexContent)
}

/**
 * Generates a test file
 */
async function generateTestFile(nodeDir: string, nodeName: string, className: string): Promise<void> {
  const testContent = `import { ${className} } from "./${nodeName}"
import type { NodeProperties } from "../../interfaces"

describe("${className}", () => {
  let node: ${className}
  const properties: NodeProperties = {
    id: "test-node-1",
    name: "${nodeName}",
    type: "${nodeName}",
    version: 1,
  }

  beforeEach(() => {
    node = new ${className}(properties)
  })

  it("should create node instance", () => {
    expect(node).toBeInstanceOf(${className})
    expect(node.properties.name).toBe("${nodeName}")
  })

  it("should have correct input ports", () => {
    expect(node.inputs.length).toBeGreaterThan(0)
  })

  it("should have correct output ports", () => {
    expect(node.outputs.length).toBeGreaterThan(0)
  })

  // TODO: Add more tests
})
`

  await fs.writeFile(path.join(nodeDir, `${nodeName}.test.ts`), testContent)
}

/**
 * Generates a package.json file for the node
 */
async function generatePackageJson(nodeDir: string, nodeName: string): Promise<void> {
  const packageJson = {
    name: `@workflow/node-${nodeName}`,
    version: "0.1.0",
    description: `Workflow node: ${nodeName}`,
    main: "index.ts",
    types: "index.ts",
    keywords: ["workflow", "node", nodeName],
    author: "",
    license: "MIT",
  }

  await fs.writeFile(path.join(nodeDir, "package.json"), JSON.stringify(packageJson, null, 2) + "\n")
}

/**
 * Converts kebab-case to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
}

/**
 * Registers the create node command
 */
export function registerCreateNodeCommand(program: Command): void {
  program
    .command("create:node <name>")
    .alias("cn")
    .description("Create a new node")
    .option("-t, --template <template>", "Node template (basic, http, trigger)", "basic")
    .option("-o, --output <dir>", "Output directory", process.cwd())
    .action(async (name: string, options: CreateNodeOptions) => {
      try {
        await createNode(name, options)
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`))
        process.exit(1)
      }
    })
}

