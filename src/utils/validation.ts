import type {
  AutomatedNodeConfig,
  AutomationDefinition,
  ApprovalNodeConfig,
  EndNodeConfig,
  StartNodeConfig,
  TaskNodeConfig,
  ValidationIssue,
  ValidationResult,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
} from '../types/workflow'

const createIssue = (
  id: string,
  message: string,
  nodeId?: string,
  edgeId?: string,
): ValidationIssue => ({
  id,
  severity: 'error',
  message,
  nodeId,
  edgeId,
})

const createWarning = (
  id: string,
  message: string,
  nodeId?: string,
): ValidationIssue => ({
  id,
  severity: 'warning',
  message,
  nodeId,
})

const buildOutgoingMap = (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
  const map = new Map<string, WorkflowEdge[]>()
  nodes.forEach((node) => map.set(node.id, []))
  edges.forEach((edge) => {
    map.get(edge.source)?.push(edge)
  })
  return map
}

const buildIncomingMap = (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
  const map = new Map<string, WorkflowEdge[]>()
  nodes.forEach((node) => map.set(node.id, []))
  edges.forEach((edge) => {
    map.get(edge.target)?.push(edge)
  })
  return map
}

const detectCycles = (nodes: WorkflowNode[], outgoing: Map<string, WorkflowEdge[]>) => {
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const cycleNodes = new Set<string>()

  const visit = (nodeId: string, trail: string[]) => {
    if (visiting.has(nodeId)) {
      const cycleStart = trail.indexOf(nodeId)
      trail.slice(Math.max(cycleStart, 0)).forEach((id) => cycleNodes.add(id))
      return
    }

    if (visited.has(nodeId)) {
      return
    }

    visiting.add(nodeId)

    for (const edge of outgoing.get(nodeId) ?? []) {
      visit(edge.target, [...trail, edge.target])
    }

    visiting.delete(nodeId)
    visited.add(nodeId)
  }

  nodes.forEach((node) => visit(node.id, [node.id]))
  return cycleNodes
}

const collectReachable = (
  startIds: string[],
  adjacency: Map<string, WorkflowEdge[]>,
  direction: 'source' | 'target',
) => {
  const reachable = new Set<string>()
  const queue = [...startIds]

  while (queue.length > 0) {
    const nodeId = queue.shift()

    if (!nodeId || reachable.has(nodeId)) {
      continue
    }

    reachable.add(nodeId)

    for (const edge of adjacency.get(nodeId) ?? []) {
      queue.push(direction === 'target' ? edge.target : edge.source)
    }
  }

  return reachable
}

const validateNodeConfig = (
  node: WorkflowNode,
  automations: AutomationDefinition[],
) => {
  const issues: ValidationIssue[] = []

  switch (node.data.kind) {
    case 'start': {
      const config = node.data.config as StartNodeConfig
      if (!config.startTitle.trim()) {
        issues.push(createIssue(`${node.id}-start-title`, 'Start title is required.', node.id))
      }
      break
    }
    case 'task': {
      const config = node.data.config as TaskNodeConfig
      if (!config.title.trim()) {
        issues.push(createIssue(`${node.id}-task-title`, 'Task title is required.', node.id))
      }
      if (!config.assignee.trim()) {
        issues.push(createWarning(`${node.id}-task-assignee`, 'Task has no assignee.', node.id))
      }
      if (!config.dueDate.trim()) {
        issues.push(createWarning(`${node.id}-task-due-date`, 'Task has no due date.', node.id))
      }
      break
    }
    case 'approval': {
      const config = node.data.config as ApprovalNodeConfig
      if (!config.title.trim()) {
        issues.push(createIssue(`${node.id}-approval-title`, 'Approval title is required.', node.id))
      }
      if (!config.approverRole.trim()) {
        issues.push(createIssue(`${node.id}-approval-role`, 'Approver role is required.', node.id))
      }
      if (!Number.isFinite(config.threshold) || config.threshold < 1) {
        issues.push(
          createIssue(`${node.id}-approval-threshold`, 'Approval threshold must be at least 1.', node.id),
        )
      }
      break
    }
    case 'automated': {
      const config = node.data.config as AutomatedNodeConfig
      const action = automations.find((automation) => automation.id === config.actionId)

      if (!config.title.trim()) {
        issues.push(createIssue(`${node.id}-automation-title`, 'Automation title is required.', node.id))
      }
      if (!config.actionId.trim()) {
        issues.push(createIssue(`${node.id}-automation-action`, 'Automation action is required.', node.id))
      }
      if (config.actionId && automations.length > 0 && !action) {
        issues.push(createIssue(`${node.id}-automation-known-action`, 'Selected automation no longer exists.', node.id))
      }

      action?.params.forEach((param) => {
        if (!config.params[param]?.trim()) {
          issues.push(createIssue(`${node.id}-automation-param-${param}`, `Parameter "${param}" is required.`, node.id))
        }
      })
      break
    }
    case 'end': {
      const config = node.data.config as EndNodeConfig
      if (!config.endMessage.trim()) {
        issues.push(createWarning(`${node.id}-end-message`, 'End message is empty.', node.id))
      }
      break
    }
  }

  return issues
}

