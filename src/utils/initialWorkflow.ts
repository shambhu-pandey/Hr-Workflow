import type { WorkflowEdge, WorkflowNode } from '../types/workflow'
import { createWorkflowNode } from './nodeFactory'

export const createInitialWorkflow = (): {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
} => {
  const start = createWorkflowNode('start', { x: 40, y: 160 })
  const task = createWorkflowNode('task', { x: 330, y: 80 })
  const approval = createWorkflowNode('approval', { x: 640, y: 80 })
  const automated = createWorkflowNode('automated', { x: 950, y: 80 })
  const end = createWorkflowNode('end', { x: 1260, y: 160 })

  const edges: WorkflowEdge[] = [
    {
      id: `${start.id}-${task.id}`,
      source: start.id,
      target: task.id,
      type: 'smoothstep',
    },
    {
      id: `${task.id}-${approval.id}`,
      source: task.id,
      target: approval.id,
      type: 'smoothstep',
    },
    {
      id: `${approval.id}-${automated.id}`,
      source: approval.id,
      target: automated.id,
      type: 'smoothstep',
    },
    {
      id: `${automated.id}-${end.id}`,
      source: automated.id,
      target: end.id,
      type: 'smoothstep',
    },
  ]

  return {
    nodes: [start, task, approval, automated, end],
    edges,
  }
}
