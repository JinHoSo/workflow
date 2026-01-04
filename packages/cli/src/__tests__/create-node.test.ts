/**
 * Tests for create-node command
 */

import * as fs from "fs-extra"
import * as path from "path"
import { createNode } from "../commands/create-node"

describe("createNode", () => {
  const testDir = path.join(__dirname, "../../../test-temp")
  const nodeName = "test-node"

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

  it("should create a basic node with correct structure", async () => {
    const originalCwd = process.cwd()
    try {
      process.chdir(testDir)
      await createNode(nodeName, { template: "basic", output: testDir })

      const nodeDir = path.join(testDir, nodeName)

      // Check directory exists
      expect(await fs.pathExists(nodeDir)).toBe(true)

      // Check files exist
      expect(await fs.pathExists(path.join(nodeDir, `${nodeName}.ts`))).toBe(true)
      expect(await fs.pathExists(path.join(nodeDir, "schema.ts"))).toBe(true)
      expect(await fs.pathExists(path.join(nodeDir, "index.ts"))).toBe(true)
      expect(await fs.pathExists(path.join(nodeDir, `${nodeName}.test.ts`))).toBe(true)
      expect(await fs.pathExists(path.join(nodeDir, "package.json"))).toBe(true)

      // Check node file content
      const nodeContent = await fs.readFile(path.join(nodeDir, `${nodeName}.ts`), "utf-8")
      expect(nodeContent).toContain("export class TestNode")
      expect(nodeContent).toContain("extends BaseNode")
      expect(nodeContent).toContain("process(context: ExecutionContext)")
    } finally {
      process.chdir(originalCwd)
    }
  })

  it("should create an HTTP node with HTTP-specific structure", async () => {
    const originalCwd = process.cwd()
    try {
      process.chdir(testDir)
      await createNode(nodeName, { template: "http", output: testDir })

      const nodeDir = path.join(testDir, nodeName)
      const nodeContent = await fs.readFile(path.join(nodeDir, `${nodeName}.ts`), "utf-8")

      // Check HTTP-specific content
      expect(nodeContent).toContain("HttpMethod")
      expect(nodeContent).toContain("method")
      expect(nodeContent).toContain("url")
      expect(nodeContent).toContain("headers")
    } finally {
      process.chdir(originalCwd)
    }
  })

  it("should create a trigger node with trigger-specific structure", async () => {
    const originalCwd = process.cwd()
    try {
      process.chdir(testDir)
      await createNode(nodeName, { template: "trigger", output: testDir })

      const nodeDir = path.join(testDir, nodeName)
      const nodeContent = await fs.readFile(path.join(nodeDir, `${nodeName}.ts`), "utf-8")

      // Check trigger-specific content
      expect(nodeContent).toContain("TriggerNodeBase")
      expect(nodeContent).toContain("extends TriggerNodeBase")
    } finally {
      process.chdir(originalCwd)
    }
  })

  it("should throw error for invalid node name", async () => {
    await expect(createNode("Invalid-Node-Name", { output: testDir })).rejects.toThrow()
  })

  it("should throw error if directory already exists", async () => {
    const originalCwd = process.cwd()
    try {
      process.chdir(testDir)
      await fs.ensureDir(path.join(testDir, nodeName))

      await expect(createNode(nodeName, { output: testDir })).rejects.toThrow()
    } finally {
      process.chdir(originalCwd)
    }
  })
})

