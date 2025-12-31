# Workflow UI Visualization - Change Proposal

## 📋 Quick Overview

This proposal adds a **React-based visual interface** for the workflow engine, enabling users to see workflows, nodes, connections, and execution states in an **n8n-style visual editor**.

## 📁 Proposal Files

| File | Purpose |
|------|---------|
| **proposal.md** | High-level overview: Why, What, Impact |
| **design.md** | Technical decisions, architecture, and trade-offs |
| **tasks.md** | Step-by-step implementation checklist (97 tasks) |
| **specs/workflow-ui/spec.md** | Detailed requirements with scenarios |
| **SUMMARY.md** | Quick reference guide with visual examples |
| **ARCHITECTURE.md** | Diagrams and technical architecture details |

## 🎯 What This Adds

### Visual Components
- ✅ **Workflow Canvas**: Main container with grid background
- ✅ **Node Components**: Trigger nodes and regular nodes
- ✅ **Port Components**: Input and output ports with tooltips
- ✅ **Connection Components**: Bezier curves with arrows
- ✅ **State Visualization**: Color-coded node states

### Technical Features
- ✅ **TypeScript**: Strict type safety (no `any` or `unknown`)
- ✅ **React 18+**: Modern hooks-based architecture
- ✅ **Canvas + SVG**: Hybrid rendering for performance
- ✅ **n8n-Style**: Familiar visual design
- ✅ **Demo App**: Renders test workflow from `test.ts`

## 🚀 Quick Start Guide

### 1. Review the Proposal

```bash
# View the proposal overview
cat openspec/changes/add-workflow-ui-visualization/proposal.md

# View the summary with examples
cat openspec/changes/add-workflow-ui-visualization/SUMMARY.md

# View the architecture diagrams
cat openspec/changes/add-workflow-ui-visualization/ARCHITECTURE.md
```

### 2. Understand the Design

```bash
# Read technical decisions
cat openspec/changes/add-workflow-ui-visualization/design.md

# Review requirements
cat openspec/changes/add-workflow-ui-visualization/specs/workflow-ui/spec.md
```

### 3. Check Implementation Tasks

```bash
# View the task checklist
cat openspec/changes/add-workflow-ui-visualization/tasks.md
```

### 4. Validate the Proposal

```bash
# Run validation
openspec validate add-workflow-ui-visualization --strict
```

## 📊 Proposal Status

```
✅ Proposal created
✅ Design documented
✅ Requirements specified
✅ Tasks defined
✅ Validation passed
⏳ Awaiting approval
```

## 🎨 Visual Preview

### Test Workflow Visualization

The demo will render this workflow from `test.ts`:

```
┌─────────────────────────────────┐
│     Schedule Trigger            │  ← Blue border (Trigger)
│     Every 10 seconds            │
│  ○                          ○   │  ← Ports
└─────────────────┬───────────────┘
                  │
                  │ Bezier curve
                  ↓
┌─────────────────────────────────┐
│     HTTP Request Node           │  ← Gray border (Regular)
│     GET daum.net/news           │
│  ○                          ○   │
└─────────────────┬───────────────┘
                  │
                  │ Bezier curve
                  ↓
┌─────────────────────────────────┐
│     JavaScript Node             │  ← Gray border (Regular)
│     Extract text from HTML      │
│  ○                          ○   │
└─────────────────────────────────┘
```

### Node States

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Idle      │  │  Running    │  │  Success    │  │   Error     │
│   Gray      │  │  Orange     │  │   Green     │  │    Red      │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

## 🏗️ Architecture Overview

```
workflow-ui/
├── components/
│   ├── WorkflowCanvas/    # Main container
│   ├── Node/              # Node rendering
│   ├── Port/              # Port rendering
│   ├── Connection/        # Connection lines
│   └── Grid/              # Background grid
├── hooks/
│   ├── useWorkflowRenderer.ts
│   └── useNodeLayout.ts
├── utils/
│   ├── bezierCurve.ts
│   ├── nodeLayout.ts
│   └── colorUtils.ts
├── types/
│   └── ui.ts
└── demo/
    └── App.tsx
```

## 📦 Technology Stack

