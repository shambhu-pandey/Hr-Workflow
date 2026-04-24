import type { Edge, Node, XYPosition } from '@xyflow/react'

export const WORKFLOW_NODE_KINDS = [
  'start',
  'task',
  'approval',
  'automated',
  'end',
] as const

export type WorkflowNodeKind = (typeof WORKFLOW_NODE_KINDS)[number]

export type ValidationSeverity = 'error' | 'warning'

export type SimulationStatus = 'success' | 'warning' | 'error'

export interface KeyValuePair {
  id: string
  key: string
  value: string
}

export interface StartNodeConfig {
  startTitle: string
  metadata: KeyValuePair[]
}

export interface TaskNodeConfig {
  title: string
  description: string
  assignee: string
  dueDate: string
  customFields: KeyValuePair[]
}

export interface ApprovalNodeConfig {
  title: string
  approverRole: string
  threshold: number
}

export interface AutomatedNodeConfig {
  title: string
  actionId: string
  params: Record<string, string>
}

export interface EndNodeConfig {
  endMessage: string
  includeSummary: boolean
}

export interface WorkflowNodeConfigMap {
  start: StartNodeConfig
  task: TaskNodeConfig
  approval: ApprovalNodeConfig
  automated: AutomatedNodeConfig
  end: EndNodeConfig
}

export type WorkflowNodeConfig = WorkflowNodeConfigMap[WorkflowNodeKind]

export type WorkflowNodeData = {
  kind: WorkflowNodeKind
  label: string
  description: string
  config: WorkflowNodeConfig
  validationMessages?: string[]
} & Record<string, unknown>

export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeKind>

export type WorkflowEdgeData = {
  validationMessages?: string[]
} & Record<string, unknown>

export type WorkflowEdge = Edge<WorkflowEdgeData>

export interface WorkflowGraph {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface NodeTemplate {
  kind: WorkflowNodeKind
  label: string
  description: string
  iconLabel: string
}

export interface AutomationDefinition {
  id: string
  label: string
  description: string
  params: string[]
}

export interface ValidationIssue {
  id: string
  severity: ValidationSeverity
  message: string
  nodeId?: string
  edgeId?: string
}

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
}

export interface SimulationLog {
  id: string
  nodeId?: string
  status: SimulationStatus
  message: string
  timestamp: string
  durationMs: number
}

export interface SimulationResult {
  runId: string
  logs: SimulationLog[]
}

export interface DropPayload {
  kind: WorkflowNodeKind
  position: XYPosition
}
