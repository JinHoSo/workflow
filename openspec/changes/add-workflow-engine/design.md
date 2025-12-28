## Context
We are building a KNIME/n8n-style workflow system where users can visually connect nodes to create data processing pipelines. The system must support:
- Multiple trigger types (manual, scheduled, webhook, socket, etc.)
- Extensible architecture for adding new triggers and node types
- Node-based execution with input/output ports
- Node status tracking (Inactive, Configured, Executed, Error)
- Node actions (Configure, Execute, Cancel, Reset)

**Current Phase**: Frontend-only, TypeScript implementation. No UI, no backend integration.

## Goals / Non-Goals

### Goals
- Type-safe interfaces and protocols for workflow system
- Extensible trigger system that allows easy addition of new trigger types
- Node execution engine that handles sequential and parallel execution
- Clear separation between node types, triggers, and execution logic
- Protocol-based communication between nodes
- State management for nodes and workflows

### Non-Goals
- UI implementation (deferred to later phase)
- Backend integration (deferred to later phase)
- Persistence layer (deferred to later phase)
- Real-time UI updates (deferred to later phase)
- Visual node editor (deferred to later phase)

## Decisions

### Decision: Interface-First Design
**What**: Define all interfaces and protocols before implementation
**Why**: Ensures clear contracts between components and makes the system extensible
**Alternatives considered**:
- Implementation-first: Rejected - would lead to tight coupling and difficult extension
- Code-first with types: Rejected - types would be afterthoughts, reducing type safety

### Decision: Protocol-Based Node Communication
**What**: Nodes communicate through well-defined protocols rather than direct method calls
**Why**: Enables loose coupling, easier testing, and future distributed execution
**Alternatives considered**:
- Direct method calls: Rejected - too tight coupling
- Event bus: Considered but rejected - adds complexity without clear benefit at this stage

### Decision: Trigger as Special Node Type
**What**: Triggers extend the base Node class and are treated as first-class nodes
**Why**: Unified execution model, consistent state management, easier to reason about
**Alternatives considered**:
- Separate trigger system: Rejected - would duplicate state management and execution logic
- Trigger as workflow property: Rejected - limits flexibility (workflows can have multiple triggers)

### Decision: Extensible Trigger Registry
**What**: Use a registry pattern for trigger types, allowing dynamic registration
**Why**: Makes it easy to add new trigger types without modifying core code
**Alternatives considered**:
- Hard-coded trigger types: Rejected - not extensible
- Plugin system: Considered but rejected - overkill for initial phase

### Decision: Execution Engine with Dependency Resolution
**What**: Execution engine resolves node dependencies and executes nodes in correct order
**Why**: Handles complex workflows with multiple paths and parallel execution
**Alternatives considered**:
- Simple sequential execution: Rejected - too limiting for real workflows
- Graph-based execution: Considered but deferred - may be needed later for complex cases

### Decision: Type-Safe Port System
**What**: Ports have types, and connections are validated for type compatibility
**Why**: Prevents runtime errors and provides better developer experience
**Alternatives considered**:
- Untyped ports: Rejected - violates project requirement of no `any`/`unknown`
- Runtime type checking only: Rejected - TypeScript compile-time checking is better

### Decision: BaseNode as Abstract Class
**What**: BaseNode is an abstract class with abstract methods that subclasses must implement
**Why**: Provides common functionality while enforcing that subclasses implement required methods
**Alternatives considered**:
- Interface only: Rejected - would require duplicating common code in every node
- Concrete class with hooks: Considered but rejected - abstract methods are clearer contract

### Decision: JavaScript Execution via Function Constructor
**What**: Use JavaScript's Function constructor to execute user code
**Why**: Simplest approach for initial implementation
**Alternatives considered**:
- VM2 or similar sandbox: Considered but rejected - adds dependency, deferred to security phase
- Separate process: Rejected - too complex for initial phase
- Web Workers: Considered but rejected - adds complexity, not needed for initial phase
- eval(): Considered but Function constructor is safer

