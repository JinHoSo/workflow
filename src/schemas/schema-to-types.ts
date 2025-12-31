/**
 * Schema to TypeScript Type Generator
 *
 * Generates TypeScript type definitions from JSON Schema
 * This is an optional tooling utility for development
 */

import type { JsonSchema } from "./schema-validator"

/**
 * Generates TypeScript type definition from JSON Schema
 * @param schema - JSON Schema to convert
 * @param interfaceName - Name for the generated interface
 * @returns TypeScript type definition string
 */
export function generateTypeScriptType(schema: JsonSchema, interfaceName: string): string {
  if (!schema || typeof schema !== "object") {
    return `export type ${interfaceName} = any\n`
  }

  const type = schema.type as string | string[] | undefined

  if (!type) {
    return `export type ${interfaceName} = unknown\n`
  }

  if (typeof type === "string") {
    if (type === "object") {
      return generateObjectType(schema, interfaceName)
    } else if (type === "array") {
      return generateArrayType(schema, interfaceName)
    } else {
      return generatePrimitiveType(schema, interfaceName)
    }
  } else {
    // Union type - use first type or string
    const firstType = type[0] || "string"
    return generatePrimitiveType({ ...schema, type: firstType }, interfaceName)
  }
}

/**
 * Generates TypeScript interface for object schema
 */
function generateObjectType(schema: JsonSchema, interfaceName: string): string {
  const properties = schema.properties as Record<string, JsonSchema> | undefined
  const required = (schema.required as string[]) || []

  if (!properties || Object.keys(properties).length === 0) {
    return `export interface ${interfaceName} {\n  [key: string]: unknown\n}\n`
  }

  const lines: string[] = [`export interface ${interfaceName} {`]

  for (const [key, propSchema] of Object.entries(properties)) {
    const isRequired = required.includes(key)
    const optional = isRequired ? "" : "?"
    const propType = schemaToTypeScript(propSchema, `${interfaceName}${capitalize(key)}`)
    const description = propSchema.description ? ` // ${propSchema.description}` : ""

    lines.push(`  ${key}${optional}: ${propType}${description}`)
  }

  lines.push("}")

  // Generate nested types
  const nestedTypes: string[] = []
  for (const [key, propSchema] of Object.entries(properties)) {
    if (propSchema.type === "object" && propSchema.properties) {
      const nestedType = generateObjectType(propSchema, `${interfaceName}${capitalize(key)}`)
      nestedTypes.push(nestedType)
    } else if (propSchema.type === "array" && propSchema.items) {
      const items = propSchema.items as JsonSchema
      if (items.type === "object" && items.properties) {
        const nestedType = generateObjectType(items, `${interfaceName}${capitalize(key)}Item`)
        nestedTypes.push(nestedType)
      }
    }
  }

  return [...nestedTypes, ...lines].join("\n") + "\n"
}

/**
 * Generates TypeScript type for array schema
 */
function generateArrayType(schema: JsonSchema, interfaceName: string): string {
  const items = schema.items as JsonSchema | undefined

  if (!items) {
    return `export type ${interfaceName} = unknown[]\n`
  }

  // If items is an object, generate a separate interface
  const itemsType = items.type as string | string[] | undefined
  let nestedType = ""
  let itemTypeName = `${interfaceName}Item`

  if (typeof itemsType === "string" && itemsType === "object" && items.properties) {
    nestedType = generateObjectType(items, itemTypeName)
    itemTypeName = itemTypeName
  } else {
    itemTypeName = schemaToTypeScript(items, itemTypeName)
  }

  const arrayType = `export type ${interfaceName} = ${itemTypeName}[]\n`

  return nestedType ? nestedType + "\n" + arrayType : arrayType
}

/**
 * Generates TypeScript type for primitive schema
 */
