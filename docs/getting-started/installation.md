# Installation

This guide covers installing Workflow Engine in your project.

## Prerequisites

- **Node.js** >= 18.0.0
- **Yarn** (recommended) or **npm**
- TypeScript knowledge (for development)

## Installation Methods

### Method 1: Install from Source (Development)

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone <repository-url>
cd workflow

# Install dependencies
yarn install

# Build the project
yarn build

# Run tests (optional)
yarn test
```

### Method 2: Install as Package (When Published)

Once published to npm, you can install Workflow Engine as a package:

```bash
# Using yarn
yarn add @workflow/core @workflow/execution @workflow/nodes

# Using npm
npm install @workflow/core @workflow/execution @workflow/nodes
```

## Package Structure

Workflow Engine is organized as a monorepo with multiple packages:

- **@workflow/core** - Core workflow engine
- **@workflow/execution** - Execution engine
- **@workflow/nodes** - Built-in node types
- **@workflow/interfaces** - TypeScript interfaces
- **@workflow/plugins** - Plugin system
- **@workflow/protocols** - Protocol implementations
- **@workflow/schemas** - Schema validation
- **@workflow/secrets** - Secrets management
- **@workflow/cli** - CLI tools

## Verify Installation

After installation, verify that everything is set up correctly:

```typescript
import { Workflow } from "@workflow/core"

// Create a simple workflow
const workflow = new Workflow("test-workflow")
console.log("Workflow Engine installed successfully!")
```

## Development Setup

If you're contributing to Workflow Engine:

1. **Install dependencies**: `yarn install`
2. **Build packages**: `yarn build`
3. **Run tests**: `yarn test`
4. **Set up IDE**: Configure your editor for TypeScript

See [Development Setup](../contributing/development-setup.md) for detailed instructions.

## Troubleshooting

### Common Issues

**Issue**: TypeScript errors after installation
- **Solution**: Ensure you have TypeScript >= 4.5 installed globally or in your project

**Issue**: Build fails
- **Solution**: Make sure all dependencies are installed: `yarn install`

**Issue**: Module not found errors
- **Solution**: Rebuild the project: `yarn build`

For more troubleshooting help, see [Troubleshooting Guide](../TROUBLESHOOTING.md).

## Next Steps

Now that you have Workflow Engine installed:

1. Follow the [Quick Start](./quick-start.md) guide
2. Build [Your First Workflow](./your-first-workflow.md)
3. Learn about [Core Concepts](./core-concepts.md)

