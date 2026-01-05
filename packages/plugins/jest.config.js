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
            "@workflow/protocols": ["../protocols/src"],
            "@workflow/secrets": ["../secrets/src"],
          },
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@workflow/core$": "<rootDir>/../core/src",
    "^@workflow/interfaces$": "<rootDir>/../interfaces/src",
    "^@workflow/protocols$": "<rootDir>/../protocols/src",
    "^@workflow/secrets$": "<rootDir>/../secrets/src",
  },
}
