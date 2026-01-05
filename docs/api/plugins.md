# Plugin System API Reference

API documentation for the plugin system.

## Table of Contents

- [PluginRegistry](#pluginregistry)
  - [Methods](#methods)
- [Plugin Interface](#plugin-interface)
  - [Plugin](#plugin)
  - [PluginManifest](#pluginmanifest)
  - [Example](#example)
- [PluginDiscovery](#plugindiscovery)
- [PluginHotReload](#pluginhotreload)
- [Creating Plugins](#creating-plugins)
  - [Basic Plugin Structure](#basic-plugin-structure)
  - [Plugin Entry Point](#plugin-entry-point)
  - [Registering Plugins](#registering-plugins)

## PluginRegistry

Manages plugin registration and discovery.

### Methods

#### `async register(plugin: Plugin): Promise<void>`

Registers a plugin.

**Parameters:**
- `plugin: Plugin` - Plugin to register

**Example:**
```typescript
await pluginRegistry.register(plugin)
```

#### `async unregister(pluginName: string, version?: string): Promise<void>`

Unregisters a plugin.

**Parameters:**
- `pluginName: string` - Name of the plugin
- `version?: string` - Optional version

**Example:**
```typescript
await pluginRegistry.unregister("my-plugin", "1.0.0")
```

#### `get(pluginName: string, version?: string): Plugin | undefined`

Gets a registered plugin.

**Parameters:**
- `pluginName: string` - Name of the plugin
- `version?: string` - Optional version (defaults to latest)

**Returns:** `Plugin | undefined` - Plugin or undefined

**Example:**
```typescript
const plugin = pluginRegistry.get("my-plugin", "1.0.0")
```

#### `getAll(): Plugin[]`

Gets all registered plugins.

**Returns:** `Plugin[]` - Array of all plugins

**Example:**
```typescript
const plugins = pluginRegistry.getAll()
```

## Plugin Interface

### Plugin

```typescript
interface Plugin {
  manifest: PluginManifest
  nodeTypes: typeof BaseNode[]
}
```

### PluginManifest

```typescript
interface PluginManifest {
  name: string
  version: string
  displayName: string
  description: string
  author: string
  dependencies?: string[]
  nodeTypes: string[]
  category?: string
  tags?: string[]
}
```

### Example

```typescript
const manifest: PluginManifest = {
  name: "@workflow/my-plugin",
  version: "1.0.0",
  displayName: "My Plugin",
  description: "My custom plugin",
  author: "Your Name",
  dependencies: [],
  nodeTypes: ["my-node-type"],
  category: "integration",
  tags: ["api", "http"],
}

const plugin: Plugin = {
  manifest,
  nodeTypes: [MyCustomNode],
}
```

## PluginDiscovery

Discovers plugins automatically.

### Methods

#### `async discover(directories: string[]): Promise<Plugin[]>`

Discovers plugins in the given directories.

**Parameters:**
- `directories: string[]` - Directories to search

**Returns:** `Promise<Plugin[]>` - Array of discovered plugins

**Example:**
```typescript
const plugins = await pluginDiscovery.discover(["./plugins"])
```

## PluginHotReload

Provides hot reloading for plugins during development.

### Methods

#### `watch(directories: string[]): void`

Watches directories for plugin changes.

**Parameters:**
- `directories: string[]` - Directories to watch

**Example:**
```typescript
pluginHotReload.watch(["./plugins"])
```

#### `onChange(callback: (plugin: Plugin) => void): void`

Registers a callback for plugin changes.

**Parameters:**
- `callback: (plugin: Plugin) => void` - Callback function

**Example:**
```typescript
pluginHotReload.onChange((plugin) => {
  console.log("Plugin changed:", plugin.manifest.name)
})
```

## Creating Plugins

### Basic Plugin Structure

```
my-plugin/
├── package.json
├── src/
│   ├── manifest.ts
│   ├── index.ts
│   └── nodes/
│       └── my-node.ts
└── README.md
```

### Plugin Entry Point

```typescript
// src/index.ts
import { Plugin } from "@workflow/plugins"
import { manifest } from "./manifest"
import { MyNode } from "./nodes/my-node"

export const plugin: Plugin = {
  manifest,
  nodeTypes: [MyNode],
}
```

### Registering Plugins

```typescript
import { pluginRegistry } from "@workflow/plugins"
import { plugin } from "./my-plugin"

await pluginRegistry.register(plugin)
```

## Related Documentation

- [Plugin Development Guide](../PLUGIN_DEVELOPMENT.md) - Complete plugin development guide
- [Node Development Tutorial](../NODE_DEVELOPMENT_TUTORIAL.md) - Creating custom nodes
- [Best Practices](../BEST_PRACTICES.md) - Development best practices

