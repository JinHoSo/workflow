import Ajv, { type ValidateFunction, type ErrorObject } from "ajv"
import addFormats from "ajv-formats"
import type { JsonSchema } from "@workflow/interfaces"

/**
 * Re-export JsonSchema from interfaces for convenience
 */
export type { JsonSchema }

/**
 * Schema validation result
 */
export interface SchemaValidationResult {
  /** Whether the data is valid */
  valid: boolean
  /** Validation errors (empty if valid) */
  errors: ErrorObject[]
  /** Formatted error message */
  errorMessage?: string
}

/**
 * Schema validator using AJV (Another JSON Schema Validator)
 * Provides JSON Schema validation with format support
 */
export class SchemaValidator {
  private ajv: InstanceType<typeof Ajv>
  private compiledSchemas: Map<string, ValidateFunction> = new Map()

  /**
   * Creates a new SchemaValidator instance
   */
  constructor() {
    this.ajv = new Ajv({ allErrors: true })
    addFormats(this.ajv)
  }

  /**
   * Validates data against a JSON Schema
   * @param schema - JSON Schema to validate against
   * @param data - Data to validate
   * @returns Validation result with errors if invalid
   */
  validate(schema: JsonSchema, data: unknown): SchemaValidationResult {
    try {
      // Get or compile schema
      const schemaKey = JSON.stringify(schema)
      let validate = this.compiledSchemas.get(schemaKey)

      if (!validate) {
        const compiled = this.ajv.compile(schema)
        if (!compiled) {
          throw new Error("Failed to compile schema")
        }
        validate = compiled
        this.compiledSchemas.set(schemaKey, validate)
      }

      // Validate data
      const valid = validate(data)

      if (valid) {
        return {
          valid: true,
          errors: [],
        }
      }

      // Format errors
      const errors = validate.errors || []
      const errorMessage = this.formatErrors(errors)

      return {
        valid: false,
        errors,
        errorMessage,
      }
    } catch (error) {
      return {
        valid: false,
        errors: [],
        errorMessage: `Schema validation error: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Formats validation errors into a readable message
   * @param errors - Array of validation errors
   * @returns Formatted error message
   */
  private formatErrors(errors: ErrorObject[]): string {
    if (errors.length === 0) {
      return "Validation failed"
    }

    const errorMessages = errors.map((error) => {
      const path = (error as { instancePath?: string; dataPath?: string; schemaPath?: string }).instancePath ||
        (error as { dataPath?: string }).dataPath ||
        error.schemaPath ||
        "root"
      const message = error.message || "Validation error"
      return `${path}: ${message}`
    })

    return errorMessages.join("; ")
  }

  /**
   * Clears the compiled schema cache
   * Useful when schemas are updated
   */
  clearCache(): void {
    this.compiledSchemas.clear()
  }
}

/**
 * Global schema validator instance
 */
export const schemaValidator = new SchemaValidator()

