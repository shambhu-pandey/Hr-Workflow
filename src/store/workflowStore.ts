import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react'
import { create } from 'zustand'
import type {
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
  WorkflowNodeConfig,
  WorkflowNodeKind,
} from '../types/workflow'
import { createInitialWorkflow } from '../utils/initialWorkflow'
import { createWorkflowNode, deriveNodeLabel } from '../utils/nodeFactory'

interface HistoryEntry {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

interface WorkflowStore extends WorkflowGraph {
  selectedNodeId?: string
  past: HistoryEntry[]
  future: HistoryEntry[]
  addNode: (kind: WorkflowNodeKind, position: XYPosition) => void
  connectNodes: (connection: Connection) => void
  deleteSelected: () => void
  importWorkflow: (graph: WorkflowGraph) => void
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void
  redo: () => void
  resetWorkflow: () => void
  selectNode: (nodeId?: string) => void
  undo: () => void
  updateNodeConfig: (nodeId: string, config: WorkflowNodeConfig) => void
}

const MAX_HISTORY = 50

const initialWorkflow = createInitialWorkflow()

const snapshot = (state: WorkflowGraph): HistoryEntry => ({
  nodes: state.nodes,
  edges: state.edges,
})

const pushHistory = (state: WorkflowStore) => ({
  past: [...state.past.slice(-(MAX_HISTORY - 1)), snapshot(state)],
  future: [],
})

const shouldRecordNodeChanges = (changes: NodeChange<WorkflowNode>[]) =>
  changes.some((change) => {
    if (change.type === 'select' || change.type === 'dimensions') {
      return false
    }

    if (change.type === 'position') {
      return change.dragging === false || change.dragging === undefined
    }

    return true
  })

const shouldRecordEdgeChanges = (changes: EdgeChange<WorkflowEdge>[]) =>
  changes.some((change) => change.type !== 'select')

const getSelectedNodeId = (nodes: WorkflowNode[]) =>
  nodes.find((node) => node.selected)?.id

const areNodeChangesNoop = (
  changes: NodeChange<WorkflowNode>[],
  nodes: WorkflowNode[],
) =>
  changes.every((change) => {
    const node = 'id' in change ? nodes.find((item) => item.id === change.id) : undefined

    if (!node) {
      return false
    }

    if (change.type === 'select') {
      return Boolean(node.selected) === change.selected
    }

    if (change.type === 'position') {
      const positionUnchanged =
        !change.position ||
        (node.position.x === change.position.x && node.position.y === change.position.y)
      const draggingUnchanged =
        change.dragging === undefined || node.dragging === change.dragging

      return positionUnchanged && draggingUnchanged
    }

    if (change.type === 'dimensions') {
      const dimensionsUnchanged =
        !change.dimensions ||
        (node.measured?.width === change.dimensions.width &&
          node.measured?.height === change.dimensions.height)
      const resizingUnchanged =
        change.resizing === undefined || node.resizing === change.resizing

      return dimensionsUnchanged && resizingUnchanged
    }

    return false
  })

const areEdgeChangesNoop = (
  changes: EdgeChange<WorkflowEdge>[],
  edges: WorkflowEdge[],
) =>
  changes.every((change) => {
    const edge = 'id' in change ? edges.find((item) => item.id === change.id) : undefined

    if (!edge) {
      return false
    }

    if (change.type === 'select') {
      return Boolean(edge.selected) === change.selected
    }

    return false
  })

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  ...initialWorkflow,
  selectedNodeId: undefined,
  past: [],
  future: [],

  addNode: (kind, position) => {
    const node = createWorkflowNode(kind, position)

    set((state) => ({
      ...pushHistory(state),
      nodes: [
        ...state.nodes.map((existingNode) => ({
          ...existingNode,
          selected: false,
        })),
        { ...node, selected: true },
      ],
      selectedNodeId: node.id,
    }))
  },

  connectNodes: (connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) {
      return
    }

