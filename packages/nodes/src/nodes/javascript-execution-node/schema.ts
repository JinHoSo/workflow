import type { JsonSchema } from "@workflow/interfaces"

/**
 * JSON Schema for JavaScriptNode configuration
 */
export const javascriptNodeSchema: JsonSchema = {
  type: "object",
  properties: {
    code: {
      type: "string",
      description: "JavaScript code to execute",
    },
  },
  required: ["code"],
  additionalProperties: false,
}

