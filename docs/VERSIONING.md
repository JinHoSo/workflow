# Node Type Versioning Strategy

This document describes the versioning strategy for node types in the workflow engine.

## Version Format

Node types use semantic versioning with a numeric format:
- Format: `major * 10000 + minor * 100 + patch`
- Example: Version 1.2.3 = 10203
- Example: Version 2.0.1 = 20001

## Version Compatibility

### Compatibility Levels

1. **Patch (patch)**: Fully compatible, no migration needed
   - Example: 1.0.0 → 1.0.1
   - Bug fixes, minor improvements

2. **Minor (minor)**: Backward compatible, migration optional
   - Example: 1.0.0 → 1.1.0
   - New features, backward compatible changes

3. **Major (major)**: Breaking changes, migration required
   - Example: 1.0.0 → 2.0.0
   - Breaking API changes, incompatible schema changes

4. **Breaking (breaking)**: Explicitly marked as incompatible
   - Explicitly recorded incompatibility
   - Migration may not be possible

## Version Compatibility Tracking

Use `VersionCompatibilityTracker` to track and check compatibility:

```typescript
import { versionCompatibilityTracker } from "./core/version-compatibility"

// Record compatibility
versionCompatibilityTracker.recordCompatibility(
  "javascript",
  1,      // from version
  2,      // to version
  false,  // compatible
  "breaking",
  "Schema changes require migration"
)

// Check compatibility
const compatibility = versionCompatibilityTracker.checkCompatibility(
  "javascript",
  1,
  2
)

if (compatibility?.compatible) {
  // Versions are compatible
} else {
  // Migration required
  console.log(compatibility?.migrationRequired)
}
```

## Version Migration

Use `VersionMigration` to migrate nodes between versions:

```typescript
import { versionMigration } from "./core/version-migration"

// Migrate a single node
const result = versionMigration.migrateNode(
  node,
  targetVersion,
  nodeTypeRegistry
)

if (result.success) {
  // Use result.migratedNode
} else {
  // Handle errors
  console.error(result.errors)
}

// Migrate to latest version
const results = versionMigration.migrateToLatest(nodes, nodeTypeRegistry)
```

### Migration Process

1. **Compatibility Check**: Verify versions are compatible
2. **Target Validation**: Ensure target version exists in registry
3. **Configuration Migration**: Transform configuration based on schema
4. **Version Update**: Update node version property

## Version Resolution

The `NodeTypeRegistry` automatically resolves to the latest version when no version is specified:

```typescript
// Get latest version
const latest = registry.get("javascript")

// Get specific version
const specific = registry.get("javascript", 1)
```

## Best Practices

1. **Use Semantic Versioning**: Follow major.minor.patch format
2. **Record Compatibility**: Explicitly record compatibility for breaking changes
3. **Provide Migration Paths**: Always provide migration utilities for breaking changes
4. **Test Migrations**: Thoroughly test migration paths
5. **Document Changes**: Document what changed between versions

## Migration Examples

### Patch Version Update

```typescript
// No migration needed, fully compatible
const result = versionMigration.migrateNode(node, 10201, registry)
// result.success = true, no changes needed
```

### Minor Version Update

```typescript
// Backward compatible, migration optional
const result = versionMigration.migrateNode(node, 10100, registry)
// Configuration may be enhanced but existing config still works
```

### Major Version Update

```typescript
// Breaking changes, migration required
const result = versionMigration.migrateNode(node, 20000, registry)
// Configuration must be transformed based on new schema
```

## Version Compatibility Matrix

Maintain a compatibility matrix for each node type:

```typescript
// Record compatibility matrix
versionCompatibilityTracker.recordCompatibility("javascript", 1, 2, false, "breaking")
versionCompatibilityTracker.recordCompatibility("javascript", 2, 3, true, "minor")
versionCompatibilityTracker.recordCompatibility("javascript", 3, 4, true, "patch")
```

This allows the system to determine migration paths and compatibility automatically.

