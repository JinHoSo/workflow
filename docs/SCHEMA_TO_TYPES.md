# Schema to TypeScript Type Generator

This document describes the optional tooling utility for generating TypeScript types from JSON Schemas.

## Overview

The `schema-to-types` module provides utilities to automatically generate TypeScript type definitions from JSON Schema definitions. This is useful for:

- Type-safe node configurations
- Auto-completion in IDEs
- Compile-time type checking
- Documentation generation

## Usage

### Basic Usage

```typescript
import { generateTypeScriptType } from "./src/schemas/schema-to-types"

const schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
  },
  required: ["name"],
}

const typeDef = generateTypeScriptType(schema, "PersonConfig")
console.log(typeDef)
// Output:
// export interface PersonConfig {
//   name: string
//   age?: number
// }
```

### Multiple Schemas

```typescript
import { generateTypeScriptTypes } from "./src/schemas/schema-to-types"

const schemas = {
  JavaScriptNodeConfig: {
    type: "object",
    properties: {
      code: { type: "string" },
    },
    required: ["code"],
  },
  HttpRequestNodeConfig: {
    type: "object",
    properties: {
      method: { type: "string", enum: ["GET", "POST"] },
      url: { type: "string" },
    },
    required: ["method", "url"],
  },
}

const typeDefs = generateTypeScriptTypes(schemas)
// Generates interfaces for all schemas
```

### From Node Types

```typescript
import { generateTypesFromNodeTypes } from "./src/schemas/schema-to-types"

const nodeTypes = [
  { name: "javascript", schema: { /* ... */ } },
  { name: "http-request", schema: { /* ... */ } },
]

const typeDefs = generateTypesFromNodeTypes(nodeTypes)
```

## Generated Type Features

### Supported Types

- **Primitives**: `string`, `number`, `boolean`, `null`
- **Objects**: Generates interfaces with proper typing
- **Arrays**: Generates array types with item types
- **Enums**: Converts to union types (e.g., `"option1" | "option2"`)
- **Nested Objects**: Generates separate interfaces for nested objects
- **Optional Properties**: Uses `?` for non-required properties

### Example Output

```typescript
// Input Schema
{
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

// Generated TypeScript
export interface ComplexConfigUser {
  name: string
  emails?: string[]
}

export interface ComplexConfigSettings {
  theme: "light" | "dark"
}

export interface ComplexConfig {
  user: ComplexConfigUser
  settings: ComplexConfigSettings
}
```

## CLI Script

A CLI script is provided for generating types:

```bash
# Generate types from example schemas
yarn ts-node scripts/generate-types.ts [output-file]
```

The script generates TypeScript type definitions and writes them to a file.

## Integration

### Build Process

Add to your build process:

```json
{
  "scripts": {
    "generate-types": "ts-node scripts/generate-types.ts",
    "prebuild": "yarn generate-types"
  }
}
```

### Development

Use in development for type-safe configurations:

```typescript
import type { JavaScriptNodeConfig } from "./types/generated-config-types"

const config: JavaScriptNodeConfig = {
  code: "return { value: 1 }",
}
```

## Limitations

- Does not support all JSON Schema features (e.g., `oneOf`, `anyOf`, `allOf`)
- Complex validation rules are not converted to types
- Union types in schema are simplified to first type

## Future Improvements

- Support for `oneOf`, `anyOf`, `allOf`
- Support for `$ref` references
- Better handling of complex validation rules
- Integration with build tools (webpack, vite, etc.)

