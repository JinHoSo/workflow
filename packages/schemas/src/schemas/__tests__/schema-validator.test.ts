/**
 * Tests for SchemaValidator
 * Tests JSON schema validation, error formatting, and schema compilation
 */

import { SchemaValidator, schemaValidator } from "../schema-validator"
import type { JsonSchema } from "@workflow/interfaces"

describe("SchemaValidator", () => {
  let validator: SchemaValidator

  beforeEach(() => {
    validator = new SchemaValidator()
  })

  describe("validation", () => {
    it("should validate data against schema", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name"],
      }
      const validData = { name: "Test", age: 30 }
      const result = validator.validate(schema, validData)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should reject invalid data", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      }
      const invalidData = { age: 30 }
      const result = validator.validate(schema, invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it("should validate string type", () => {
      const schema: JsonSchema = {
        type: "string",
      }
      expect(validator.validate(schema, "test").valid).toBe(true)
      expect(validator.validate(schema, 123).valid).toBe(false)
    })

    it("should validate number type", () => {
      const schema: JsonSchema = {
        type: "number",
      }
      expect(validator.validate(schema, 123).valid).toBe(true)
      expect(validator.validate(schema, "123").valid).toBe(false)
    })

    it("should validate boolean type", () => {
      const schema: JsonSchema = {
        type: "boolean",
      }
      expect(validator.validate(schema, true).valid).toBe(true)
      expect(validator.validate(schema, false).valid).toBe(true)
      expect(validator.validate(schema, "true").valid).toBe(false)
    })

    it("should validate array type", () => {
      const schema: JsonSchema = {
        type: "array",
        items: { type: "string" },
      }
      expect(validator.validate(schema, ["a", "b"]).valid).toBe(true)
      expect(validator.validate(schema, [1, 2]).valid).toBe(false)
    })

    it("should validate required properties", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          required: { type: "string" },
          optional: { type: "string" },
        },
        required: ["required"],
      }
      expect(validator.validate(schema, { required: "value" }).valid).toBe(true)
      expect(validator.validate(schema, { optional: "value" }).valid).toBe(false)
    })
  })

  describe("error formatting", () => {
    it("should format validation errors", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      }
      const result = validator.validate(schema, {})
      expect(result.errorMessage).toBeDefined()
      expect(result.errorMessage).toContain("name")
    })

    it("should include multiple errors", () => {
      const schema: JsonSchema = {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name", "age"],
      }
      const result = validator.validate(schema, {})
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe("schema compilation caching", () => {
    it("should cache compiled schemas", () => {
      const schema: JsonSchema = {
        type: "string",
      }
      const result1 = validator.validate(schema, "test")
      const result2 = validator.validate(schema, "test")
      expect(result1.valid).toBe(true)
      expect(result2.valid).toBe(true)
    })
  })

  describe("clearCache", () => {
    it("should clear compiled schema cache", () => {
      const schema: JsonSchema = {
        type: "string",
      }
      validator.validate(schema, "test")
      validator.clearCache()
      // Cache should be cleared, but validation should still work
      const result = validator.validate(schema, "test")
      expect(result.valid).toBe(true)
    })
  })

  describe("global instance", () => {
    it("should export global validator instance", () => {
      expect(schemaValidator).toBeInstanceOf(SchemaValidator)
    })
  })
})

