/**
 * Tests for create-plugin command
 */

import * as fs from "fs-extra"
import * as path from "path"
import { createPlugin } from "../commands/create-plugin"

describe("createPlugin", () => {
  const testDir = path.join(__dirname, "../../../test-temp-plugin")
  const pluginName = "test-plugin"

  beforeEach(async () => {
    // Clean up test directory
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir)
    }
    await fs.ensureDir(testDir)
  })

  afterEach(async () => {
    // Clean up test directory
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir)
    }
  })

  it("should create a plugin with correct structure", async () => {
    const originalCwd = process.cwd()
    try {
      process.chdir(testDir)
      await createPlugin(pluginName, {
        output: testDir,
        author: "Test Author",
        description: "Test plugin description",
      })

      const pluginDir = path.join(testDir, pluginName)

      // Check directory structure
      expect(await fs.pathExists(pluginDir)).toBe(true)
      expect(await fs.pathExists(path.join(pluginDir, "src"))).toBe(true)
      expect(await fs.pathExists(path.join(pluginDir, "src", "nodes"))).toBe(true)
      expect(await fs.pathExists(path.join(pluginDir, "schemas"))).toBe(true)
      expect(await fs.pathExists(path.join(pluginDir, "icons"))).toBe(true)

      // Check files exist
      expect(await fs.pathExists(path.join(pluginDir, "src", "manifest.ts"))).toBe(true)
      expect(await fs.pathExists(path.join(pluginDir, "src", "index.ts"))).toBe(true)
      expect(await fs.pathExists(path.join(pluginDir, "package.json"))).toBe(true)
      expect(await fs.pathExists(path.join(pluginDir, "README.md"))).toBe(true)
      expect(await fs.pathExists(path.join(pluginDir, "LICENSE"))).toBe(true)

      // Check package.json has workflow metadata
      const packageJson = await fs.readJson(path.join(pluginDir, "package.json"))
      expect(packageJson.workflow).toBeDefined()
      expect(packageJson.workflow.plugin).toBe(true)
      expect(Array.isArray(packageJson.workflow.nodeTypes)).toBe(true)
    } finally {
      process.chdir(originalCwd)
    }
  })

  it("should throw error for invalid plugin name", async () => {
    await expect(createPlugin("Invalid-Plugin-Name", { output: testDir })).rejects.toThrow()
  })

  it("should throw error if directory already exists", async () => {
    const originalCwd = process.cwd()
    try {
      process.chdir(testDir)
      await fs.ensureDir(path.join(testDir, pluginName))

      await expect(createPlugin(pluginName, { output: testDir })).rejects.toThrow()
    } finally {
      process.chdir(originalCwd)
    }
  })
})

