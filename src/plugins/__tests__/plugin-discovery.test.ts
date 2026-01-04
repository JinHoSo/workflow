/**
 * Tests for plugin discovery
 */

import * as fs from "fs"
import * as path from "path"
import { discoverPlugins, isWorkflowPlugin, getPluginMetadata } from "../plugin-discovery"

describe("plugin-discovery", () => {
  const testDir = path.join(__dirname, "../../../test-temp-plugins")

  beforeEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true })
    }
    await fs.promises.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      await fs.promises.rm(testDir, { recursive: true, force: true })
    }
  })

  it("should discover workflow plugins in directory", async () => {
    // Create a test plugin
    const pluginDir = path.join(testDir, "test-plugin")
    await fs.promises.mkdir(pluginDir, { recursive: true })

    const packageJson = {
      name: "@workflow/test-plugin",
      version: "0.1.0",
      description: "Test plugin",
      workflow: {
        plugin: true,
        nodeTypes: ["test-node-1", "test-node-2"],
      },
    }

    await fs.promises.writeFile(
      path.join(pluginDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
    )

    const plugins = await discoverPlugins({ directories: [testDir] })

    expect(plugins.length).toBe(1)
    expect(plugins[0].name).toBe("@workflow/test-plugin")
    expect(plugins[0].version).toBe("0.1.0")
    expect(plugins[0].manifest.nodeTypes).toEqual(["test-node-1", "test-node-2"])
  })

  it("should not discover non-plugin packages", async () => {
    // Create a non-plugin package
    const packageDir = path.join(testDir, "regular-package")
    await fs.promises.mkdir(packageDir, { recursive: true })

    const packageJson = {
      name: "regular-package",
      version: "0.1.0",
      description: "Regular package",
    }

    await fs.promises.writeFile(
      path.join(packageDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
    )

    const plugins = await discoverPlugins({ directories: [testDir] })

    expect(plugins.length).toBe(0)
  })

  it("should handle missing package.json gracefully", async () => {
    // Create directory without package.json
    const emptyDir = path.join(testDir, "empty-dir")
    await fs.promises.mkdir(emptyDir, { recursive: true })

    const plugins = await discoverPlugins({ directories: [testDir] })

    expect(plugins.length).toBe(0)
  })

  it("should extract manifest from package.json", async () => {
    const pluginDir = path.join(testDir, "test-plugin")
    await fs.promises.mkdir(pluginDir, { recursive: true })

    const packageJson = {
      name: "@workflow/test-plugin",
      version: "0.1.0",
      displayName: "Test Plugin",
      description: "Test plugin description",
      author: "Test Author",
      workflow: {
        plugin: true,
        nodeTypes: ["node1"],
        dependencies: ["@workflow/dep1"],
      },
    }

    await fs.promises.writeFile(
      path.join(pluginDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
    )

    const plugins = await discoverPlugins({ directories: [testDir] })

    expect(plugins.length).toBe(1)
    const manifest = plugins[0].manifest
    expect(manifest.displayName).toBe("Test Plugin")
    expect(manifest.description).toBe("Test plugin description")
    expect(manifest.author).toBe("Test Author")
    expect(manifest.dependencies).toEqual(["@workflow/dep1"])
  })
})

describe("isWorkflowPlugin", () => {
  it("should return true for workflow plugins", () => {
    const packageJson = {
      workflow: {
        plugin: true,
      },
    }

    expect(isWorkflowPlugin(packageJson)).toBe(true)
  })

  it("should return false for non-plugins", () => {
    const packageJson = {
      name: "regular-package",
    }

    expect(isWorkflowPlugin(packageJson)).toBe(false)
  })

  it("should return false for packages without workflow field", () => {
    const packageJson = {
      name: "package",
      version: "1.0.0",
    }

    expect(isWorkflowPlugin(packageJson)).toBe(false)
  })
})

describe("getPluginMetadata", () => {
  it("should extract plugin metadata from package.json", () => {
    const packageJson = {
      workflow: {
        nodeTypes: ["node1", "node2"],
        dependencies: ["dep1", "dep2"],
      },
    }

    const metadata = getPluginMetadata(packageJson)

    expect(metadata.nodeTypes).toEqual(["node1", "node2"])
    expect(metadata.dependencies).toEqual(["dep1", "dep2"])
  })

  it("should return empty arrays for missing metadata", () => {
    const packageJson = {
      workflow: {},
    }

    const metadata = getPluginMetadata(packageJson)

    expect(metadata.nodeTypes).toEqual([])
    expect(metadata.dependencies).toEqual([])
  })
})

