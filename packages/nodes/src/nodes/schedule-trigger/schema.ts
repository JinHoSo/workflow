import type { JsonSchema } from "@workflow/schemas"

/**
 * JSON Schema for ScheduleTrigger configuration
 */
export const scheduleTriggerSchema: JsonSchema = {
  type: "object",
  properties: {
    schedule: {
      oneOf: [
        {
          type: "object",
          properties: {
            type: { type: "string", const: "minute" },
            second: { type: "number", minimum: 0, maximum: 59 },
          },
          required: ["type", "second"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            type: { type: "string", const: "hour" },
            minute: { type: "number", minimum: 0, maximum: 59 },
            second: { type: "number", minimum: 0, maximum: 59 },
          },
          required: ["type", "minute", "second"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            type: { type: "string", const: "day" },
            hour: { type: "number", minimum: 0, maximum: 23 },
            minute: { type: "number", minimum: 0, maximum: 59 },
            second: { type: "number", minimum: 0, maximum: 59 },
          },
          required: ["type", "hour", "minute", "second"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            type: { type: "string", const: "month" },
            day: { type: "number", minimum: 1, maximum: 31 },
            hour: { type: "number", minimum: 0, maximum: 23 },
            minute: { type: "number", minimum: 0, maximum: 59 },
            second: { type: "number", minimum: 0, maximum: 59 },
          },
          required: ["type", "day", "hour", "minute", "second"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            type: { type: "string", const: "year" },
            month: { type: "number", minimum: 1, maximum: 12 },
            day: { type: "number", minimum: 1, maximum: 31 },
            hour: { type: "number", minimum: 0, maximum: 23 },
            minute: { type: "number", minimum: 0, maximum: 59 },
            second: { type: "number", minimum: 0, maximum: 59 },
          },
          required: ["type", "month", "day", "hour", "minute", "second"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            type: { type: "string", const: "interval" },
            intervalMs: { type: "number", minimum: 1 },
          },
          required: ["type", "intervalMs"],
          additionalProperties: false,
        },
      ],
      description: "Schedule configuration",
    },
  },
  required: ["schedule"],
  additionalProperties: false,
}

