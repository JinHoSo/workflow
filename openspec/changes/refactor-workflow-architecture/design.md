# Design: Workflow Architecture Refactoring

## Context

The current workflow system has grown organically and now faces architectural limitations that prevent enterprise-grade extensibility. This design addresses these limitations through systematic refactoring while maintaining backward compatibility where possible.

**Current State**:
- Nodes and triggers stored separately (`workflow.nodes` vs `workflow.triggers`)
- Triggers extend BaseNode but override `run()` to throw (code smell)
- Simple queue-based execution without DAG resolution
- String-based type checking without schema validation
- No plugin system or dynamic loading
- Protocols defined but not consistently used

**Target State**:
- Unified node model where triggers are first-class nodes
- Proper DAG-based execution with parallel processing
- Schema-based validation and type system
- Plugin architecture for dynamic extensibility
- Fully implemented protocol system
- Centralized state management

## Goals / Non-Goals

### Goals
- **Unified Node Model**: All nodes (including triggers) follow the same execution model
- **Proper DAG Execution**: Topological sorting and parallel execution of independent nodes
- **Type Safety**: Schema-based validation for configurations and data flow
- **Plugin System**: Dynamic loading and registration of node types
- **Protocol Compliance**: Consistent use of execution, data flow, and error handling protocols
- **State Management**: Centralized execution state with persistence support
- **Extensibility**: Easy addition of new node types without core modifications

### Non-Goals
- UI changes (deferred to separate change)
- Backend persistence layer (deferred to separate change)
- Real-time collaboration (deferred to separate change)
- Workflow versioning/migration (deferred to separate change)
- Performance optimizations beyond parallel execution (deferred to separate change)

## Decisions

### Decision: Unified Node Model
**What**: Triggers are treated as regular nodes with a special `isTrigger` flag. All nodes stored in single collection.

**Why**:
- Eliminates code duplication and inconsistent patterns
- Triggers can participate in normal node execution flow
- Simplifies workflow management and serialization
- Makes triggers extensible like regular nodes

**Alternatives considered**:
- Keep separate storage: Rejected - creates complexity and inconsistency
- Make triggers completely separate: Rejected - loses benefits of node abstraction

**Implementation**:
- Add `isTrigger: boolean` property to NodeProperties
- Remove separate `workflow.triggers` collection
- Update TriggerNodeBase to work within unified model
- Migration: Existing triggers automatically marked with `isTrigger: true`

### Decision: DAG-Based Execution with Topological Sorting
**What**: Execution engine uses topological sort to determine execution order, enables parallel execution of independent nodes.

**Why**:
- Proper dependency resolution for complex workflows
- Performance improvement through parallelization
- Foundation for future optimizations (caching, incremental execution)

**Alternatives considered**:
- Keep queue-based approach: Rejected - doesn't handle complex DAGs properly
- Full parallel execution: Rejected - too complex, may cause resource issues