- **React 18+**: Component architecture
- **TypeScript 5+**: Strict type safety
- **Vite**: Fast development and build
- **Canvas API**: Grid background rendering
- **SVG**: Node and connection rendering
- **CSS Modules**: Component styling

## 🎯 Requirements Summary

| Category | Requirements |
|----------|-------------|
| Canvas | Workflow canvas rendering, dimensions, layout |
| Nodes | Trigger nodes, regular nodes, state visualization |
| Ports | Input ports, output ports, hover effects |
| Connections | Bezier curves, arrows, multiple connections |
| Grid | Background grid with proper spacing |
| Types | Strict TypeScript, no `any`/`unknown` |
| Demo | Application rendering test workflow |

**Total**: 10 major requirements with 24 scenarios

## 📝 Implementation Checklist

- [ ] 1. Project Setup (7 tasks)
- [ ] 2. Type Definitions (5 tasks)
- [ ] 3. Utility Functions (5 tasks)
- [ ] 4. Grid Background Component (5 tasks)
- [ ] 5. Port Components (8 tasks)
- [ ] 6. Connection Component (6 tasks)
- [ ] 7. Node Components (10 tasks)
- [ ] 8. Workflow Canvas Component (10 tasks)
- [ ] 9. Custom Hooks (3 tasks)
- [ ] 10. Demo Application (7 tasks)
- [ ] 11. Styling and Visual Polish (6 tasks)
- [ ] 12. Documentation (6 tasks)
- [ ] 13. Testing and Validation (10 tasks)
- [ ] 14. Integration (4 tasks)
- [ ] 15. Final Review (5 tasks)

**Total**: 97 tasks across 15 sections

## 🔍 Key Design Decisions

### 1. Canvas + SVG Hybrid
- **Canvas**: Grid background (static, performant)
- **SVG**: Nodes and connections (interactive, precise)

### 2. Read-Only First
- Focus on visualization in Phase 1
- Interactive editing in future phases

### 3. n8n-Style Design
- Familiar visual language for workflow users
- Proven UX patterns

### 4. Type Safety
- No `any` or `unknown` types
- Explicit interfaces for all components

### 5. Component Architecture
- Reusable, composable components
- Clear separation of concerns

## 🚦 Next Steps

### For Reviewers
1. Read `SUMMARY.md` for quick overview
2. Review `design.md` for technical decisions
3. Check `specs/workflow-ui/spec.md` for requirements
4. Provide feedback or approve

### For Implementers
1. Wait for proposal approval
2. Follow `tasks.md` sequentially
3. Validate each section before moving on
4. Update task checklist as you progress

## ❓ FAQ

### Q: Why not use a library like React Flow?
**A**: Custom implementation provides full control over n8n-style design and better learning opportunity.

### Q: Why Canvas + SVG instead of pure Canvas?
**A**: SVG provides better precision for interactive elements (future) while Canvas offers performance for static background.

### Q: Will this break existing workflow engine code?
**A**: No, the UI is a separate package with no impact on the workflow engine.

### Q: Can I use this without the demo?
**A**: Yes, all components are reusable and can be integrated into any React application.

### Q: What browsers are supported?
**A**: Modern browsers (Chrome, Firefox, Safari, Edge) with Canvas and SVG support.

## 📚 Additional Resources

- **OpenSpec Docs**: `openspec/AGENTS.md`
- **Project Context**: `openspec/project.md`
- **Workflow Engine**: `src/core/workflow.ts`
- **Test Workflow**: `test.ts`

## ✅ Validation

```bash
$ openspec validate add-workflow-ui-visualization --strict
✓ Change 'add-workflow-ui-visualization' is valid
```

All requirements have scenarios, proposal structure is complete, and validation passes.

## 📞 Contact

For questions or feedback about this proposal:
1. Review the proposal files
2. Check existing requirements in `specs/workflow-ui/spec.md`
3. Refer to design decisions in `design.md`
4. Open a discussion if needed

---

**Status**: ✅ Ready for Review
**Validation**: ✅ Passed
**Tasks**: 97 tasks defined
**Requirements**: 10 requirements with 24 scenarios


