import type { NodeTypes } from '@xyflow/react'
import { WorkflowNodeCard } from './WorkflowNodeCard'

export const workflowNodeTypes = {
  start: WorkflowNodeCard,
  task: WorkflowNodeCard,
  approval: WorkflowNodeCard,
  automated: WorkflowNodeCard,
  end: WorkflowNodeCard,
} satisfies NodeTypes
