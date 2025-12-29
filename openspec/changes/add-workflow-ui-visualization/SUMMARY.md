# Summary: Workflow UI Visualization Proposal

## Overview
This proposal adds a React-based visual interface for the workflow engine, enabling users to see workflows, nodes, connections, and execution states in an n8n-style visual editor.

## Key Features

### 1. **Workflow Canvas**
- Main container that renders the entire workflow
- Grid background for visual reference
- SVG overlay for nodes and connections
- Configurable dimensions

### 2. **Node Visualization**
- **Trigger Nodes**: Distinct visual style with blue color scheme
- **Regular Nodes**: Standard style with gray color scheme
- **State Indicators**: Color-coded borders and backgrounds
  - Idle: Gray (#f0f0f0 / #999)
  - Running: Orange (#fff7e6 / #ffa940)
  - Success: Green (#f6ffed / #52c41a)
  - Error: Red (#fff1f0 / #ff4d4f)

### 3. **Port Visualization**
- Input ports on the left side of nodes
- Output ports on the right side of nodes
- Color-coded by data type
- Hover effects with tooltips

### 4. **Connection Visualization**
- Bezier curves connecting nodes
- Arrow indicators at target end
- Color-coded by connection type
- Smooth, n8n-style curves

### 5. **Demo Application**
- Renders the test workflow from `test.ts`
- Shows schedule trigger → HTTP request → JavaScript node
- Demonstrates all visual features

## Technology Stack

```
React 18+ ─┐
           ├─→ Component Architecture
TypeScript ┘

Canvas API ─→ Grid Background

SVG ────────→ Nodes, Ports, Connections

Vite ───────→ Development & Build

CSS Modules ─→ Component Styling
```

## Architecture

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
│   ├── useCanvasTransform.ts
│   └── useNodeLayout.ts
├── utils/
│   ├── bezierCurve.ts
│   ├── nodeLayout.ts
│   └── colorUtils.ts
├── types/
│   └── ui.ts              # UI-specific types
└── demo/
    └── App.tsx            # Demo application
```

## Visual Design

### Node Dimensions
- Width: 240px
- Height: 80px (base) + dynamic
- Border radius: 8px
- Port spacing: 24px

### Port Dimensions
- Radius: 8px
- Hover radius: 12px

### Grid
- Grid size: 20px
- Grid color: #e0e0e0
- Background: #fafafa

## Data Flow

```
Workflow Engine Data (from test.ts)
            ↓
    WorkflowCanvas Component
            ↓
    useWorkflowRenderer Hook
            ↓
        ┌───┴───┐
        ↓       ↓
      Nodes  Connections
        ↓       ↓
      Ports   Bezier Curves
```

## Example: Test Workflow Visualization

The demo will render the workflow from `test.ts`:

```
┌─────────────────────┐
│  Schedule Trigger   │ (Blue border - Trigger node)
│  Every 10 seconds   │
└──────────┬──────────┘
           │ (Bezier curve)
           ↓
┌─────────────────────┐
│  HTTP Request       │ (Gray border - Regular node)
│  GET daum.net/news  │
└──────────┬──────────┘
           │ (Bezier curve)
           ↓
┌─────────────────────┐
│  JavaScript         │ (Gray border - Regular node)
│  Extract text       │
└─────────────────────┘
```

## Type Safety Guarantee

✅ All components have explicit TypeScript types
✅ No `any` or `unknown` types allowed
✅ Strict type checking enabled
✅ All props interfaces defined

Example types:
```typescript
interface UINode {
  id: string
  name: string
  type: string
  position: { x: number; y: number }
  state: NodeState
  inputs: UIPort[]
  outputs: UIPort[]
  isTrigger: boolean
}

interface WorkflowCanvasProps {
  workflow: Workflow
  width?: number
  height?: number
  initialZoom?: number
  initialPan?: { x: number; y: number }
  onNodeClick?: (nodeId: string) => void
}
```

## Implementation Phases

### Phase 1: Core Visualization (This Proposal) ✓
- Set up React + TypeScript + Vite
- Implement all visual components
- Create demo application
- Read-only visualization

### Phase 2: Enhanced Visualization (Future)
- Zoom and pan controls
- Minimap navigation
- Node search and filtering
- Execution state animation

### Phase 3: Interactive Editing (Future)
- Drag-and-drop nodes
- Create/delete connections
- Node creation from palette
- Node configuration panel

## Benefits

1. **Visual Understanding**: Users can see workflow structure at a glance
2. **State Monitoring**: Visual indicators show node execution states
3. **Type Safety**: Full TypeScript type safety prevents runtime errors
4. **Reusability**: Components can be reused in other contexts
5. **n8n-Style**: Familiar visual design for workflow automation users
6. **Separation of Concerns**: UI is separate from workflow engine
7. **Future-Ready**: Architecture supports future interactive features

## Getting Started (After Implementation)

```bash
# Navigate to workflow-ui directory
cd workflow-ui

# Install dependencies
yarn install

# Start demo application
yarn dev

# Build for production
yarn build
```

## Requirements Coverage

✅ Workflow canvas rendering
✅ Node visualization (trigger + regular)
✅ Port visualization (input + output)
✅ Connection visualization (Bezier curves)
✅ Grid background rendering
✅ Node state color coding
✅ TypeScript type safety
✅ Component reusability
✅ Demo application

## Validation Status

```bash
$ openspec validate add-workflow-ui-visualization --strict
✓ Change 'add-workflow-ui-visualization' is valid
```

All requirements have at least one scenario, and the proposal structure is complete.

## Next Steps

1. **Review**: Review this proposal and provide feedback
2. **Approval**: Approve the proposal to proceed with implementation
3. **Implementation**: Follow tasks.md to implement all features
4. **Testing**: Verify all requirements are met
5. **Documentation**: Complete all documentation
6. **Demo**: Test the demo application with the test workflow

## Questions?

Refer to:
- `proposal.md` - High-level overview
- `design.md` - Technical decisions and architecture
- `specs/workflow-ui/spec.md` - Detailed requirements
- `tasks.md` - Implementation checklist

