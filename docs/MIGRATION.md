# Migration Guide

This guide helps you migrate from the old workflow architecture to the new unified architecture.

## Breaking Changes

### 1. Unified Node Model

**Before:**
```typescript
// Triggers and nodes were stored separately
workflow.triggers = { trigger1: trigger }
workflow.nodes = { node1: node }
```

**After:**
```typescript
// All nodes (including triggers) are in unified collection
workflow.nodes = { trigger1: trigger, node1: node }
// Triggers are identified by isTrigger property
if (node.properties.isTrigger) {
  // This is a trigger
}
```

**Migration:**
- All existing triggers automatically have `isTrigger: true` set
- No code changes needed for existing workflows
- Update code that accesses `workflow.triggers` to use `workflow.nodes` instead

### 2. Configuration Schema Validation

**Before:**
```typescript
// Configuration was loosely typed
node.setup({ anyProperty: "value" })
```

**After:**
```typescript
// Configuration must match schema
node.setup({ code: "return 1" }) // Valid
node.setup({ invalid: "property" }) // Throws error
```

**Migration:**
- Ensure all node configurations match their schemas
- Update invalid configurations before migration
- Use `validateNodeTypeAvailability()` to check compatibility

### 3. Execution Engine API

**Before:**
```typescript
// Simple queue-based execution
engine.execute(triggerName)
```

**After:**
```typescript
// DAG-based execution with parallel support
await engine.execute(triggerName)
// Execution order is determined by dependencies
```

**Migration:**
- No API changes needed
- Execution behavior is improved (parallel execution)
- Test workflows to ensure correct execution order

## Migration Steps

### Step 1: Validate Existing Workflows

```typescript
import { Workflow } from "./core/workflow"
import { NodeTypeRegistryImpl } from "./core/node-type-registry"

const registry = new NodeTypeRegistryImpl()
// Register all node types...

// Validate workflow
const validation = workflow.validateNodeTypeAvailability(registry)
if (!validation.valid) {
  console.error("Missing node types:", validation.missingTypes)
  // Handle missing types
}
```

### Step 2: Migrate Node Versions

```typescript
import { versionMigration } from "./core/version-migration"

// Migrate nodes to latest versions
const results = versionMigration.migrateToLatest(workflow.nodes, registry)

for (const [nodeName, result] of results) {
  if (!result.success) {
    console.error(`Migration failed for ${nodeName}:`, result.errors)
  }
}
```

### Step 3: Update Code References

**Update trigger access:**
```typescript
// Old
const triggers = workflow.triggers

// New
const triggers = Object.values(workflow.nodes).filter(
  (node) => node.properties.isTrigger
)
```

**Update node iteration:**
```typescript
// Old
for (const node of Object.values(workflow.nodes)) {
  // Regular nodes only
}

// New
for (const node of Object.values(workflow.nodes)) {
  if (node.properties.isTrigger) {
    continue // Skip triggers if needed
  }
  // Regular nodes
}
```

### Step 4: Test Workflows

After migration, test all workflows:
1. Verify execution order is correct
2. Check that parallel execution works
3. Validate configuration schemas
4. Test error handling

## Version Compatibility

### Checking Compatibility

```typescript
import { versionCompatibilityTracker } from "./core/version-compatibility"

const compatibility = versionCompatibilityTracker.checkCompatibility(
  "node-type",
  fromVersion,
  toVersion
)

if (compatibility?.compatible) {
  // Safe to migrate
} else {
  // Migration required or not possible
  console.log(compatibility?.migrationRequired)
}
```

### Migration Utilities

```typescript
import { versionMigration } from "./core/version-migration"

// Migrate single node
const result = versionMigration.migrateNode(node, targetVersion, registry)

// Migrate multiple nodes
const results = versionMigration.migrateNodes(nodes, targetVersion, registry)

// Migrate to latest
const results = versionMigration.migrateToLatest(nodes, registry)
```

## Plugin Migration

If you have custom plugins:

1. **Update Plugin Structure:**
   ```typescript
   // Ensure plugin uses new interfaces
   const plugin: Plugin = {
     manifest: { /* ... */ },
     nodeTypes: [YourNodeClass],
   }
   ```

2. **Register with NodeTypeRegistry:**
   ```typescript
   pluginRegistry.setNodeTypeRegistry(nodeTypeRegistry)
   await pluginRegistry.register(plugin)
   ```

3. **Validate Compliance:**
   ```typescript
   import { protocolValidator } from "./protocols/protocol-validator"

   const result = protocolValidator.validateAllProtocols(
     node,
     executionProtocol,
     dataFlowProtocol,
     errorHandlingProtocol
   )
   ```

## Common Issues

### Issue: Node Type Not Found

**Solution:**
```typescript
// Check if node type is registered
if (!registry.has(nodeTypeName, version)) {
  // Register node type or plugin
  registry.register(nodeType)
}
```

### Issue: Configuration Validation Fails

**Solution:**
```typescript
// Check schema requirements
const nodeType = registry.get(nodeTypeName, version)
if (nodeType?.configurationSchema) {
  // Validate against schema
  const validator = new SchemaValidator()
  const result = validator.validate(
    nodeType.configurationSchema,
    config
  )
}
```

### Issue: Circular Dependencies

**Solution:**
```typescript
// DAG execution detects circular dependencies
// Review workflow structure and remove cycles
// Use dependency graph visualization tools
```

## Testing Migration

1. **Export Workflows:**
   ```typescript
   const json = workflow.export()
   // Save to file for backup
   ```

2. **Import and Validate:**
   ```typescript
   const imported = Workflow.import(json, nodeFactory, registry)
   const validation = imported.validateNodeTypeAvailability(registry)
   ```

3. **Test Execution:**
   ```typescript
   const engine = new ExecutionEngine(imported)
   await engine.execute(triggerName)
   ```

## Rollback Plan

If migration fails:

1. Keep backups of all workflows
2. Use exported JSON to restore
3. Revert to previous version if needed
4. Report issues for fixes

## Support

For migration assistance:
- Check documentation in `docs/` directory
- Review example migrations
- Test in development environment first

