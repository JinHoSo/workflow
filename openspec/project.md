# Project Context

## Purpose
[Describe your project's purpose and goals]

## Tech Stack
- **TypeScript** (MANDATORY) - All code MUST be written in TypeScript. The use of `any` or `unknown` types is STRICTLY FORBIDDEN.
- **Next.js** - Primary framework for all web applications and interfaces
- **Monorepo** - Project organized as a monorepo using appropriate tooling (e.g., Yarn workspaces, Turborepo, Nx)

## Project Conventions

### Code Style
**Formatting Rules (NON-NEGOTIABLE)**:
- **Prettier on Save**: Prettier MUST execute automatically on every file save. Configured in editor/IDE settings and verified in CI/CD pipelines.
- **Quotes**: Double quotes (`"`) MUST be used for all strings. Single quotes are FORBIDDEN.
- **Semicolons**: Trailing semicolons MUST be removed. All statements MUST end without semicolons.

**Type Safety**:
- All types MUST be explicitly defined
- `any` and `unknown` types are STRICTLY FORBIDDEN
- Proper type safety is required for all code

### Architecture Patterns
- **Monorepo Structure**: All packages, applications, and shared libraries MUST be managed within a single repository
- **Next.js Conventions**: All web applications MUST follow Next.js conventions and best practices
- Code sharing and unified dependency management across the project

### Testing Strategy
[Explain your testing approach and requirements]

### Git Workflow
[Describe your branching strategy and commit conventions]

## Domain Context
[Add domain-specific knowledge that AI assistants need to understand]

## Important Constraints
- **TypeScript Only**: No JavaScript files allowed
- **Next.js Required**: All web applications must use Next.js
- **Monorepo Structure**: Must maintain monorepo organization
- **Formatting Enforcement**: Non-compliance with formatting rules MUST cause build failures

## External Dependencies
[Document key external services, APIs, or systems]