**Implementation**:
- Use topological sort algorithm (Kahn's algorithm) to determine execution order
- Group nodes by dependency level for parallel execution
- Maintain execution state for each node independently
- Support sequential fallback for nodes that can't run in parallel

### Decision: Schema-Based Configuration Validation
**What**: NodeConfiguration uses JSON Schema for validation, each node type defines its configuration schema.

**Why**:
- Type safety at configuration time
- Clear documentation of valid configurations
- Enables UI generation from schemas
- Prevents runtime configuration errors

**Alternatives considered**:
- Keep loose typing: Rejected - too error-prone
- TypeScript-only types: Rejected - doesn't help runtime validation
- Custom validation DSL: Rejected - JSON Schema is standard and well-supported

**Implementation**:
- Define JSON Schema for each node type's configuration
- Validate on `setup()` using schema
- Provide TypeScript types generated from schemas
- Support schema versioning for node type versions

### Decision: Plugin Architecture with Dynamic Loading
**What**: Node types can be loaded dynamically from plugins, registered at runtime.

**Why**:
- Enables third-party node development
- Supports node marketplace concept
- Allows hot-reloading of node types during development
- Separates core from extensions

**Alternatives considered**:
- Static registration only: Rejected - too limiting for extensibility
- Full plugin system with sandboxing: Rejected - too complex for initial implementation

**Implementation**:
- Plugin interface for node type packages
- Plugin registry for loading and managing plugins
- Node type factory pattern for instantiation
- Support for plugin metadata (version, dependencies, etc.)

### Decision: Protocol-First Implementation
**What**: All node communication goes through well-defined protocols (execution, data flow, error handling).

**Why**:
- Loose coupling between components
- Easier testing and mocking
- Foundation for distributed execution
- Clear contracts between system parts

**Alternatives considered**:
- Direct method calls: Rejected - too tight coupling
- Event bus: Considered but rejected - adds complexity without clear benefit at this stage

**Implementation**:
- Implement ExecutionProtocol for all node execution
- Implement DataFlowProtocol for all data passing
- Implement ErrorHandlingProtocol for error management
- Update all nodes to use protocols consistently

### Decision: Centralized Execution State
**What**: Execution state managed centrally in ExecutionEngine, supports persistence hooks.

**Why**:
- Single source of truth for execution state
- Enables state persistence and recovery
- Better debugging and monitoring
- Foundation for workflow resumption

**Alternatives considered**:
- Keep state in nodes: Rejected - harder to manage and persist
- External state service: Rejected - too complex for initial implementation

**Implementation**:
- ExecutionState interface for centralized state
- State persistence hooks (implemented by consumers)
- State recovery mechanisms
- State query API for monitoring

## Risks / Trade-offs

### Risk: Breaking Changes
**Mitigation**:
- Provide migration utilities for existing workflows
- Maintain backward compatibility layer where possible
- Clear documentation of breaking changes
- Version workflow export format

### Risk: Performance Impact
**Mitigation**:
- Benchmark execution engine changes
- Optimize topological sort algorithm
- Profile parallel execution overhead
- Provide sequential execution fallback

### Risk: Plugin System Complexity
**Mitigation**:
- Start with simple plugin interface
- Provide clear plugin development guidelines
- Extensive testing of plugin loading
- Plugin validation and sandboxing (future)

### Risk: Schema Validation Overhead
**Mitigation**:
- Cache compiled schemas
- Validate only on configuration changes
- Provide schema validation bypass for trusted code
- Optimize validation library usage

## Migration Plan

### Phase 1: Unified Node Model
1. Add `isTrigger` flag to NodeProperties
2. Update Workflow to use unified node collection
3. Migrate existing triggers to unified model
4. Update serialization/deserialization
5. Update all workflow operations

### Phase 2: Execution Engine Improvements
1. Implement topological sort algorithm
2. Add parallel execution support
3. Update ExecutionEngine to use new approach
4. Add retry and error recovery mechanisms
5. Update tests and benchmarks

### Phase 3: Schema System
1. Define schema interface
2. Create schema for existing node types
3. Implement schema validation
4. Update node setup() methods
5. Generate TypeScript types from schemas

### Phase 4: Plugin System
1. Define plugin interface
2. Implement plugin registry
3. Create plugin loading mechanism
4. Update node type registry to use plugins
5. Document plugin development

### Phase 5: Protocol Implementation
1. Fully implement ExecutionProtocol
2. Fully implement DataFlowProtocol
3. Fully implement ErrorHandlingProtocol
4. Update all nodes to use protocols
5. Remove direct method calls

### Phase 6: State Management
1. Define centralized state interface
2. Implement state management in ExecutionEngine
3. Add state persistence hooks
4. Implement state recovery
5. Add state query API

## Testing Strategy

### Test Suite Refactoring Approach
Given the significant architectural changes, the existing test suite will be comprehensively refactored:

1. **Delete and Rewrite**: Existing tests that don't align with the new architecture will be deleted and rewritten from scratch. This ensures tests accurately reflect the new architecture rather than patching old tests.

2. **Test Structure**: Tests will be organized by architectural component:
   - Unified node model tests
   - DAG execution tests
   - Parallel execution tests
   - Schema validation tests
   - Plugin system tests
   - Protocol implementation tests
   - State management tests

3. **Test Coverage**: Aim for 100% coverage of new architecture components, with comprehensive integration tests for all major workflows.

4. **Performance Testing**: Benchmark new execution engine against old approach to validate performance improvements.

### Test Migration Plan
- Phase 1: Identify which existing tests are still valid vs need complete rewrite
- Phase 2: Delete outdated tests
- Phase 3: Write new tests aligned with new architecture
- Phase 4: Add comprehensive integration and stress tests
- Phase 5: Performance benchmarking

## Open Questions

1. **Plugin Sandboxing**: Should plugins run in isolated contexts? (Deferred - future enhancement)
2. **State Persistence Format**: What format for persisted state? (JSON initially, may change)
3. **Schema Versioning**: How to handle schema changes across node versions? (Use semantic versioning)
4. **Parallel Execution Limits**: Should there be limits on concurrent node execution? (Configurable, default: unlimited)
5. **Protocol Performance**: Will protocol overhead be acceptable? (Benchmark and optimize)
6. **Test Migration Timeline**: Should test refactoring happen incrementally or all at once? (All at once for cleaner architecture alignment)

