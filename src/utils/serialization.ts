import type {
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
  WorkflowNodeConfig,
  WorkflowNodeKind,
} from '../types/workflow'
import { WORKFLOW_NODE_KINDS } from '../types/workflow'
import { createId } from './id'
import { createDefaultConfig, deriveNodeLabel, getNodeTemplate } from './nodeFactory'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isWorkflowNodeKind = (value: unknown): value is WorkflowNodeKind =>
  typeof value === 'string' && WORKFLOW_NODE_KINDS.includes(value as WorkflowNodeKind)

const sanitizeConfig = (
  kind: WorkflowNodeKind,
  config: unknown,
): WorkflowNodeConfig => ({
  ...createDefaultConfig(kind),
  ...(isRecord(config) ? config : {}),
}) as WorkflowNodeConfig

const sanitizeNode = (node: unknown, index: number): WorkflowNode => {
  if (!isRecord(node)) {
    throw new Error(`Node at index ${index} is not an object.`)
  }

  const data = isRecord(node.data) ? node.data : {}
  const kindCandidate = data.kind ?? node.type

  if (!isWorkflowNodeKind(kindCandidate)) {
    throw new Error(`Node at index ${index} has an unsupported type.`)
  }

  const kind = kindCandidate
  const config = sanitizeConfig(kind, data.config)
  const position = isRecord(node.position) ? node.position : {}
  const template = getNodeTemplate(kind)

  return {
    id: typeof node.id === 'string' && node.id ? node.id : createId(kind),
    type: kind,
    position: {
      x: typeof position.x === 'number' ? position.x : index * 260,
      y: typeof position.y === 'number' ? position.y : 120,
    },
    data: {
      kind,
      label: deriveNodeLabel(kind, config),
      description: template.description,
      config,
      validationMessages: [],
    },
  }
}

const sanitizeEdge = (
  edge: unknown,
  index: number,
  nodeIds: Set<string>,
): WorkflowEdge => {
  if (!isRecord(edge)) {
    throw new Error(`Edge at index ${index} is not an object.`)
  }

  if (typeof edge.source !== 'string' || typeof edge.target !== 'string') {
    throw new Error(`Edge at index ${index} is missing source or target.`)
  }

  if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
    throw new Error(`Edge at index ${index} references a missing node.`)
  }

  return {
    id:
      typeof edge.id === 'string' && edge.id
        ? edge.id
        : `${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: typeof edge.type === 'string' ? edge.type : 'smoothstep',
  }
}

export const toSerializableWorkflow = (graph: WorkflowGraph): WorkflowGraph => ({
  nodes: graph.nodes.map((node) => ({
    id: node.id,
    type: node.data.kind,
    position: node.position,
    data: {
      kind: node.data.kind,
      label: node.data.label,
      description: node.data.description,
      config: node.data.config,
    },
  })),
  edges: graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: edge.type ?? 'smoothstep',
  })),
})

export const serializeWorkflow = (graph: WorkflowGraph) =>
  JSON.stringify(toSerializableWorkflow(graph), null, 2)

export const parseWorkflowJson = (json: string): WorkflowGraph => {
  const parsed: unknown = JSON.parse(json)

  if (!isRecord(parsed) || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error('Workflow JSON must include nodes and edges arrays.')
  }

  const nodes = parsed.nodes.map(sanitizeNode)
  const nodeIds = new Set(nodes.map((node) => node.id))
  const edges = parsed.edges.map((edge, index) => sanitizeEdge(edge, index, nodeIds))

  return { nodes, edges }
}
