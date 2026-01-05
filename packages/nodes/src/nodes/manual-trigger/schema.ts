import type { JsonSchema } from "@workflow/interfaces"

/**
 * JSON Schema for ManualTrigger configuration
 */
export const manualTriggerSchema: JsonSchema = {
  type: "object",
  properties: {
    initialData: {
      description: "Initial data to pass to the workflow when triggered",
    },
  },
  additionalProperties: false,
}

