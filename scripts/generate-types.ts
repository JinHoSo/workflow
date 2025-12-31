#!/usr/bin/env node
/**
 * TypeScript Type Generator Script
 *
 * Generates TypeScript types from JSON schemas
 * Usage: yarn generate-types [output-file]
 */

import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { generateTypeScriptTypes } from "../src/schemas/schema-to-types"
import type { JsonSchema } from "../src/schemas/schema-validator"

// Example schemas from node types
const exampleSchemas: Record<string, JsonSchema> = {
  JavaScriptNodeConfig: {
    type: "object",
    properties: {
      code: {
        type: "string",
        description: "JavaScript code to execute",
      },
    },
    required: ["code"],
  },
  HttpRequestNodeConfig: {
    type: "object",
    properties: {
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        description: "HTTP method",
      },
      url: {
        type: "string",
        description: "Request URL",
      },
      headers: {
        type: "object",
        properties: {},
        description: "HTTP headers",
      },
      body: {
        type: "string",
        description: "Request body",
      },
      timeout: {
        type: "number",
        minimum: 0,
        description: "Request timeout in milliseconds",
      },
    },
    required: ["method", "url"],
  },
  ScheduleTriggerConfig: {
    type: "object",
    properties: {
      schedule: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["minute", "hour", "day", "week", "month"],
          },
          second: {
            type: "number",
            minimum: 0,
            maximum: 59,
          },
          minute: {
            type: "number",
            minimum: 0,
            maximum: 59,
          },
          hour: {
            type: "number",
            minimum: 0,
            maximum: 23,
          },
        },
        required: ["type"],
      },
    },
    required: ["schedule"],
  },
}

function main() {
  const outputFile = process.argv[2] || join(__dirname, "../src/types/generated-config-types.ts")

  console.log("Generating TypeScript types from schemas...")
  console.log(`Output file: ${outputFile}`)

  const typeDefinitions = generateTypeScriptTypes(exampleSchemas)

  writeFileSync(outputFile, typeDefinitions, "utf-8")

  console.log("✓ TypeScript types generated successfully!")
  console.log(`  Generated ${Object.keys(exampleSchemas).length} type definitions`)
}

if (require.main === module) {
  main()
}

export { main }

