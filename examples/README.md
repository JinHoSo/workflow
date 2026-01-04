# Example Plugins and Nodes

This directory contains example implementations demonstrating best practices.

## Examples

### Basic Node Example

See `basic-node-example/` for a simple node implementation.

### HTTP Node Example

See `http-node-example/` for an HTTP request node implementation.

### Trigger Node Example

See `trigger-node-example/` for a trigger node implementation.

### Multi-Node Plugin Example

See `multi-node-plugin/` for a plugin with multiple nodes.

### Plugin with Dependencies Example

See `plugin-with-deps/` for a plugin that depends on other plugins.

## Running Examples

1. Navigate to an example directory
2. Install dependencies: `yarn install`
3. Build: `yarn build`
4. Run tests: `yarn test`

## Creating Your Own

Use the CLI to create new examples:

```bash
workflow create:plugin my-example-plugin
workflow create:node my-example-node --template basic
```

