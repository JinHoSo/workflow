import { BaseNode } from "@workflow/core"
import type { NodePropertiesInput, NodeConfiguration, DataRecord, NodeInput, NodeOutput, ExecutionContext } from "@workflow/interfaces"
import { LinkType } from "@workflow/interfaces"
import { javascriptNodeSchema } from "./schema"

/**
 * Node that executes user-provided JavaScript code
 * Uses a function-based API for better clarity and type safety
 *
 * API:
 * - input(index): Get input data item by index (default: 0)
 * - inputAll(): Get all input data from all ports
 * - output(data): Set output data (can be called multiple times to add items)
 * - return value: If code returns a value, it's automatically set as output
 */
export class JavaScriptNode extends BaseNode {
  /** Node type identifier for this class */
  static readonly nodeType = "javascript"

  /**
   * Creates a new JavaScriptNode
   * @param properties - Node properties (nodeType will be automatically set)
   */
  constructor(properties: NodePropertiesInput) {
    // Automatically set nodeType from class definition, overriding any user-provided value
    super({
      ...properties,
      nodeType: JavaScriptNode.nodeType,
    })
    this.configurationSchema = javascriptNodeSchema
    this.addInput("input", "data", LinkType.Standard)
    this.addOutput("output", "data", LinkType.Standard)
  }

  /**
   * Configures the node with JavaScript code
   * Validates code syntax before storing
   * @param config - Configuration containing the code string
   * @throws Error if code is missing or invalid
   */
  setup(config: NodeConfiguration): void {
    if (config.code && typeof config.code === "string") {
      this.validateCode(config.code)
      this.config.code = config.code
      super.setup(config)
    } else {
      throw new Error("JavaScript code is required")
    }
  }

  /**
   * Executes the configured JavaScript code
   * Supports both sync and async JavaScript code execution
   * @param context - Execution context containing input data and state
   * @returns Promise that resolves to output data from JavaScript execution (port name based)
   * @throws Error if code execution fails
   */
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    const code = this.config.code as string
    if (!code) {
      throw new Error("JavaScript code not configured")
    }

