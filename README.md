# HR Workflow Designer

A production-quality React + TypeScript prototype for visually designing, validating, exporting, importing, and simulating HR workflows such as onboarding, leave approval, and document verification.

## Features

- Drag-and-drop workflow canvas powered by React Flow
- Custom node types: Start, Task, Approval, Automated Step, End
- Edge creation, selection, deletion, minimap, zoom controls, and canvas validation
- Dynamic node configuration panel with controlled TypeScript forms
- Mock API layer for `GET /automations` and `POST /simulate`
- Step-by-step simulation timeline
- Visual validation indicators on nodes and edges
- Undo/redo history
- JSON export/import for workflow portability

## Tech Stack

- React 19 + Vite
- TypeScript
- React Flow (`@xyflow/react`)
- Zustand
- Tailwind CSS
- Lucide React icons

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

Production build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Folder Structure

```text
src/
  api/                  Mock API adapters
  components/
    canvas/             React Flow adapter, palette, toolbar
    forms/              Node configuration forms and reusable inputs
    simulation/         Simulation and JSON import/export panels
    validation/         Validation summary UI
  hooks/                Data loading, validation, simulation, shortcuts
  nodes/                Custom React Flow node renderer and registry
  pages/                Workflow designer page composition
  store/                Zustand workflow state and history
  types/                Domain and API TypeScript contracts
  utils/                Node factory, validation, serialization, IDs
```

## Architecture Decisions

The app keeps React Flow as a rendering and interaction adapter. Workflow behavior is owned by domain utilities and the Zustand store, which keeps canvas components focused on wiring events to state.

Node creation, labels, default configs, and automation parameter normalization live in `utils/nodeFactory.ts`. Validation rules live in `utils/validation.ts`. Import/export boundaries live in `utils/serialization.ts`. Mock network behavior lives in `api/workflowApi.ts`.

This separation makes it straightforward to add new node types, replace the mock API with a real backend, or move validation to a shared package later.

## State Management

`store/workflowStore.ts` owns:

- `nodes` and `edges`
- selected node state
- canvas mutations
- node config updates
- import/reset/delete actions
- undo/redo history

React Flow events (`onNodesChange`, `onEdgesChange`, `onConnect`) are normalized into store actions. UI-only derived data, such as validation decorations, is computed outside the store so persisted workflow state stays clean and serializable.

## Node System Design

Each node has a typed `kind` and a strongly typed config model:

- `StartNodeConfig`
- `TaskNodeConfig`
- `ApprovalNodeConfig`
- `AutomatedNodeConfig`
- `EndNodeConfig`

All visual node types use a shared `WorkflowNodeCard` renderer registered in `nodes/nodeTypes.ts`. The form panel switches by `node.data.kind`, giving each node a focused controlled form while keeping the underlying node contract consistent.

Automated nodes load actions from the mock automation API. When an action changes, the node form dynamically renders the parameter fields declared by that automation definition.

## Validation

The validation system checks:

- workflow has one Start node and at least one End node
- Start nodes have no incoming edges
- End nodes have no outgoing edges
- non-start nodes have incoming edges
- non-end nodes have outgoing edges
- all nodes are reachable from Start
- all nodes can reach an End node
- cycles and self-connections
- required config fields
- automated action parameters

Validation results are shown in the right rail and injected into React Flow render data for visual node and edge indicators.

## Mock API

`GET /automations` is represented by `workflowApi.getAutomations()` and returns automation definitions such as Send Email, Generate Document, Create IT Ticket, and Notify Slack.

`POST /simulate` is represented by `workflowApi.simulateWorkflow(graph)` and returns ordered execution logs based on the workflow graph.

## Completed 

Completed:

- core React Flow canvas
- dynamic forms
- mock API integration
- validation
- simulation timeline
- undo/redo
- JSON export/import
- visual error indicators