export const validateWorkflow = (
  graph: WorkflowGraph,
  automations: AutomationDefinition[] = [],
): ValidationResult => {
  const { nodes, edges } = graph
  const issues: ValidationIssue[] = []
  const nodeIds = new Set(nodes.map((node) => node.id))
  const starts = nodes.filter((node) => node.data.kind === 'start')
  const ends = nodes.filter((node) => node.data.kind === 'end')
  const outgoing = buildOutgoingMap(nodes, edges)
  const incoming = buildIncomingMap(nodes, edges)

  if (starts.length === 0) {
    issues.push(createIssue('workflow-start-missing', 'Workflow needs one Start node.'))
  }

  if (starts.length > 1) {
    starts.forEach((node) => {
      issues.push(createIssue(`workflow-start-duplicate-${node.id}`, 'Only one Start node is allowed.', node.id))
    })
  }

  if (ends.length === 0) {
    issues.push(createIssue('workflow-end-missing', 'Workflow needs at least one End node.'))
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      issues.push(createIssue(`edge-${edge.id}-dangling`, 'Edge points to a missing node.', undefined, edge.id))
    }
    if (edge.source === edge.target) {
      issues.push(createIssue(`edge-${edge.id}-self`, 'Self-connections are not allowed.', edge.source, edge.id))
    }
  }

  for (const node of nodes) {
    const incomingEdges = incoming.get(node.id) ?? []
    const outgoingEdges = outgoing.get(node.id) ?? []

    if (node.data.kind === 'start' && incomingEdges.length > 0) {
      issues.push(createIssue(`${node.id}-start-incoming`, 'Start node must not have incoming edges.', node.id))
    }

    if (node.data.kind !== 'start' && incomingEdges.length === 0) {
      issues.push(createIssue(`${node.id}-missing-incoming`, 'Node is disconnected from the workflow start.', node.id))
    }

    if (node.data.kind !== 'end' && outgoingEdges.length === 0) {
      issues.push(createIssue(`${node.id}-missing-outgoing`, 'Node must connect to the next step.', node.id))
    }

    if (node.data.kind === 'end' && outgoingEdges.length > 0) {
      issues.push(createIssue(`${node.id}-end-outgoing`, 'End node must not have outgoing edges.', node.id))
    }

    issues.push(...validateNodeConfig(node, automations))
  }

  if (starts.length === 1) {
    const reachableFromStart = collectReachable([starts[0].id], outgoing, 'target')
    nodes.forEach((node) => {
      if (!reachableFromStart.has(node.id)) {
        issues.push(createIssue(`${node.id}-unreachable`, 'Node cannot be reached from Start.', node.id))
      }
    })
  }

  if (ends.length > 0) {
    const canReachEnd = collectReachable(
      ends.map((node) => node.id),
      incoming,
      'source',
    )

    nodes.forEach((node) => {
      if (!canReachEnd.has(node.id)) {
        issues.push(createIssue(`${node.id}-dead-end`, 'Node does not lead to an End node.', node.id))
      }
    })
  }

  const cycleNodes = detectCycles(nodes, outgoing)
  cycleNodes.forEach((nodeId) => {
    issues.push(createIssue(`${nodeId}-cycle`, 'Workflow contains a cycle through this node.', nodeId))
  })

  return {
    isValid: issues.every((issue) => issue.severity !== 'error'),
    issues,
  }
}

export const decorateNodesWithValidation = (
  nodes: WorkflowNode[],
  issues: ValidationIssue[],
): WorkflowNode[] => {
  const messagesByNode = new Map<string, string[]>()

  issues.forEach((issue) => {
    if (!issue.nodeId) {
      return
    }

    const messages = messagesByNode.get(issue.nodeId) ?? []
    messages.push(issue.message)
    messagesByNode.set(issue.nodeId, messages)
  })

  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      validationMessages: messagesByNode.get(node.id) ?? [],
    },
  }))
}

export const decorateEdgesWithValidation = (
  edges: WorkflowEdge[],
  issues: ValidationIssue[],
): WorkflowEdge[] => {
  const edgeIdsWithErrors = new Set(
    issues.filter((issue) => issue.edgeId).map((issue) => issue.edgeId),
  )

  return edges.map((edge) => ({
    ...edge,
    animated: edgeIdsWithErrors.has(edge.id),
    style: {
      ...edge.style,
      stroke: edgeIdsWithErrors.has(edge.id) ? '#dc2626' : '#64748b',
      strokeWidth: edgeIdsWithErrors.has(edge.id) ? 2.5 : 1.5,
    },
  }))
}

export const getExecutionOrder = ({ nodes, edges }: WorkflowGraph) => {
  const start = nodes.find((node) => node.data.kind === 'start')

  if (!start) {
    return nodes
  }

  const outgoing = buildOutgoingMap(nodes, edges)
  const seen = new Set<string>()
  const ordered: WorkflowNode[] = []
  const queue = [start.id]

  while (queue.length > 0) {
    const nodeId = queue.shift()
    const node = nodes.find((candidate) => candidate.id === nodeId)

    if (!nodeId || !node || seen.has(nodeId)) {
      continue
    }

    seen.add(nodeId)
    ordered.push(node)
    queue.push(...(outgoing.get(nodeId) ?? []).map((edge) => edge.target))
  }

  nodes.forEach((node) => {
    if (!seen.has(node.id)) {
      ordered.push(node)
    }
  })

  return ordered
}
