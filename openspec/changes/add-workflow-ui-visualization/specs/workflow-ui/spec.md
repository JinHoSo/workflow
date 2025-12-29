# Specification: Workflow UI Visualization

## ADDED Requirements

### Requirement: Workflow Canvas Rendering
The system SHALL provide a React-based canvas component that renders a complete workflow visualization including nodes, connections, ports, and grid background.

#### Scenario: Render workflow with nodes and connections
- **WHEN** a workflow with multiple nodes and connections is provided to the WorkflowCanvas component
- **THEN** the canvas SHALL render all nodes at their specified positions
- **AND** the canvas SHALL render all connections between nodes as Bezier curves
- **AND** the canvas SHALL render a grid background
- **AND** all visual elements SHALL be properly positioned and scaled

#### Scenario: Render empty workflow
- **WHEN** an empty workflow (no nodes) is provided to the WorkflowCanvas component
- **THEN** the canvas SHALL render only the grid background
- **AND** no nodes or connections SHALL be displayed

#### Scenario: Render workflow with disconnected nodes
- **WHEN** a workflow with nodes but no connections is provided
- **THEN** the canvas SHALL render all nodes at their specified positions
- **AND** no connection lines SHALL be displayed

### Requirement: Node Visualization
The system SHALL provide distinct visual representations for trigger nodes and regular nodes with proper styling and state indicators.

#### Scenario: Render trigger node
- **WHEN** a trigger node is rendered
- **THEN** the node SHALL display with trigger-specific styling (distinct background color and border)
- **AND** the node SHALL show the trigger type icon
- **AND** the node SHALL display the node name
- **AND** the node SHALL show input and output ports at correct positions

#### Scenario: Render regular node
- **WHEN** a regular node is rendered
- **THEN** the node SHALL display with regular node styling
- **AND** the node SHALL show the node type icon
- **AND** the node SHALL display the node name
- **AND** the node SHALL show input and output ports at correct positions

#### Scenario: Display node execution state
- **WHEN** a node with a specific execution state (idle, running, success, error) is rendered
- **THEN** the node SHALL display visual indicators matching the state
- **AND** the node border color SHALL match the state color
- **AND** the node background color SHALL match the state color (lighter shade)

#### Scenario: Render node with multiple ports
- **WHEN** a node with multiple input and output ports is rendered
- **THEN** all input ports SHALL be displayed on the left side of the node
- **AND** all output ports SHALL be displayed on the right side of the node
- **AND** ports SHALL be evenly spaced vertically
- **AND** the node height SHALL adjust to accommodate all ports

### Requirement: Port Visualization
The system SHALL provide visual representations for input and output ports with proper positioning and styling.

#### Scenario: Render input port
- **WHEN** an input port is rendered
- **THEN** the port SHALL display as a circle on the left edge of the node
- **AND** the port SHALL be color-coded based on its data type
- **AND** the port SHALL be positioned at the correct vertical offset

#### Scenario: Render output port
- **WHEN** an output port is rendered
- **THEN** the port SHALL display as a circle on the right edge of the node
- **AND** the port SHALL be color-coded based on its data type
- **AND** the port SHALL be positioned at the correct vertical offset

#### Scenario: Display port on hover
- **WHEN** a user hovers over a port
- **THEN** the port SHALL increase in size (hover state)
- **AND** a tooltip SHALL display showing the port name and data type

### Requirement: Connection Visualization
The system SHALL render connections between nodes as Bezier curves with proper styling and directionality.

#### Scenario: Render connection between nodes
- **WHEN** a connection between two nodes is rendered
- **THEN** the connection SHALL display as a smooth Bezier curve
- **AND** the curve SHALL start from the source node's output port
- **AND** the curve SHALL end at the target node's input port
- **AND** the curve SHALL be color-coded based on the connection type

#### Scenario: Render connection with arrow indicator
- **WHEN** a connection is rendered
- **THEN** an arrow indicator SHALL be displayed at the target end of the connection
- **AND** the arrow SHALL point toward the target node

