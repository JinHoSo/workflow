# Design: React-based Workflow UI Visualization

## Context
The workflow engine is a TypeScript-based system that manages nodes, connections, and execution flow. Currently, there is no visual representation of workflows. This design adds a React-based UI layer that visualizes workflow structures using Canvas and SVG, inspired by n8n's visual design.

The UI will be read-only in this phase, focusing on visualization rather than editing. The goal is to provide a clear, intuitive view of workflow structure, node states, and connections.

## Goals / Non-Goals

### Goals
- Provide visual representation of workflows using React, Canvas, and SVG
- Render all workflow elements: nodes, ports, connections, and workflow canvas
- Support n8n-style visual design (rounded nodes, Bezier curve connections, port indicators)
- Display node states visually (idle, running, success, error)
- Distinguish between trigger nodes and regular nodes visually
- Create reusable, well-typed React components
- Ensure proper TypeScript type safety (no `any` or `unknown`)
- Support responsive canvas rendering with zoom and pan capabilities
- Provide a demo application that renders the test workflow

### Non-Goals
- Interactive editing (drag-and-drop, node creation, connection editing)
- Workflow execution controls (start, stop, pause)
- Node configuration UI
- Real-time execution visualization (will be added in future phase)
- Backend API integration (UI consumes workflow data structures directly)
- Authentication or user management

## Decisions

### Technology Stack
- **React 18+**: Modern React with hooks for component architecture
- **TypeScript**: Strict type safety, no `any` or `unknown` types
- **Canvas API**: For rendering the workflow canvas background and grid
- **SVG**: For rendering nodes, ports, and connections (better for interactive elements in future)
- **CSS Modules or Styled Components**: For component styling
- **Vite**: Fast development server and build tool (aligns with Next.js ecosystem)

**Rationale**: React provides component reusability, Canvas offers performance for background rendering, and SVG provides precision for node and connection rendering. This combination is proven in n8n and similar workflow tools.

### Architecture Pattern

```
workflow-ui/
├── src/
│   ├── components/
│   │   ├── WorkflowCanvas/          # Main canvas container
│   │   │   ├── WorkflowCanvas.tsx
│   │   │   ├── WorkflowCanvas.module.css
│   │   │   └── types.ts
│   │   ├── Node/                     # Node component
│   │   │   ├── Node.tsx
│   │   │   ├── TriggerNode.tsx
│   │   │   ├── RegularNode.tsx
│   │   │   ├── Node.module.css
│   │   │   └── types.ts
│   │   ├── Port/                     # Port component
│   │   │   ├── InputPort.tsx
│   │   │   ├── OutputPort.tsx
│   │   │   ├── Port.module.css
│   │   │   └── types.ts
│   │   ├── Connection/               # Connection lines
│   │   │   ├── Connection.tsx
│   │   │   ├── Connection.module.css
│   │   │   └── types.ts
│   │   └── Grid/                     # Canvas grid background
│   │       ├── Grid.tsx
│   │       └── Grid.module.css
│   ├── hooks/
│   │   ├── useWorkflowRenderer.ts    # Main rendering logic
│   │   ├── useCanvasTransform.ts     # Zoom/pan logic
│   │   └── useNodeLayout.ts          # Node positioning
│   ├── utils/
│   │   ├── bezierCurve.ts            # Bezier curve calculations
│   │   ├── nodeLayout.ts             # Layout calculations
│   │   └── colorUtils.ts             # Color utilities
│   ├── types/
│   │   ├── ui.ts                     # UI-specific types
│   │   └── index.ts
│   └── demo/
│       ├── App.tsx                   # Demo application
│       └── main.tsx                  # Entry point
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Component Design

#### WorkflowCanvas
- Main container component that renders the entire workflow
- Manages canvas transformation (zoom, pan)
- Renders grid background using Canvas
- Renders nodes and connections using SVG overlay
- Props: `workflow`, `width`, `height`, `initialZoom`, `initialPan`

#### Node Components
- **TriggerNode**: Visual representation of trigger nodes
  - Distinct visual style (e.g., different border, icon)
  - Shows trigger type (schedule, manual, webhook)
- **RegularNode**: Visual representation of regular nodes
  - Shows node type icon
  - Displays node name
  - Shows execution state (color-coded border/background)
- Common features:
  - Rounded rectangle shape (n8n style)
  - Input ports on the left
  - Output ports on the right
  - Node state indicator (color, icon)

#### Port Components
- **InputPort**: Visual representation of input ports
  - Circle indicator on the left side of nodes
  - Color-coded by data type
  - Shows port name on hover
- **OutputPort**: Visual representation of output ports
  - Circle indicator on the right side of nodes
  - Color-coded by data type
  - Shows port name on hover

#### Connection Component
- Renders Bezier curves connecting output ports to input ports
- Color-coded by connection type (Standard, Alternative)
- Smooth curves following n8n style
- Arrow indicator at the target end

### Visual Design Specifications

#### Node Dimensions
- Width: 240px
- Height: 80px (base) + dynamic height based on ports
- Border radius: 8px
- Padding: 16px
- Port spacing: 24px vertical

#### Port Dimensions
- Radius: 8px
- Hover radius: 12px
- Offset from node edge: 0px (centered on border)

#### Colors (n8n-inspired)
- **Node States**:
  - Idle: `#f0f0f0` background, `#999` border
  - Running: `#fff7e6` background, `#ffa940` border
  - Success: `#f6ffed` background, `#52c41a` border
  - Error: `#fff1f0` background, `#ff4d4f` border
