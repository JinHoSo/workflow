/**
 * Version compatibility information
 */
export interface VersionCompatibility {
  /** Source version */
  fromVersion: number
  /** Target version */
  toVersion: number
  /** Whether versions are compatible */
  compatible: boolean
  /** Compatibility level */
  level: "major" | "minor" | "patch" | "breaking"
  /** Migration required message (if any) */
  migrationRequired?: string
}

/**
 * Version compatibility tracker for node types
 * Tracks compatibility between different versions of node types
 */
export class VersionCompatibilityTracker {
  /** Map of node type name to compatibility matrix */
  private compatibilityMatrix: Map<string, Map<string, VersionCompatibility>> = new Map()

  /**
   * Records compatibility between two versions of a node type
   * @param nodeTypeName - Name of the node type
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @param compatible - Whether versions are compatible
   * @param level - Compatibility level
   * @param migrationRequired - Optional migration message
   */
  recordCompatibility(
    nodeTypeName: string,
    fromVersion: number,
    toVersion: number,
    compatible: boolean,
    level: "major" | "minor" | "patch" | "breaking" = "patch",
    migrationRequired?: string,
  ): void {
    if (!this.compatibilityMatrix.has(nodeTypeName)) {
      this.compatibilityMatrix.set(nodeTypeName, new Map())
    }

    const nodeMatrix = this.compatibilityMatrix.get(nodeTypeName)!
    const key = `${fromVersion}->${toVersion}`
    nodeMatrix.set(key, {
      fromVersion,
      toVersion,
      compatible,
      level,
      migrationRequired,
    })
  }

  /**
   * Checks if two versions of a node type are compatible
   * @param nodeTypeName - Name of the node type
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @returns Compatibility information or undefined if not recorded
   */
  checkCompatibility(
    nodeTypeName: string,
    fromVersion: number,
    toVersion: number,
  ): VersionCompatibility | undefined {
    const nodeMatrix = this.compatibilityMatrix.get(nodeTypeName)
    if (!nodeMatrix) {
      return undefined
    }

    // Check direct compatibility
    const directKey = `${fromVersion}->${toVersion}`
    const direct = nodeMatrix.get(directKey)
    if (direct) {
      return direct
    }

    // Check reverse compatibility (if A->B is compatible, B->A might be too)
    const reverseKey = `${toVersion}->${fromVersion}`
    const reverse = nodeMatrix.get(reverseKey)
    if (reverse) {
      return {
        ...reverse,
        fromVersion,
        toVersion,
      }
    }

    // Check semantic versioning compatibility
    return this.checkSemanticCompatibility(fromVersion, toVersion)
  }

  /**
   * Checks semantic versioning compatibility
   * Uses semantic versioning rules: major.minor.patch
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @returns Compatibility information based on semantic versioning
   */
  private checkSemanticCompatibility(
    fromVersion: number,
    toVersion: number,
  ): VersionCompatibility | undefined {
    // Extract major, minor, patch from version number
    // Version format: major * 10000 + minor * 100 + patch
    // Example: 1.2.3 = 10203
    const fromMajor = Math.floor(fromVersion / 10000)
    const fromMinor = Math.floor((fromVersion % 10000) / 100)
    const fromPatch = fromVersion % 100

    const toMajor = Math.floor(toVersion / 10000)
    const toMinor = Math.floor((toVersion % 10000) / 100)
    const toPatch = toVersion % 100

    // Same version
    if (fromVersion === toVersion) {
      return {
        fromVersion,
        toVersion,
        compatible: true,
        level: "patch",
      }
    }

    // Major version change - breaking
    if (fromMajor !== toMajor) {
      return {
        fromVersion,
        toVersion,
        compatible: false,
        level: "breaking",
        migrationRequired: `Major version change from ${fromMajor}.${fromMinor}.${fromPatch} to ${toMajor}.${toMinor}.${toPatch} requires migration`,
      }
    }

    // Minor version change - backward compatible
    if (fromMinor !== toMinor) {
      return {
        fromVersion,
        toVersion,
        compatible: true,
        level: "minor",
      }
    }

    // Patch version change - fully compatible
    return {
      fromVersion,
      toVersion,
      compatible: true,
      level: "patch",
    }
  }

  /**
   * Gets all compatibility records for a node type
   * @param nodeTypeName - Name of the node type
   * @returns Array of compatibility records
   */
  getCompatibilityRecords(nodeTypeName: string): VersionCompatibility[] {
    const nodeMatrix = this.compatibilityMatrix.get(nodeTypeName)
    if (!nodeMatrix) {
      return []
    }

    return Array.from(nodeMatrix.values())
  }

  /**
   * Checks if a node type can be migrated from one version to another
   * @param nodeTypeName - Name of the node type
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @returns true if migration is possible
   */
  canMigrate(nodeTypeName: string, fromVersion: number, toVersion: number): boolean {
    const compatibility = this.checkCompatibility(nodeTypeName, fromVersion, toVersion)
    if (!compatibility) {
      // If no explicit record, use semantic versioning
      const semantic = this.checkSemanticCompatibility(fromVersion, toVersion)
      return semantic?.compatible ?? false
    }

    return compatibility.compatible || compatibility.level !== "breaking"
  }
}

/**
 * Global version compatibility tracker instance
 */
export const versionCompatibilityTracker = new VersionCompatibilityTracker()

