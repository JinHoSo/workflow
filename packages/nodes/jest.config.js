const baseConfig = require("../../jest.config.base.js")

module.exports = {
  ...baseConfig,
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
            "@workflow/execution": ["../execution/src"],
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@workflow/core$": "<rootDir>/../core/src",
    "^@workflow/interfaces$": "<rootDir>/../interfaces/src",
    "^@workflow/schemas$": "<rootDir>/../schemas/src",
    "^@workflow/execution$": "<rootDir>/../execution/src",
  },
}