**Note**: Security sandboxing will be needed in production but is deferred to a later phase.

### Decision: Manual Trigger as Simple Function Call
**What**: ManualTriggerNode provides a public `execute()` method that can be called programmatically
**Why**: Simplest and most direct way to trigger workflows manually
**Alternatives considered**:
- Event-based: Considered but rejected - adds complexity without clear benefit
- Promise-based: Considered - may be added later if async execution is needed

### Decision: Node Configuration as Key-Value Store
**What**: Each node stores configuration as a typed key-value object
**Why**: Flexible and type-safe with TypeScript generics
**Alternatives considered**:
- Strongly typed config classes: Considered but rejected - too rigid for extensibility
- JSON schema: Considered but rejected - adds validation complexity, deferred

### Decision: Bidirectional Connection Indexing
**What**: Connections are indexed both by source node and destination node
**Why**: Enables efficient lookup in both directions (finding outputs from a node, finding inputs to a node)
**Alternatives considered**:
- Single-direction indexing: Rejected - would require full graph traversal for reverse lookups
- Graph data structure: Considered but rejected - adds complexity, object-based indexing is sufficient

### Decision: Connection Types
**What**: Connections support different types (Main, AI, etc.) to allow multiple data flows
**Why**: Enables complex workflows with multiple parallel data streams
**Alternatives considered**:
- Single connection type: Rejected - too limiting for complex workflows
- Dynamic connection types: Considered but deferred - Main type is sufficient initially

### Decision: Node Execution Data Structure
**What**: Execution data includes json, binary, error, and paired item information
**Why**: Supports all data types needed for workflow execution (structured data, files, errors, lineage)
**Alternatives considered**:
- JSON only: Rejected - doesn't support binary data or errors
- Separate structures: Rejected - unified structure is easier to manage

### Decision: Node Type Registry
**What**: Centralized registry for node types with version support
**Why**: Enables node type discovery, versioning, and validation
**Alternatives considered**:
- Direct imports: Rejected - doesn't support dynamic discovery or versioning
- Plugin system: Considered but rejected - overkill for initial phase

### Decision: Static Data Storage
**What**: Workflow-level static data storage for cross-execution state
**Why**: Needed for features like webhook registration, persistent state
**Alternatives considered**:
- Node-level only: Rejected - some state needs to be workflow-level
- External storage: Considered but deferred - in-memory is sufficient initially

## Risks / Trade-offs

### Risk: Over-Engineering
**Mitigation**: Start with minimal viable interfaces, add complexity only when needed. Focus on core execution first.

### Risk: Protocol Complexity
**Mitigation**: Keep protocols simple initially. Use TypeScript interfaces for compile-time safety, add runtime validation only if needed.

### Risk: Execution Performance
**Mitigation**: Not a concern in initial phase (no real workloads). Can optimize later if needed.

### Trade-off: Synchronous vs Asynchronous Execution
**Decision**: Start with synchronous execution for simplicity. Can add async support later if needed.
**Rationale**: Easier to reason about, debug, and test. Most node operations will be quick in initial phase.

## Migration Plan
N/A - This is a new system with no existing code to migrate.

## Open Questions
1. Should nodes support multiple output ports with different data types? **Decision**: Yes, for flexibility
2. How should errors propagate through the workflow? **Decision**: Error state stops execution, can be configured per node
3. Should workflows support loops/cycles? **Decision**: Deferred - not needed in initial phase
4. How should node configuration be stored? **Decision**: Deferred - no persistence in this phase
5. Should JavaScript execution have access to Node.js APIs? **Decision**: No, browser-compatible JavaScript only initially
6. Should JavaScript execution support async/await? **Decision**: Yes, if execution engine supports async
7. How should JavaScript errors be reported? **Decision**: As node Error state with error message
8. Should manual trigger support passing data at execution time? **Decision**: Yes, via execute() method parameter

