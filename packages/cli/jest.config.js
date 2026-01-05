const baseConfig = require("../../jest.config.base.js")

module.exports = {
  ...baseConfig,
  testMatch: ["**/__tests__/**/*.ts", "**/*.(spec|test).ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/src/commands/test.ts"],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    "^inquirer$": "<rootDir>/src/__mocks__/inquirer.js",
  },
}