#### Scenario: Render multiple connections from same output
- **WHEN** a single output port has multiple connections to different nodes
- **THEN** each connection SHALL be rendered as a separate Bezier curve
- **AND** all curves SHALL start from the same output port
- **AND** each curve SHALL end at its respective target input port

### Requirement: Grid Background Rendering
The system SHALL render a grid background on the canvas to provide visual reference for node positioning.

#### Scenario: Render grid background
- **WHEN** the workflow canvas is rendered
- **THEN** a grid SHALL be displayed as the background
- **AND** the grid SHALL have consistent spacing (20px)
- **AND** the grid SHALL use subtle coloring to avoid visual clutter
- **AND** the grid SHALL extend across the entire canvas area

### Requirement: Canvas Dimensions and Layout
The system SHALL support configurable canvas dimensions and proper layout of all visual elements.

#### Scenario: Render canvas with custom dimensions
- **WHEN** custom width and height are provided to the WorkflowCanvas component
- **THEN** the canvas SHALL render with the specified dimensions
- **AND** all visual elements SHALL be properly contained within the canvas bounds

#### Scenario: Render canvas with default dimensions
- **WHEN** no dimensions are provided to the WorkflowCanvas component
- **THEN** the canvas SHALL render with default dimensions (800x600)
- **AND** all visual elements SHALL be properly displayed

### Requirement: Node State Color Coding
The system SHALL use distinct colors to represent different node execution states.

#### Scenario: Display idle node state
- **WHEN** a node in idle state is rendered
- **THEN** the node SHALL use gray color scheme (background: #f0f0f0, border: #999)

#### Scenario: Display running node state
- **WHEN** a node in running state is rendered
- **THEN** the node SHALL use orange color scheme (background: #fff7e6, border: #ffa940)

#### Scenario: Display success node state
- **WHEN** a node in success state is rendered
- **THEN** the node SHALL use green color scheme (background: #f6ffed, border: #52c41a)

#### Scenario: Display error node state
- **WHEN** a node in error state is rendered
- **THEN** the node SHALL use red color scheme (background: #fff1f0, border: #ff4d4f)

### Requirement: TypeScript Type Safety
The system SHALL enforce strict TypeScript type safety for all UI components and data structures.

#### Scenario: All components have explicit types
- **WHEN** any UI component is implemented
- **THEN** all props SHALL have explicit TypeScript interfaces
- **AND** all internal state SHALL have explicit types
- **AND** no `any` or `unknown` types SHALL be used

#### Scenario: UI data structures are properly typed
- **WHEN** workflow data is transformed for UI rendering
- **THEN** all UI-specific data structures (UINode, UIPort, UIConnection) SHALL have explicit interfaces
- **AND** all type conversions SHALL be type-safe

### Requirement: Component Reusability
The system SHALL provide reusable React components that can be composed to build the workflow visualization.

#### Scenario: Components are independently usable
- **WHEN** any UI component (Node, Port, Connection, Grid) is used
- **THEN** the component SHALL function independently with its own props
- **AND** the component SHALL not have hard dependencies on other components
- **AND** the component SHALL be properly documented with prop types

### Requirement: Demo Application
The system SHALL provide a demo application that renders the test workflow from test.ts.

#### Scenario: Demo application renders test workflow
- **WHEN** the demo application is launched
- **THEN** the application SHALL render the news collection workflow from test.ts
- **AND** the workflow SHALL display the schedule trigger node
- **AND** the workflow SHALL display the HTTP request node
- **AND** the workflow SHALL display the JavaScript node
- **AND** all connections between nodes SHALL be visible
- **AND** the visualization SHALL match the workflow structure

#### Scenario: Demo application is accessible
- **WHEN** a developer runs the demo application
- **THEN** the application SHALL start on a local development server
- **AND** the application SHALL be accessible via browser
- **AND** the application SHALL display without errors

