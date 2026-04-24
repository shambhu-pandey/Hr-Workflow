import type { XYPosition } from '@xyflow/react'
import type {
  AutomatedNodeConfig,
  AutomationDefinition,
  ApprovalNodeConfig,
  EndNodeConfig,
  KeyValuePair,
  NodeTemplate,
  StartNodeConfig,
  TaskNodeConfig,
  WorkflowNode,
  WorkflowNodeConfig,
  WorkflowNodeKind,
} from '../types/workflow'
import { createId } from './id'

export const NODE_TEMPLATES: NodeTemplate[] = [
  {
    kind: 'start',
    label: 'Start Node',
    description: 'Entry point for an HR process',
    iconLabel: 'S',
  },
  {
    kind: 'task',
    label: 'Task Node',
    description: 'Human-owned work item',
    iconLabel: 'T',
  },
  {
    kind: 'approval',
    label: 'Approval Node',
    description: 'Role-based approval gate',
    iconLabel: 'A',
  },
  {
    kind: 'automated',
    label: 'Automated Node',
    description: 'System-triggered action',
    iconLabel: 'Z',
  },
  {
    kind: 'end',
    label: 'End Node',
    description: 'Workflow completion point',
    iconLabel: 'E',
  },
]

export const getNodeTemplate = (kind: WorkflowNodeKind) =>
  NODE_TEMPLATES.find((template) => template.kind === kind) ?? NODE_TEMPLATES[0]

export const createKeyValuePair = (key = '', value = ''): KeyValuePair => ({
  id: createId('field'),
  key,
  value,
})

export const createDefaultConfig = (
  kind: WorkflowNodeKind,
): WorkflowNodeConfig => {
  switch (kind) {
    case 'start':
      return {
        startTitle: 'Employee onboarding',
        metadata: [createKeyValuePair('department', 'People Operations')],
      } satisfies StartNodeConfig
    case 'task':
      return {
        title: 'Collect joining documents',
        description: 'Collect identity, bank, and tax documents from the employee.',
        assignee: 'HR Coordinator',
        dueDate: '',
        customFields: [],
      } satisfies TaskNodeConfig
    case 'approval':
      return {
        title: 'Manager approval',
        approverRole: 'Manager',
        threshold: 1,
      } satisfies ApprovalNodeConfig
    case 'automated':
      return {
        title: 'Send welcome email',
        actionId: 'send_email',
        params: {
          to: '{{employee.email}}',
          subject: 'Welcome to the team',
        },
      } satisfies AutomatedNodeConfig
    case 'end':
      return {
        endMessage: 'Onboarding workflow completed',
        includeSummary: true,
      } satisfies EndNodeConfig
  }
}

export const deriveNodeLabel = (
  kind: WorkflowNodeKind,
  config: WorkflowNodeConfig,
) => {
  switch (kind) {
    case 'start': {
      const startConfig = config as StartNodeConfig
      return startConfig.startTitle || 'Start'
    }
    case 'task': {
      const taskConfig = config as TaskNodeConfig
      return taskConfig.title || 'Untitled task'
    }
    case 'approval': {
      const approvalConfig = config as ApprovalNodeConfig
      return approvalConfig.title || 'Approval'
    }
    case 'automated': {
      const automatedConfig = config as AutomatedNodeConfig
      return automatedConfig.title || 'Automation'
    }
    case 'end': {
      const endConfig = config as EndNodeConfig
      return endConfig.endMessage || 'End'
    }
  }
}

export const getNodeSubtitle = (
  kind: WorkflowNodeKind,
  config: WorkflowNodeConfig,
  automations: AutomationDefinition[] = [],
) => {
  switch (kind) {
    case 'start':
      return 'Workflow entry'
    case 'task': {
      const taskConfig = config as TaskNodeConfig
      return taskConfig.assignee ? `Assigned to ${taskConfig.assignee}` : 'Human task'
    }
    case 'approval': {
      const approvalConfig = config as ApprovalNodeConfig
      return `${approvalConfig.approverRole || 'Approver'} threshold ${approvalConfig.threshold}`
    }
    case 'automated': {
      const automatedConfig = config as AutomatedNodeConfig
      const action = automations.find((item) => item.id === automatedConfig.actionId)
      return action?.label ?? 'Automation action'
    }
    case 'end': {
      const endConfig = config as EndNodeConfig
      return endConfig.includeSummary ? 'Summary enabled' : 'No summary'
    }
  }
}

export const createWorkflowNode = (
  kind: WorkflowNodeKind,
  position: XYPosition,
): WorkflowNode => {
  const config = createDefaultConfig(kind)
  const template = getNodeTemplate(kind)

  return {
    id: createId(kind),
    type: kind,
    position,
    data: {
      kind,
      label: deriveNodeLabel(kind, config),
      description: template.description,
      config,
    },
  }
}

export const normalizeAutomationParams = (
  actionId: string,
  automations: AutomationDefinition[],
  existingParams: Record<string, string>,
) => {
  const action = automations.find((automation) => automation.id === actionId)

  if (!action) {
    return existingParams
  }

  return action.params.reduce<Record<string, string>>((params, paramName) => {
    params[paramName] = existingParams[paramName] ?? ''
    return params
  }, {})
}