- **Trigger Nodes**: `#e6f7ff` background, `#1890ff` border
- **Connections**: `#999` (Standard), `#1890ff` (Alternative)
- **Ports**: Color-coded by data type
  - Default: `#999`
  - Main: `#1890ff`
  - Alternative: `#52c41a`

#### Grid
- Grid size: 20px
- Grid color: `#e0e0e0`
- Background: `#fafafa`

### Data Flow

```
Workflow Engine Data
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

1. Workflow data (from workflow engine) is passed to `WorkflowCanvas`
2. `useWorkflowRenderer` hook processes workflow data and generates render data
3. Components render visual elements based on processed data
4. Canvas renders grid background
5. SVG overlay renders nodes, ports, and connections

### Type Safety

All components will have explicit TypeScript types:

```typescript
// UI-specific types
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

interface UIPort {
  id: string
  name: string
  dataType: string
  linkType: LinkType
  position: { x: number; y: number }
}

interface UIConnection {
  id: string
  sourceNode: string
  sourcePort: string
  targetNode: string
  targetPort: string
  linkType: LinkType
  path: string // SVG path data
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

### Alternatives Considered

#### Alternative 1: Pure Canvas Rendering
- **Pros**: Better performance for large workflows
- **Cons**: More complex interaction handling, harder to maintain
- **Decision**: Rejected - SVG provides better precision and easier future interactivity

#### Alternative 2: Third-party Libraries (React Flow, React Diagram)
- **Pros**: Faster initial development, proven solutions
- **Cons**: Less control over styling, potential overhead, learning curve
- **Decision**: Rejected - Custom implementation provides full control and aligns with n8n style

#### Alternative 3: HTML Canvas + WebGL
- **Pros**: Maximum performance
- **Cons**: Overkill for current requirements, complex implementation
- **Decision**: Rejected - Canvas + SVG hybrid is sufficient for current needs

## Risks / Trade-offs

### Risk: Performance with Large Workflows
- **Impact**: Rendering hundreds of nodes may cause performance issues
- **Mitigation**:
  - Implement virtualization for large workflows (future)
  - Use Canvas for static elements (grid)
  - Optimize SVG rendering with memoization
  - Add performance monitoring

### Risk: Browser Compatibility
- **Impact**: Older browsers may not support modern Canvas/SVG features
- **Mitigation**:
  - Target modern browsers (Chrome, Firefox, Safari, Edge)
  - Document browser requirements
  - Use feature detection where necessary

### Trade-off: Custom Implementation vs Library
- **Trade-off**: More development time vs full control
- **Decision**: Accept longer development time for better alignment with requirements and n8n style
- **Justification**: Custom implementation provides learning opportunity and full control over visual design

### Trade-off: Canvas vs SVG for Nodes
- **Trade-off**: Performance vs precision and interactivity
- **Decision**: Use SVG for nodes and connections, Canvas for grid
- **Justification**: SVG provides better precision for interactive elements (future), Canvas provides performance for static background

## Migration Plan

### Phase 1: Core Visualization (This Change)
1. Set up React + TypeScript + Vite project structure
2. Implement basic WorkflowCanvas component
3. Implement Node components (Trigger and Regular)
4. Implement Port components
5. Implement Connection component with Bezier curves
6. Implement Grid background
7. Create demo application rendering test workflow
8. Add comprehensive documentation

### Phase 2: Enhanced Visualization (Future)
- Add zoom and pan controls
- Add minimap for navigation
- Add node search and filtering
- Add execution state animation

### Phase 3: Interactive Editing (Future)
- Add drag-and-drop for nodes
- Add connection creation/deletion
- Add node creation from palette
- Add node configuration panel

### Rollback Plan
- UI is a separate package with no impact on workflow engine
- Can be removed or disabled without affecting core functionality
- No database or state migrations required

## Open Questions

1. **Q**: Should the UI package be a separate npm package or part of the monorepo?
   - **A**: Keep it in the same repository as a separate directory (`workflow-ui/`) for now. Can be extracted to a separate package later if needed.

2. **Q**: Should we support dark mode in the initial implementation?
   - **A**: No, focus on light mode first. Dark mode can be added in a future iteration.

3. **Q**: What level of zoom should be supported?
   - **A**: 25% to 200% zoom range is sufficient for most use cases.

4. **Q**: Should we implement keyboard shortcuts in this phase?
   - **A**: No, focus on visual rendering first. Keyboard shortcuts can be added with interactive editing.

5. **Q**: How should we handle very long node names?
   - **A**: Truncate with ellipsis and show full name on hover tooltip.