    set((state) => {
      const sourceNode = state.nodes.find((node) => node.id === connection.source)
      const targetNode = state.nodes.find((node) => node.id === connection.target)
      const edgeExists = state.edges.some(
        (edge) => edge.source === connection.source && edge.target === connection.target,
      )

      if (
        edgeExists ||
        sourceNode?.data.kind === 'end' ||
        targetNode?.data.kind === 'start'
      ) {
        return state
      }

      return {
        ...pushHistory(state),
        edges: addEdge(
          {
            ...connection,
            id: `${connection.source}-${connection.target}`,
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          state.edges,
        ),
      }
    })
  },

  deleteSelected: () => {
    set((state) => {
      const selectedNodeIds = new Set(
        state.nodes.filter((node) => node.selected).map((node) => node.id),
      )
      const selectedEdgeIds = new Set(
        state.edges.filter((edge) => edge.selected).map((edge) => edge.id),
      )

      if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) {
        return state
      }

      return {
        ...pushHistory(state),
        nodes: state.nodes.filter((node) => !selectedNodeIds.has(node.id)),
        edges: state.edges.filter(
          (edge) =>
            !selectedEdgeIds.has(edge.id) &&
            !selectedNodeIds.has(edge.source) &&
            !selectedNodeIds.has(edge.target),
        ),
        selectedNodeId: undefined,
      }
    })
  },

  importWorkflow: (graph) => {
    set((state) => ({
      ...pushHistory(state),
      nodes: graph.nodes,
      edges: graph.edges,
      selectedNodeId: undefined,
    }))
  },

  onEdgesChange: (changes) => {
    set((state) => {
      if (areEdgeChangesNoop(changes, state.edges)) {
        return state
      }

      const record = shouldRecordEdgeChanges(changes)

      return {
        ...(record ? pushHistory(state) : {}),
        edges: applyEdgeChanges(changes, state.edges),
      }
    })
  },

  onNodesChange: (changes) => {
    set((state) => {
      if (areNodeChangesNoop(changes, state.nodes)) {
        return state
      }

      const record = shouldRecordNodeChanges(changes)
      const nodes = applyNodeChanges(changes, state.nodes)

      return {
        ...(record ? pushHistory(state) : {}),
        nodes,
        selectedNodeId: getSelectedNodeId(nodes),
      }
    })
  },

  redo: () => {
    set((state) => {
      const next = state.future.at(-1)

      if (!next) {
        return state
      }

      return {
        nodes: next.nodes,
        edges: next.edges,
        past: [...state.past, snapshot(state)],
        future: state.future.slice(0, -1),
        selectedNodeId: getSelectedNodeId(next.nodes),
      }
    })
  },

  resetWorkflow: () => {
    const nextWorkflow = createInitialWorkflow()

    set((state) => ({
      ...pushHistory(state),
      nodes: nextWorkflow.nodes,
      edges: nextWorkflow.edges,
      selectedNodeId: undefined,
    }))
  },

  selectNode: (nodeId) => {
    set((state) => {
      const selectionAlreadyApplied =
        state.selectedNodeId === nodeId &&
        state.nodes.every((node) => Boolean(node.selected) === (node.id === nodeId))

      if (selectionAlreadyApplied) {
        return state
      }

      return {
        nodes: state.nodes.map((node) => ({
          ...node,
          selected: node.id === nodeId,
        })),
        selectedNodeId: nodeId,
      }
    })
  },

  undo: () => {
    set((state) => {
      const previous = state.past.at(-1)

      if (!previous) {
        return state
      }

      return {
        nodes: previous.nodes,
        edges: previous.edges,
        past: state.past.slice(0, -1),
        future: [...state.future, snapshot(state)],
        selectedNodeId: getSelectedNodeId(previous.nodes),
      }
    })
  },

  updateNodeConfig: (nodeId, config) => {
    set((state) => ({
      ...pushHistory(state),
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) {
          return node
        }

        return {
          ...node,
          data: {
            ...node.data,
            label: deriveNodeLabel(node.data.kind, config),
            config,
          },
        }
      }),
    }))
  },
}))