    try {
      const api = this.createExecutionAPI(context)
      const result = await this.executeCode(code, api)
      return this.formatResult(result, api.outputItems)
    } catch (error) {
      throw new Error(`JavaScript execution failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Validates the configuration
   * @param config - Configuration to validate
   * @returns true if configuration is valid
   */
  protected validateConfig(config: NodeConfiguration): boolean {
    if (!config.code || typeof config.code !== "string") {
      return false
    }
    return this.validateCode(config.code as string)
  }

  /**
   * Validates JavaScript code syntax
   * Supports both sync and async code (including await)
   * Always validates as async function to support await syntax
   * @param code - JavaScript code to validate
   * @returns true if syntax is valid
   * @throws Error if syntax is invalid
   */
  private validateCode(code: string): boolean {
    try {
      // Always validate as async function to support both sync and async code
      new Function("return async function() { " + code + " }")
      return true
    } catch (error) {
      throw new Error(`Invalid JavaScript syntax: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Creates execution API with function-based interface
   * @param context - Execution context containing input data and state
   * @returns Execution API object with input, inputAll, state, and output functions
   */
  private createExecutionAPI(context: ExecutionContext): {
    input: (portName?: string, index?: number) => DataRecord
    inputAll: () => NodeInput
    state: (nodeName?: string) => NodeOutput | DataRecord | DataRecord[]
    output: (data: DataRecord, portName?: string) => void
    outputItems: Record<string, DataRecord[]>
  } {
    // Get default input port (first input port)
    const defaultInputPort = this.inputs[0]?.name || "input"
    const defaultOutputPort = this.outputs[0]?.name || "output"
    const outputItems: Record<string, DataRecord[]> = { [defaultOutputPort]: [] }

    // Helper to normalize input data (single item or array)
    const normalizeInput = (portName: string): DataRecord[] => {
      const portData = context.input[portName]
      if (portData === undefined) {
        return []
      }
      return Array.isArray(portData) ? portData : [portData]
    }

    return {
      // Get input data item by port name and index (default: first port, first item)
      input: (portName: string = defaultInputPort, index: number = 0): DataRecord => {
        const portData = normalizeInput(portName)
        if (index < 0 || index >= portData.length) {
          throw new Error(
            `Input index ${index} is out of range for port "${portName}". Available items: ${portData.length}`,
          )
        }
        return portData[index]
      },
      // Get all input data from all ports (port name based)
      inputAll: (): NodeInput => {
        return { ...context.input }
      },
      // Get state from any previous node
      // state() - returns all state
      // state("node1") - returns node1's output
      // state("node1", "output") - returns node1's output port data
      state: (nodeName?: string, portName?: string): NodeOutput | DataRecord | DataRecord[] => {
        if (!nodeName) {
          // Return entire state
          return context.state
        }
        const nodeOutput = context.state[nodeName]
        if (nodeOutput === undefined) {
          throw new Error(`Node "${nodeName}" not found in execution state`)
        }
        if (portName) {
          // Return specific port data
          const portData = nodeOutput[portName]
          if (portData === undefined) {
            throw new Error(`Port "${portName}" not found in node "${nodeName}" output`)
          }
          return portData
        }
        // Return entire node output
        return nodeOutput
      },
      // Add output data item to specified port (default: first output port)
      output: (data: DataRecord, portName: string = defaultOutputPort): void => {
        if (!outputItems[portName]) {
          outputItems[portName] = []
        }
        outputItems[portName].push(data)
      },
      outputItems,
    }
  }

  /**
   * Executes JavaScript code with the provided API
   * Supports both sync and async code execution
   * @param code - JavaScript code to execute
   * @param api - Execution API (input, inputAll, state, output functions)
   * @returns Promise that resolves to return value from code execution, or undefined if no return
   */
  private async executeCode(
    code: string,
    api: {
      input: (portName?: string, index?: number) => DataRecord
      inputAll: () => NodeInput
      state: (nodeName?: string, portName?: string) => NodeOutput | DataRecord | DataRecord[]
      output: (data: DataRecord, portName?: string) => void
    },
  ): Promise<unknown> {
    const { input, inputAll, state, output } = api

    // Wrap code to capture return value (supports both sync and async)
    // If code returns a Promise, it will be properly awaited
    const wrappedCode = `
      return (async function() {
        ${code}
      })();
    `

    try {
      // Bind console to global scope so JavaScript code can use console.log
      const func = new Function(
        "input",
        "inputAll",
        "state",
        "output",
        "console",
        `
        ${wrappedCode}
      `,
      )
      const returnValue = await func(input, inputAll, state, output, console)

      // If code returns a value, use it as output
      // Otherwise, use the items collected via output() calls
      return returnValue
    } catch (error) {
      throw new Error(`Code execution error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Formats JavaScript execution result into NodeOutput format
   * Handles both return values and output() calls
   * @param returnValue - Return value from code execution
   * @param outputItems - Items collected via output() calls (port name based)
   * @returns Formatted output data (port name based)
   */
  private formatResult(returnValue: unknown, outputItems: Record<string, DataRecord[]>): NodeOutput {
    const convertToRecord = (val: unknown): DataRecord => {
      if (val === null || val === undefined) {
        return { value: val }
      }
      if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
        return { value: val }
      }
      if (Array.isArray(val)) {
        return { value: val.map(convertToRecord) }
      }
      if (typeof val === "object") {
        const obj = val as Record<string, unknown>
        const record: DataRecord = {}
        for (const key in obj) {
          const item = obj[key]
          if (
            typeof item === "string" ||
            typeof item === "number" ||
            typeof item === "boolean" ||
            item === null ||
            item === undefined
          ) {
            record[key] = item
          } else if (Array.isArray(item)) {
            record[key] = item.map(convertToRecord)
          } else if (typeof item === "object") {
            record[key] = convertToRecord(item)
          }
        }
        return record
      }
      return { value: String(val) }
    }

    // If output() was called, use those items (port name based)
    const hasOutputItems = Object.keys(outputItems).some((portName) => outputItems[portName].length > 0)
    if (hasOutputItems) {
      const result: NodeOutput = {}
      for (const portName in outputItems) {
        const items = outputItems[portName]
        if (items.length > 0) {
          // Single item: return as object, multiple items: return as array
          result[portName] = items.length === 1 ? items[0] : items
        }
      }
      return result
    }

    // Otherwise, use return value (default to first output port)
    const defaultOutputPort = this.outputs[0]?.name || "output"
    if (returnValue !== undefined) {
      const converted = convertToRecord(returnValue)
      return { [defaultOutputPort]: converted }
    }

    // No output, return empty
    return { [defaultOutputPort]: {} }
  }
}

