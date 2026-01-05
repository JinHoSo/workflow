# Workflow Diagrams

Visual representations of common workflow patterns and execution flows.

## Linear Workflow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Trigger │────▶│ Node 1  │────▶│ Node 2  │────▶│ Node 3  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
```

Simple sequential execution where each node depends on the previous one.

## Parallel Execution

```
                ┌─────────┐
                │ Node 1  │
                └────┬────┘
                     │
┌─────────┐     ┌────┴────┐     ┌─────────┐
│ Trigger │────▶│ Node 2  │────▶│ Node 4  │
└─────────┘     └────┬────┘     └─────────┘
                ┌────┴────┐
                │ Node 3  │
                └─────────┘
```

Independent nodes execute in parallel, then results are combined.

## Conditional Execution

```
┌─────────┐     ┌──────────────┐
│ Trigger │────▶│ Condition   │
└─────────┘     │   Node       │
                └──────┬───────┘
                       │
            ┌──────────┴──────────┐
            │                      │
      ┌─────▼─────┐        ┌──────▼──────┐
      │ Branch A  │        │  Branch B   │
      │  Node A   │        │   Node B    │
      └───────────┘        └─────────────┘
```

Different execution paths based on conditions.

## Error Handling Pattern

```
┌─────────┐     ┌─────────┐     ┌──────────────┐
│ Trigger │────▶│ Node 1  │────▶│ Node 2       │
└─────────┘     └────┬────┘     │              │
                     │          │  ┌─────────┐ │
                     │          └─▶│ Success │ │
                     │             └─────────┘ │
                     │                          │
                     │          ┌──────────────┐ │
                     └─────────▶│ Error       │ │
                                │ Handler     │ │
                                └─────────────┘ │
```

Error handling with dedicated error paths.

## Fan-Out / Fan-In

```
┌─────────┐     ┌──────────────┐
│ Trigger │────▶│ Distributor  │
└─────────┘     └──────┬───────┘
                       │
            ┌──────────┼──────────┐
            │          │          │
      ┌─────▼─────┐ ┌─▼─────┐ ┌──▼──────┐
      │ Worker 1  │ │Worker2│ │ Worker3 │
      └─────┬─────┘ └─┬─────┘ └──┬──────┘
            │         │          │
            └─────────┼──────────┘
                      │
                ┌─────▼─────┐
                │ Collector │
                └───────────┘
```

Distribute work across multiple workers and collect results.

## Execution Flow Diagram

```
┌─────────────────────────────────────────┐
│         Trigger Activation              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Dependency Graph Building           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Topological Sort                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Level-by-Level Execution           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Level 1 │  │ Level 2 │  │ Level 3 │ │
│  │ (Parall)│  │ (Parall)│  │ (Parall)│ │
│  └─────────┘  └─────────┘  └─────────┘ │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         State Updates                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Completion / Failure             │
└─────────────────────────────────────────┘
```

## Related Documentation

- [Workflow Patterns](./workflow-patterns.md) - Detailed pattern descriptions
- [Building Workflows](./building-workflows.md) - How to build workflows
- [Data Flow](./data-flow.md) - Understanding data flow

