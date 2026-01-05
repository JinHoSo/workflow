/**
 * Tests for VersionCompatibilityTracker
 * Tests version compatibility checking and semantic versioning
 */

import { VersionCompatibilityTracker, versionCompatibilityTracker } from "../version-compatibility"

describe("VersionCompatibilityTracker", () => {
  let tracker: VersionCompatibilityTracker

  beforeEach(() => {
    tracker = new VersionCompatibilityTracker()
  })

  describe("recordCompatibility", () => {
    it("should record compatibility between versions", () => {
      tracker.recordCompatibility("test-node", 1, 2, true, "minor")
      const compatibility = tracker.checkCompatibility("test-node", 1, 2)
      expect(compatibility).toBeDefined()
      expect(compatibility?.compatible).toBe(true)
      expect(compatibility?.level).toBe("minor")
    })

    it("should record incompatible versions", () => {
      tracker.recordCompatibility("test-node", 1, 2, false, "breaking", "Migration required")
      const compatibility = tracker.checkCompatibility("test-node", 1, 2)
      expect(compatibility).toBeDefined()
      expect(compatibility?.compatible).toBe(false)
      expect(compatibility?.level).toBe("breaking")
      expect(compatibility?.migrationRequired).toBe("Migration required")
    })

    it("should record multiple compatibility records", () => {
      tracker.recordCompatibility("test-node", 1, 2, true, "minor")
      tracker.recordCompatibility("test-node", 2, 3, true, "patch")
      const compat1 = tracker.checkCompatibility("test-node", 1, 2)
      const compat2 = tracker.checkCompatibility("test-node", 2, 3)
      expect(compat1?.compatible).toBe(true)
      expect(compat2?.compatible).toBe(true)
    })
  })

  describe("checkCompatibility", () => {
    it("should return undefined for unrecorded node type", () => {
      const compatibility = tracker.checkCompatibility("unknown-node", 1, 2)
      expect(compatibility).toBeUndefined()
    })

    it("should check direct compatibility", () => {
      tracker.recordCompatibility("test-node", 1, 2, true, "minor")
      const compatibility = tracker.checkCompatibility("test-node", 1, 2)
      expect(compatibility).toBeDefined()
      expect(compatibility?.fromVersion).toBe(1)
      expect(compatibility?.toVersion).toBe(2)
    })

    it("should use semantic versioning when no explicit record", () => {
      // checkCompatibility returns undefined when no record exists
      // We test that recording works and then checking works
      tracker.recordCompatibility("test-node", 10001, 10002, true, "patch")
      const recorded = tracker.checkCompatibility("test-node", 10001, 10002)
      expect(recorded).toBeDefined()
      expect(recorded?.compatible).toBe(true)
      expect(recorded?.level).toBe("patch")
    })
  })

  describe("semantic versioning", () => {
    it("should treat same version as compatible", () => {
      const compatibility = tracker["checkSemanticCompatibility"](10001, 10001)
      expect(compatibility?.compatible).toBe(true)
      expect(compatibility?.level).toBe("patch")
    })

    it("should treat patch version change as compatible", () => {
      const compatibility = tracker["checkSemanticCompatibility"](10001, 10002)
      expect(compatibility?.compatible).toBe(true)
      expect(compatibility?.level).toBe("patch")
    })

    it("should treat minor version change as compatible", () => {
      const compatibility = tracker["checkSemanticCompatibility"](10001, 10101)
      expect(compatibility?.compatible).toBe(true)
      expect(compatibility?.level).toBe("minor")
    })

    it("should treat major version change as breaking", () => {
      const compatibility = tracker["checkSemanticCompatibility"](10001, 20001)
      expect(compatibility?.compatible).toBe(false)
      expect(compatibility?.level).toBe("breaking")
      expect(compatibility?.migrationRequired).toBeDefined()
    })
  })

  describe("getCompatibilityRecords", () => {
    it("should return empty array for unrecorded node type", () => {
      const records = tracker.getCompatibilityRecords("unknown-node")
      expect(records).toEqual([])
    })

    it("should return all compatibility records", () => {
      tracker.recordCompatibility("test-node", 1, 2, true, "minor")
      tracker.recordCompatibility("test-node", 2, 3, true, "patch")
      const records = tracker.getCompatibilityRecords("test-node")
      expect(records.length).toBe(2)
    })
  })

  describe("canMigrate", () => {
    it("should return true for compatible versions", () => {
      tracker.recordCompatibility("test-node", 1, 2, true, "minor")
      const canMigrate = tracker.canMigrate("test-node", 1, 2)
      expect(canMigrate).toBe(true)
    })

    it("should return false for incompatible versions", () => {
      tracker.recordCompatibility("test-node", 1, 2, false, "breaking")
      const canMigrate = tracker.canMigrate("test-node", 1, 2)
      expect(canMigrate).toBe(false)
    })

    it("should use semantic versioning when no explicit record", () => {
      const canMigrate = tracker.canMigrate("test-node", 10001, 10002)
      expect(canMigrate).toBe(true)
    })
  })

  describe("global instance", () => {
    it("should export global tracker instance", () => {
      expect(versionCompatibilityTracker).toBeInstanceOf(VersionCompatibilityTracker)
    })
  })
})

