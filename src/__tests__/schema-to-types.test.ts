/**
 * Tests for Schema to TypeScript Type Generator
 */

import { generateTypeScriptType, generateTypeScriptTypes } from "../schemas/schema-to-types"
import type { JsonSchema } from "../schemas/schema-validator"

describe("Schema to TypeScript Type Generator", () => {
  describe("Primitive Types", () => {
    test("should generate string type", () => {
      const schema: JsonSchema = { type: "string" }
      const result = generateTypeScriptType(schema, "TestType")
      expect(result).toContain("export type TestType = string")
    })

    test("should generate number type", () => {
      const schema: JsonSchema = { type: "number" }
      const result = generateTypeScriptType(schema, "TestType")
      expect(result).toContain("export type TestType = number")
    })

    test("should generate boolean type", () => {
      const schema: JsonSchema = { type: "boolean" }
      const result = generateTypeScriptType(schema, "TestType")
      expect(result).toContain("export type TestType = boolean")
    })

    test("should generate enum type", () => {
      const schema: JsonSchema = {
        type: "string",
        enum: ["option1", "option2", "option3"],
      }
      const result = generateTypeScriptType(schema, "TestType")
      expect(result).toContain('"option1" | "option2" | "option3"')
    })
  })

  describe("Object Types", () => {
    test("should generate interface for object schema", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      }
      const result = generateTypeScriptType(schema, "Person")
      expect(result).toContain("export interface Person")
      expect(result).toContain("name: string")
      expect(result).toContain("age?: number")
    })

    test("should handle nested objects", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
              city: { type: "string" },
            },
            required: ["street", "city"],
          },
        },
        required: ["address"],
      }
      const result = generateTypeScriptType(schema, "Person")
      expect(result).toContain("export interface PersonAddress")
      expect(result).toContain("street: string")
      expect(result).toContain("city: string")
    })
  })

  describe("Array Types", () => {
    test("should generate array type", () => {
      const schema: JsonSchema = {
        type: "array",
        items: { type: "string" },
      }
      const result = generateTypeScriptType(schema, "StringArray")
      expect(result).toContain("export type StringArray = string[]")
    })

    test("should generate array of objects", () => {
      const schema: JsonSchema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
          },
          required: ["id", "name"],
        },
      }
      const result = generateTypeScriptType(schema, "Items")
      expect(result).toContain("export interface ItemsItem")
      expect(result).toContain("id: number")
      expect(result).toContain("name: string")
    })
  })

  describe("Multiple Schemas", () => {
    test("should generate types for multiple schemas", () => {
      const schemas: Record<string, JsonSchema> = {
        Config1: {
          type: "object",
          properties: {
            value: { type: "string" },
          },
          required: ["value"],
        },
        Config2: {
          type: "object",
          properties: {
            count: { type: "number" },
          },
          required: ["count"],
        },
      }

      const result = generateTypeScriptTypes(schemas)
      expect(result).toContain("export interface Config1")
      expect(result).toContain("export interface Config2")
      expect(result).toContain("value: string")
      expect(result).toContain("count: number")
    })
  })

  describe("Complex Schemas", () => {
    test("should handle complex nested schema", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          user: {
            type: "object",
            properties: {
              name: { type: "string" },
              emails: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["name"],
          },
          settings: {
            type: "object",
            properties: {
              theme: {
                type: "string",
                enum: ["light", "dark"],
              },
            },
            required: ["theme"],
          },
        },
        required: ["user", "settings"],
      }

      const result = generateTypeScriptType(schema, "ComplexConfig")
      expect(result).toContain("export interface ComplexConfig")
      expect(result).toContain("export interface ComplexConfigUser")
      expect(result).toContain("export interface ComplexConfigSettings")
      expect(result).toContain('"light" | "dark"')
    })
  })
})

