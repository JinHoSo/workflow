# Development Setup

Guide for setting up a development environment for Workflow Engine.

## Prerequisites

- **Node.js** >= 18.0.0
- **Yarn** package manager
- **Git**
- Code editor (VS Code recommended)

## Setup Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd workflow
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Build Project

```bash
yarn build
```

### 4. Run Tests

```bash
yarn test
```

## Development Workflow

### Making Changes

1. Create a feature branch
2. Make your changes
3. Write or update tests
4. Run tests: `yarn test`
5. Build: `yarn build`
6. Submit pull request

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

### Building

```bash
# Build all packages
yarn build

# Build specific package
yarn workspace @workflow/core build
```

## IDE Setup

### VS Code

Recommended extensions:
- TypeScript and JavaScript Language Features
- ESLint
- Prettier

### TypeScript

TypeScript is configured in `tsconfig.json`. The project uses:
- Strict mode enabled
- ES2020 target
- Module resolution: node

## Project Structure

See [Package Structure](../PACKAGE_STRUCTURE.md) for detailed information about the monorepo structure.

## Related Documentation

- [Contributing Guide](../../CONTRIBUTING.md)
- [Pull Request Guide](./pull-requests.md)
- [Best Practices](../BEST_PRACTICES.md)