function generatePrimitiveType(schema: JsonSchema, interfaceName: string): string {
  const type = schema.type as string | undefined

  if (!type) {
    return `export type ${interfaceName} = unknown\n`
  }

  const tsType = mapJsonSchemaTypeToTypeScript(type, schema)
  return `export type ${interfaceName} = ${tsType}\n`
}

/**
 * Converts JSON Schema to TypeScript type string
 */
function schemaToTypeScript(schema: JsonSchema, fallbackName: string): string {
  if (!schema || typeof schema !== "object") {
    return "unknown"
  }

  const type = schema.type as string | string[] | undefined

  if (!type) {
    return "unknown"
  }

  if (typeof type === "string" && type === "object") {
    if (schema.properties) {
      // Inline object type
      const properties = schema.properties as Record<string, JsonSchema>
      const required = (schema.required as string[]) || []
      const props: string[] = []

      for (const [key, propSchema] of Object.entries(properties)) {
        const isRequired = required.includes(key)
        const optional = isRequired ? "" : "?"
        const propType = schemaToTypeScript(propSchema, `${fallbackName}${capitalize(key)}`)
        props.push(`${key}${optional}: ${propType}`)
      }

      return `{ ${props.join("; ")} }`
    }
    return "Record<string, unknown>"
  } else if (typeof type === "string" && type === "array") {
    const items = schema.items as JsonSchema | undefined
    if (items) {
      const itemType = schemaToTypeScript(items, `${fallbackName}Item`)
      return `${itemType}[]`
    }
    return "unknown[]"
  } else if (typeof type === "string") {
    return mapJsonSchemaTypeToTypeScript(type, schema)
  } else if (Array.isArray(type)) {
    const types = type.map((t) => mapJsonSchemaTypeToTypeScript(String(t), {})).join(" | ")
    return types
  } else {
    return "unknown"
  }
}

/**
 * Maps JSON Schema type to TypeScript type
 */
function mapJsonSchemaTypeToTypeScript(type: string, schema: JsonSchema): string {
  switch (type) {
    case "string":
      // Check for enum
      if (schema.enum && Array.isArray(schema.enum)) {
        const enumValues = schema.enum.map((v) => `"${v}"`).join(" | ")
        return enumValues
      }
      return "string"
    case "number":
    case "integer":
      return "number"
    case "boolean":
      return "boolean"
    case "null":
      return "null"
    case "array":
      return "unknown[]"
    case "object":
      return "Record<string, unknown>"
    default:
      // Handle union types
      if (Array.isArray(type)) {
        const types = type.map((t) => mapJsonSchemaTypeToTypeScript(String(t), {})).join(" | ")
        return types
      }
      return "unknown"
  }
}

/**
 * Capitalizes first letter of string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Generates TypeScript types for multiple schemas
 * @param schemas - Map of schema names to schemas
 * @returns Complete TypeScript type definitions file content
 */
export function generateTypeScriptTypes(schemas: Record<string, JsonSchema>): string {
  const lines: string[] = [
    "/**",
    " * Auto-generated TypeScript types from JSON Schemas",
    " * This file is generated automatically - do not edit manually",
    " */",
    "",
  ]

  for (const [name, schema] of Object.entries(schemas)) {
    const interfaceName = capitalize(name.replace(/[-_]/g, ""))
    const typeDef = generateTypeScriptType(schema, interfaceName)
    lines.push(typeDef)
  }

  return lines.join("\n")
}

/**
 * Generates TypeScript types from node type registry
 * @param nodeTypes - Array of node types with schemas
 * @returns TypeScript type definitions
 */
export function generateTypesFromNodeTypes(
  nodeTypes: Array<{ name: string; schema?: JsonSchema }>,
): string {
  const schemas: Record<string, JsonSchema> = {}

  for (const nodeType of nodeTypes) {
    if (nodeType.schema) {
      const typeName = `${nodeType.name}Config`
      schemas[typeName] = nodeType.schema
    }
  }

  return generateTypeScriptTypes(schemas)
}

