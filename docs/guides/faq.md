# Frequently Asked Questions

Common questions about Workflow Engine.

## General Questions

### What is Workflow Engine?

Workflow Engine is a TypeScript-based workflow execution engine that allows you to create complex workflows by connecting nodes together.

### What are nodes?

Nodes are the building blocks of workflows. Each node performs a specific task and can be connected to other nodes to create workflows.

### What is a workflow?

A workflow is a collection of connected nodes that execute in a specific order to accomplish a task.

## Usage Questions

### How do I create a workflow?

See the [Getting Started Guide](../getting-started/README.md) and [Your First Workflow](../getting-started/your-first-workflow.md).

### How do I add nodes to a workflow?

Use `workflow.addNode(node)` to add nodes to a workflow.

### How do I connect nodes?

Use `workflow.linkNodes(sourceNode, sourcePort, targetNode, targetPort)` to connect nodes.

### How do I execute a workflow?

Create an ExecutionEngine and trigger it with a trigger node.

## Development Questions

### How do I create custom nodes?

See the [Node Development Tutorial](../NODE_DEVELOPMENT_TUTORIAL.md).

### How do I create plugins?

See the [Plugin Development Guide](../PLUGIN_DEVELOPMENT.md).

### How do I test nodes?

Use the test utilities provided in `@workflow/test-utils`.

## Troubleshooting

### My workflow isn't executing

Check that:
- Nodes are connected correctly
- Execution engine is set up
- Trigger is activated

### Data isn't flowing between nodes

Verify:
- Port names match in connections
- Source node produces output
- Data format is correct

### Need more help?

- Check [Troubleshooting Guide](../TROUBLESHOOTING.md)
- Review [Common Issues](./common-issues.md)
- See [Examples](../../examples/)

