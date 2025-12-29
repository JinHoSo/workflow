## Context
Workflows need to be serializable to JSON format for persistence, sharing, and version control. The export format must capture all workflow state including nodes, connections, settings, and static data. Import must be able to reconstruct a fully functional workflow from the exported JSON.

**Key Challenge**: Nodes are class instances with methods and internal state. We need to serialize only the data needed to reconstruct them, not the instances themselves.

## Goals / Non-Goals

### Goals
- Export complete workflow definition to JSON
- Import JSON to recreate functional workflow
- Preserve all workflow data (nodes, links, settings, staticData, mockData)
- Validate imported data before reconstruction
- Support round-trip export/import without data loss

### Non-Goals
- Binary export format (JSON only for now)
- Incremental export/import (full workflow only)
- Export of execution state (only workflow definition)
- Compression or encryption (can be added later)

## Decisions

### Decision: JSON as Export Format
**What**: Use JSON format for workflow export
**Why**: Human-readable, widely supported, easy to validate and debug
**Alternatives considered**:
- Binary format: Rejected - harder to debug and version control
- YAML: Considered but rejected - JSON is more standard for APIs
- Custom format: Rejected - adds unnecessary complexity

### Decision: Serialize Node Data, Not Instances
**What**: Export node properties, config, and port definitions, but not the node class instances
**Why**: Class instances contain methods and internal state that shouldn't be serialized
**Alternatives considered**:
- Serialize entire instances: Rejected - circular references, methods, and internal state issues
- Export only IDs: Rejected - insufficient to reconstruct workflow

### Decision: Reconstruct Nodes via NodeTypeRegistry
**What**: During import, use nodeTypeRegistry to create node instances from serialized node type information
**Why**: Ensures nodes are properly instantiated with correct types
**Alternatives considered**:
- Direct instantiation: Rejected - requires knowing all node class constructors
- Factory pattern: Considered but nodeTypeRegistry already serves this purpose

### Decision: Export linksBySource Only
**What**: Export only linksBySource, reconstruct linksByTarget during import
**Why**: linksByTarget is derived from linksBySource, no need to export both
**Alternatives considered**:
- Export both: Rejected - redundant data
- Export linksByTarget only: Rejected - linksBySource is the canonical format

### Decision: Include Version in Export Format
**What**: Add version field to export format for future compatibility
**Why**: Allows handling format changes in future versions
**Alternatives considered**:
- No version: Rejected - makes future format changes difficult
- Semantic versioning: Considered but simple integer version is sufficient initially

### Decision: Validate Before Reconstruction
**What**: Validate all imported data before attempting to reconstruct workflow
**Why**: Fail fast with clear error messages rather than partial reconstruction
**Alternatives considered**:
- Validate during reconstruction: Rejected - harder to provide clear error messages
- No validation: Rejected - could lead to corrupted workflows

## Risks / Trade-offs

### Risk: Node Type Mismatch
**Mitigation**: Validate all node types exist in registry before import. Provide clear error if types are missing.

### Risk: Circular References in Static Data
**Mitigation**: Use JSON.stringify which handles circular references (throws error). Document that staticData should not contain circular references.

### Risk: Version Compatibility
**Mitigation**: Include version field. For now, reject imports with different versions. Future: add migration logic.

### Trade-off: Export Execution State
**Decision**: Do not export execution state (node.state, node.error, node.resultData)
**Rationale**: Execution state is transient and should not be persisted. Workflows should start fresh after import.

## Migration Plan
N/A - This is a new feature with no existing workflows to migrate.

## Open Questions
1. Should we export nodeTypeRegistry information? **Decision**: No - registry is environment-specific
2. Should we support partial imports (import nodes only)? **Decision**: No - full workflow only for now
3. How to handle custom node types not in registry? **Decision**: Reject import with clear error message
4. Should mockData be included in export? **Decision**: Yes - it's part of workflow definition for testing

