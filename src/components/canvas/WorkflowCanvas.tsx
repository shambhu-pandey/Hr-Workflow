import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
} from '@xyflow/react'
import type { DragEvent } from 'react'
import { useCallback, useMemo } from 'react'
import { workflowNodeTypes } from '../../nodes/nodeTypes'
import { useWorkflowStore } from '../../store/workflowStore'
import type { ValidationResult, WorkflowEdge, WorkflowNode } from '../../types/workflow'
import { isWorkflowNodeKind } from '../../utils/serialization'
import {
  decorateEdgesWithValidation,
  decorateNodesWithValidation,
} from '../../utils/validation'
import { CanvasToolbar } from './CanvasToolbar'

interface WorkflowCanvasProps {
  validation: ValidationResult
}

const minimapColors = {
  start: '#10b981',
  task: '#0ea5e9',
  approval: '#f59e0b',
  automated: '#8b5cf6',
  end: '#f43f5e',
}

function WorkflowCanvasInner({ validation }: WorkflowCanvasProps) {
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
  const addNode = useWorkflowStore((state) => state.addNode)
  const connectNodes = useWorkflowStore((state) => state.connectNodes)
  const onNodesChange = useWorkflowStore((state) => state.onNodesChange)
  const onEdgesChange = useWorkflowStore((state) => state.onEdgesChange)
  const { screenToFlowPosition } = useReactFlow<WorkflowNode, WorkflowEdge>()

  const canvasNodes = useMemo(
    () => decorateNodesWithValidation(nodes, validation.issues),
    [nodes, validation.issues],
  )

  const canvasEdges = useMemo(
    () => decorateEdgesWithValidation(edges, validation.issues),
    [edges, validation.issues],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const kind = event.dataTransfer.getData('application/reactflow')

      if (!isWorkflowNodeKind(kind)) {
        return
      }

      addNode(
        kind,
        screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      )
    },
    [addNode, screenToFlowPosition],
  )

  const isValidConnection = useCallback(
    (connection: Connection | WorkflowEdge) => {
      if (!connection.source || !connection.target || connection.source === connection.target) {
        return false
      }

      const sourceNode = nodes.find((node) => node.id === connection.source)
      const targetNode = nodes.find((node) => node.id === connection.target)
      const duplicate = edges.some(
        (edge) => edge.source === connection.source && edge.target === connection.target,
      )

      return (
        !duplicate &&
        sourceNode?.data.kind !== 'end' &&
        targetNode?.data.kind !== 'start'
      )
    },
    [edges, nodes],
  )

  return (
    <div className="relative h-full min-h-[620px] overflow-hidden bg-zinc-50">
      <CanvasToolbar validation={validation} />
      <ReactFlow<WorkflowNode, WorkflowEdge>
        defaultViewport={{ x: 20, y: 40, zoom: 0.82 }}
        deleteKeyCode={null}
        edges={canvasEdges}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        isValidConnection={isValidConnection}
        nodeTypes={workflowNodeTypes}
        nodes={canvasNodes}
        onConnect={connectNodes}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onEdgesChange={onEdgesChange}
        onNodesChange={onNodesChange}
      >
        <Background color="#d4d4d8" gap={18} size={1} variant={BackgroundVariant.Dots} />
        <Controls position="bottom-left" />
        <MiniMap
          maskColor="rgba(244, 244, 245, 0.72)"
          nodeBorderRadius={8}
          nodeColor={(node) => minimapColors[(node as WorkflowNode).data.kind]}
          pannable
          position="bottom-right"
          zoomable
        />
      </ReactFlow>
    </div>
  )
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
