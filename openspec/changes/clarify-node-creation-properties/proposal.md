# Change: Clarify Node Creation Properties

## Why
When creating nodes, developers need clear understanding of:
1. What `nodeType` represents and why it's a string type
2. The default value for `isTrigger` property

Currently, `nodeType` is a string but its purpose and relationship to the node type registry isn't clearly documented. Additionally, `isTrigger` is optional (boolean | undefined), but since regular nodes are more common than trigger nodes, it should default to `false` to reduce boilerplate code.

## What Changes
- **Documentation**: Clarify that `nodeType` is a string identifier used to look up the node type implementation in the NodeTypeRegistry
- **Validation requirement**: Document that `nodeType` MUST be a registered node type name in the NodeTypeRegistry (not arbitrary strings)
- **Class-based nodeType**: Node classes SHALL define their `nodeType` as a static property or constant within the class, and constructors SHALL automatically set `nodeType` from the class definition, preventing user errors and eliminating redundant specification
- **Default value**: Change `isTrigger` to default to `false` when not specified, reducing the need to explicitly set it for regular nodes
- **Type definition**: Update `NodeProperties` interface to make `isTrigger` default to `false` in TypeScript, and make `nodeType` optional in the constructor parameter (but required in the interface after construction)

## Impact
- **Affected specs**: `workflow-nodes` (node properties and creation)
- **Affected code**:
  - `packages/interfaces/src/interfaces/node.ts` - NodeProperties interface
  - `packages/core/src/core/base-node.ts` - BaseNode constructor
  - `packages/core/src/core/base-trigger.ts` - TriggerNodeBase constructor (already sets to true)
  - Documentation files explaining node creation
- **Breaking changes**: None - this is a backward-compatible change that only affects default behavior

