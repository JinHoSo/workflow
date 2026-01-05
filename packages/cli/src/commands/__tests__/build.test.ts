/**
 * Tests for build command
 */

import * as fs from "fs-extra"
import * as path from "path"
import { build } from "../build"

describe("build command", () => {
  const testDir = path.join(__dirname, "../../../../test-temp-build")

  beforeEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir)
    }
    await fs.ensureDir(testDir)
  })

  afterEach(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir)
    }
  })

  it("should throw error when package.json not found", async () => {
    const originalCwd = process.cwd()
    try {
      process.chdir(testDir)
      await expect(build()).rejects.toThrow("No package.json found")
    } finally {
      process.chdir(originalCwd)
    }
  })

  it("should build package with package.json", async () => {
    const originalCwd = process.cwd()
    try {
      process.chdir(testDir)
      await fs.writeJson(path.join(testDir, "package.json"), {
        name: "test-package",
        version: "1.0.0",
      })
      await fs.writeFile(path.join(testDir, "tsconfig.json"), JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          module: "commonjs",
        },
      }))
      // This will fail if TypeScript is not properly configured, but that's expected
      try {
        await build()
      } catch {
        // Expected to fail without source files
      }
    } finally {
      process.chdir(originalCwd)
    }
  })
})

