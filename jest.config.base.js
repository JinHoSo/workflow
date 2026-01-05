/**
 * Base Jest configuration for all packages
 * Each package can extend this and override specific settings
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/__tests__/**"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          moduleResolution: "node",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
          baseUrl: ".",
          paths: {
            "@workflow/core": ["../core/src"],
            "@workflow/interfaces": ["../interfaces/src"],
            "@workflow/schemas": ["../schemas/src"],
            "@workflow/secrets": ["../secrets/src"],
            "@workflow/protocols": ["../protocols/src"],
            "@workflow/execution": ["../execution/src"],
            "@workflow/plugins": ["../plugins/src"],
            "@workflow/nodes": ["../nodes/src"],
            "@workflow/cli": ["../cli/src"],
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@workflow/core$": "<rootDir>/../core/src",
    "^@workflow/interfaces$": "<rootDir>/../interfaces/src",
    "^@workflow/schemas$": "<rootDir>/../schemas/src",
    "^@workflow/secrets$": "<rootDir>/../secrets/src",
    "^@workflow/protocols$": "<rootDir>/../protocols/src",
    "^@workflow/execution$": "<rootDir>/../execution/src",
    "^@workflow/plugins$": "<rootDir>/../plugins/src",
    "^@workflow/nodes$": "<rootDir>/../nodes/src",
    "^@workflow/cli$": "<rootDir>/../cli/src",
  },
}

