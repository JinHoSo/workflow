const baseConfig = require("../../jest.config.base.js")

module.exports = {
  ...baseConfig,
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  testPathIgnorePatterns: ["/node_modules/", "/mock-.*\\.ts$"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/__tests__/**", "!src/**/mock-*.ts"],
}

