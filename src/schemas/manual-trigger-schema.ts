import type { JsonSchema } from "./schema-validator"

/**
 * JSON Schema for ManualTrigger configuration
 */
export const manualTriggerSchema: JsonSchema = {
  type: "object",
  properties: {
    initialData: {
      description: "Optional initial data to pass to the workflow",
    },
  },
  additionalProperties: false,
}

