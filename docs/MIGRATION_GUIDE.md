# Migration Guide

This guide helps you migrate existing plugins to the new plugin system.

## Overview

The new plugin system introduces:
- Standardized package structure
- Automatic discovery
- Enhanced metadata
- Improved validation

## Migration Steps

### 1. Update Package Structure

Ensure your plugin follows the standard structure:

```
my-plugin/
├── package.json
├── src/
│   ├── manifest.ts
│   ├── index.ts
│   └── nodes/
└── schemas/
```

### 2. Update package.json

Add workflow metadata:

```json
{
  "name": "@workflow/my-plugin",
  "workflow": {
    "plugin": true,
    "nodeTypes": ["my-node-1", "my-node-2"],
    "category": "integration",
    "tags": ["api"]
  }
}
```

### 3. Create Manifest

Create `src/manifest.ts`:

```typescript
export const manifest: PluginManifest = {
  name: "@workflow/my-plugin",
  version: "0.1.0",
  displayName: "My Plugin",
  description: "Plugin description",
  nodeTypes: ["my-node-1", "my-node-2"],
  category: "integration",
  tags: ["api"],
}
```

### 4. Update Entry Point

Update `src/index.ts`:

```typescript
import { manifest } from "./manifest"
import { MyNode1 } from "./nodes/my-node-1"
import { MyNode2 } from "./nodes/my-node-2"

export const plugin: Plugin = {
  manifest,
  nodeTypes: [MyNode1, MyNode2],
}
```

### 5. Validate

Run validation:

```bash
workflow validate
```

### 6. Test

Run tests:

```bash
workflow test
```

## Breaking Changes

### Plugin Registration

**Before**: Manual registration
```typescript
pluginRegistry.register(plugin)
```

**After**: Automatic discovery
```typescript
await pluginRegistry.discover()
```

### Manifest Structure

**Before**: Simple manifest
```typescript
{
  name: "plugin",
  version: "1.0.0",
  nodes: [...]
}
```

**After**: Enhanced manifest
```typescript
{
  name: "plugin",
  version: "1.0.0",
  displayName: "Plugin",
  nodeTypes: [...],
  category: "...",
  tags: [...]
}
```

## Compatibility

The system maintains backward compatibility with:
- Legacy plugin structure (with warnings)
- Old manifest format (auto-converted)
- Manual registration (still supported)

## Migration Tools

Use the CLI to help with migration:

```bash
# Validate current structure
workflow validate

# Check for issues
workflow validate --suggest
```

## Common Issues

### Missing Metadata

**Issue**: Plugin not discovered

**Solution**: Add `workflow.plugin: true` to package.json

### Invalid Structure

**Issue**: Validation fails

**Solution**: Follow standard directory structure

### Node Not Registered

**Issue**: Node types not available

**Solution**: Ensure nodes are in manifest.nodeTypes array

## Need Help?

- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Review [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
- Open an issue for assistance

