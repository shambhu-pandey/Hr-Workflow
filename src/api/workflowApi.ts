import type {
  AutomatedNodeConfig,
  AutomationDefinition,
  SimulationLog,
  SimulationResult,
  WorkflowGraph,
  WorkflowNode,
} from '../types/workflow'
import { getExecutionOrder } from '../utils/validation'

const wait = (durationMs: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, durationMs)
  })

const AUTOMATIONS: AutomationDefinition[] = [
  {
    id: 'send_email',
    label: 'Send Email',
    description: 'Send a templated email to an employee, manager, or HR partner.',
    params: ['to', 'subject'],
  },
  {
    id: 'generate_doc',
    label: 'Generate Document',
    description: 'Create a document from a template and attach it to the employee record.',
    params: ['template', 'recipient'],
  },
  {
    id: 'create_ticket',
    label: 'Create IT Ticket',
    description: 'Open an IT service desk ticket for device, access, or setup tasks.',
    params: ['queue', 'priority'],
  },
  {
    id: 'notify_slack',
    label: 'Notify Slack',
    description: 'Send an internal notification to a Slack channel.',
    params: ['channel', 'message'],
  },
]

const getNodeActionLabel = (
  node: WorkflowNode,
  automations: AutomationDefinition[],
) => {
  switch (node.data.kind) {
    case 'start':
      return `Started workflow "${node.data.label}".`
    case 'task':
      return `Created task "${node.data.label}".`
    case 'approval':
      return `Requested approval "${node.data.label}".`
    case 'automated': {
      const config = node.data.config as AutomatedNodeConfig
      const automation = automations.find((item) => item.id === config.actionId)
      return `Ran automation "${automation?.label ?? config.actionId}".`
    }
    case 'end':
      return `Completed workflow with "${node.data.label}".`
  }
}

const createSimulationLog = (
  node: WorkflowNode,
  index: number,
  automations: AutomationDefinition[],
): SimulationLog => ({
  id: `log-${index + 1}-${node.id}`,
  nodeId: node.id,
  status: 'success',
  message: getNodeActionLabel(node, automations),
  timestamp: new Date(Date.now() + index * 550).toISOString(),
  durationMs: 180 + index * 45,
})

export const workflowApi = {
  async getAutomations(): Promise<AutomationDefinition[]> {
    await wait(350)
    return AUTOMATIONS
  },

  async simulateWorkflow(graph: WorkflowGraph): Promise<SimulationResult> {
    await wait(550)

    const executionOrder = getExecutionOrder(graph)
    const logs = executionOrder.map((node, index) =>
      createSimulationLog(node, index, AUTOMATIONS),
    )

    logs.push({
      id: `log-summary-${Date.now()}`,
      status: 'success',
      message: `Simulation finished. ${graph.nodes.length} nodes and ${graph.edges.length} edges processed.`,
      timestamp: new Date(Date.now() + logs.length * 550).toISOString(),
      durationMs: 120,
    })

    return {
      runId: `sim-${Date.now().toString(36)}`,
      logs,
    }
  },
}
