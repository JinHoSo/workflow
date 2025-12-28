# Change: Add Workflow Engine Foundation

## Why
We need to build a KNIME/n8n-style workflow system that allows users to create visual workflows by connecting nodes. The system must support multiple trigger types (manual, scheduled, webhook, socket, etc.) and provide a flexible, extensible architecture for adding new trigger types and node types. This change establishes the TypeScript foundation for the workflow engine, focusing on interfaces, protocols, and execution logic before UI implementation.

## What Changes
- **ADDED**: Core workflow execution engine with support for multiple trigger types
- **ADDED**: Node system with input/output ports, status management, and action handlers
- **ADDED**: BaseNode class that serves as the parent class for all node implementations
- **ADDED**: JavaScriptExecutionNode that can execute JavaScript code with access to input data
- **ADDED**: ManualTriggerNode that allows manual workflow execution via function call
- **ADDED**: Extensible trigger system architecture allowing easy addition of new trigger types
- **ADDED**: Workflow state management for tracking node execution status
- **ADDED**: Type-safe interfaces and protocols for node communication
- **ADDED**: Execution engine that can handle sequential and parallel node execution

**Note**: UI implementation is explicitly deferred to a later phase. This change focuses solely on TypeScript interfaces, protocols, and execution logic. Only BaseNode, JavaScriptExecutionNode, and ManualTriggerNode are implemented in this phase. Other node types (CSV loader, HTTP request, if-else, Jira API, Google API, AI nodes, etc.) are deferred to future changes.

## Impact
- **Affected specs**:
  - `workflow-core` (new capability)
  - `workflow-nodes` (new capability - includes BaseNode implementation)
  - `workflow-triggers` (new capability - includes ManualTriggerNode implementation)
  - `workflow-node-types` (new capability - JavaScriptExecutionNode)
  - `workflow-state` (new capability)
  - `workflow-data` (new capability - execution data structures and data flow)
- **Affected code**:
  - New TypeScript modules for workflow engine
  - BaseNode, JavaScriptExecutionNode, ManualTriggerNode implementations
  - JavaScript code execution engine integration
  - No UI code in this phase
  - No backend integration in this phase

