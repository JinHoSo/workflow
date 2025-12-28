<!--
Sync Impact Report:
Version: 0.0.0 → 1.0.0 (Initial constitution)
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (TypeScript, Next.js, Monorepo, Code Quality)
  - Development Workflow (Prettier on save)
  - Governance
Templates requiring updates:
  - ✅ plan-template.md (updated Constitution Check section)
  - ⚠ spec-template.md (no changes needed - tech-agnostic)
  - ⚠ tasks-template.md (no changes needed - tech-agnostic)
Follow-up TODOs: None
-->

# Workflow Constitution

## Core Principles

### I. TypeScript (MANDATORY)

All code MUST be written in TypeScript. The use of `any` or `unknown` types is STRICTLY FORBIDDEN. All types must be explicitly defined with proper type safety. Rationale: Type safety prevents runtime errors and improves code maintainability.

### II. Next.js Framework

The project MUST use Next.js as the primary framework. All web applications and interfaces MUST be built using Next.js conventions and best practices. Rationale: Next.js provides a standardized, production-ready framework for React applications with built-in optimizations.

### III. Monorepo Structure

The project MUST be organized as a monorepo. All packages, applications, and shared libraries MUST be managed within a single repository using appropriate monorepo tooling (e.g., Yarn workspaces, Turborepo, Nx). Rationale: Monorepo structure enables code sharing, consistent tooling, and unified dependency management across the project.

### IV. Code Quality & Formatting (NON-NEGOTIABLE)

**Prettier on Save**: Prettier MUST execute automatically on every file save. This MUST be enforced at the editor/IDE level and verified in CI/CD pipelines. No exceptions.

**Linting Rules**:
- Double quotes (`"`) MUST be used for all strings. Single quotes are FORBIDDEN.
- Trailing semicolons MUST be removed. All statements MUST end without semicolons.

Rationale: Consistent formatting reduces code review friction and prevents style debates. Automated formatting on save ensures immediate compliance without manual intervention.

## Development Workflow

### File Save Requirements

Every file save MUST trigger Prettier formatting. This MUST be configured in:
- Editor/IDE settings (e.g., VS Code settings.json with `"editor.formatOnSave": true`)
- Pre-commit hooks (if applicable)
- CI/CD pipeline validation

Non-compliance with formatting rules MUST cause build failures.

## Governance

This constitution supersedes all other coding standards and practices. All code contributions MUST comply with these principles.

**Amendment Procedure**: Changes to this constitution require:
1. Documentation of the rationale
2. Update to version number following semantic versioning
3. Propagation to all dependent templates and documentation
4. Update to the Sync Impact Report

**Versioning Policy**:
- **MAJOR**: Backward incompatible principle removals or redefinitions
- **MINOR**: New principles or materially expanded guidance
- **PATCH**: Clarifications, wording fixes, non-semantic refinements

**Compliance Review**: All pull requests and code reviews MUST verify compliance with these principles. Violations MUST be addressed before merge.

**Version**: 1.0.0 | **Ratified**: 2025-12-28 | **Last Amended**: 2025-12-28
