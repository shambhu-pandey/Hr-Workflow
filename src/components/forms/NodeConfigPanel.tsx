import {
  Bot,
  CheckSquare,
  CirclePlay,
  Flag,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'
import type {
  AutomatedNodeConfig,
  AutomationDefinition,
  ApprovalNodeConfig,
  EndNodeConfig,
  StartNodeConfig,
  TaskNodeConfig,
  ValidationResult,
  WorkflowNode,
  WorkflowNodeConfig,
  WorkflowNodeKind,
} from '../../types/workflow'
import { normalizeAutomationParams } from '../../utils/nodeFactory'
import {
  FieldShell,
  NumberInput,
  SelectInput,
  TextAreaInput,
  TextInput,
  ToggleInput,
} from './FormControls'
import { KeyValueEditor } from './KeyValueEditor'

interface NodeConfigPanelProps {
  automations: AutomationDefinition[]
  automationError: string | null
  isLoadingAutomations: boolean
  validation: ValidationResult
}

const NODE_ICONS: Record<WorkflowNodeKind, LucideIcon> = {
  start: CirclePlay,
  task: CheckSquare,
  approval: ShieldCheck,
  automated: Bot,
  end: Flag,
}

const approvalRoles = ['Manager', 'HRBP', 'Director', 'Finance Partner', 'Legal']

export function NodeConfigPanel({
  automationError,
  automations,
  isLoadingAutomations,
  validation,
}: NodeConfigPanelProps) {
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId)
  const nodes = useWorkflowStore((state) => state.nodes)
  const updateNodeConfig = useWorkflowStore((state) => state.updateNodeConfig)

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId],
  )
  const selectedNodeMessages = useMemo(
    () =>
      validation.issues
        .filter((issue) => issue.nodeId === selectedNodeId)
        .map((issue) => issue.message),
    [selectedNodeId, validation.issues],
  )

  if (!selectedNode) {
    return (
      <section className="flex min-h-[320px] flex-col border-b border-zinc-200 bg-zinc-50">
        <PanelHeader eyebrow="Configuration" title="No node selected" />
        <div className="p-4 text-sm leading-6 text-zinc-500">
          Select a workflow node to edit its configuration.
        </div>
      </section>
    )
  }

  const Icon = NODE_ICONS[selectedNode.data.kind]

  return (
    <section className="flex min-h-[420px] flex-col border-b border-zinc-200 bg-zinc-50">
      <PanelHeader eyebrow={selectedNode.data.kind} title={selectedNode.data.label}>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200">
          <Icon size={18} />
        </div>
      </PanelHeader>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <NodeForm
          automationError={automationError}
          automations={automations}
          isLoadingAutomations={isLoadingAutomations}
          node={selectedNode}
          updateNodeConfig={updateNodeConfig}
        />

        {selectedNodeMessages.length > 0 && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-700">Validation</p>
            <ul className="mt-2 space-y-1 text-sm leading-5 text-rose-700">
              {selectedNodeMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function PanelHeader({
  children,
  eyebrow,
  title,
}: {
  children?: ReactNode
  eyebrow: string
  title: string
}) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-4">
      {children}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-zinc-500">{eyebrow}</p>
        <h2 className="truncate text-lg font-semibold text-zinc-950">{title}</h2>
      </div>
    </div>
  )
}

function NodeForm({
  automationError,
  automations,
  isLoadingAutomations,
  node,
  updateNodeConfig,
}: {
  automationError: string | null
  automations: AutomationDefinition[]
  isLoadingAutomations: boolean
  node: WorkflowNode
  updateNodeConfig: (nodeId: string, config: WorkflowNodeConfig) => void
}) {
  switch (node.data.kind) {
    case 'start': {
      const config = node.data.config as StartNodeConfig
      return (
        <div className="space-y-4">
          <TextInput
            label="Start title"
            onChange={(startTitle) => updateNodeConfig(node.id, { ...config, startTitle })}
            value={config.startTitle}
          />
          <KeyValueEditor
            label="Metadata"
            onChange={(metadata) => updateNodeConfig(node.id, { ...config, metadata })}
            pairs={config.metadata}
          />
        </div>
      )
    }

    case 'task': {
      const config = node.data.config as TaskNodeConfig
      return (
        <div className="space-y-4">
          <TextInput
            label="Title"
            onChange={(title) => updateNodeConfig(node.id, { ...config, title })}
            value={config.title}
          />
          <TextAreaInput
            label="Description"
            onChange={(description) => updateNodeConfig(node.id, { ...config, description })}
            value={config.description}
          />
          <TextInput
            label="Assignee"
            onChange={(assignee) => updateNodeConfig(node.id, { ...config, assignee })}
            value={config.assignee}
          />
          <TextInput
            label="Due date"
            onChange={(dueDate) => updateNodeConfig(node.id, { ...config, dueDate })}
            type="date"
            value={config.dueDate}
          />
          <KeyValueEditor
            label="Custom fields"
            onChange={(customFields) => updateNodeConfig(node.id, { ...config, customFields })}
            pairs={config.customFields}
          />
        </div>
      )
    }

    case 'approval': {
      const config = node.data.config as ApprovalNodeConfig
      return (
        <div className="space-y-4">
          <TextInput
            label="Title"
            onChange={(title) => updateNodeConfig(node.id, { ...config, title })}
            value={config.title}
          />
          <SelectInput
            label="Approver role"
            onChange={(approverRole) => updateNodeConfig(node.id, { ...config, approverRole })}
            value={config.approverRole}
          >
            {approvalRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </SelectInput>
          <NumberInput
            label="Auto-approve threshold"
            min={1}
            onChange={(threshold) => updateNodeConfig(node.id, { ...config, threshold })}
            value={config.threshold}
          />
        </div>
      )
    }

    case 'automated': {
      const config = node.data.config as AutomatedNodeConfig
      const selectedAutomation = automations.find(
        (automation) => automation.id === config.actionId,
      )

      return (
        <div className="space-y-4">
          <TextInput
            label="Title"
            onChange={(title) => updateNodeConfig(node.id, { ...config, title })}
            value={config.title}
          />

          <SelectInput
            label="Action"
            onChange={(actionId) =>
              updateNodeConfig(node.id, {
                ...config,
                actionId,
                params: normalizeAutomationParams(actionId, automations, config.params),
              })
            }
            value={config.actionId}
          >
            {automations.map((automation) => (
              <option key={automation.id} value={automation.id}>
                {automation.label}
              </option>
            ))}
          </SelectInput>

          {isLoadingAutomations && (
            <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-500">
              Loading automation actions
            </div>
          )}

          {automationError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
              {automationError}
            </div>
          )}

          {selectedAutomation && (
            <div className="rounded-lg border border-zinc-200 bg-white p-3">
              <p className="text-sm font-semibold text-zinc-800">
                {selectedAutomation.label}
              </p>
              <p className="mt-1 text-sm leading-5 text-zinc-500">
                {selectedAutomation.description}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-zinc-700">Parameters</p>
            {selectedAutomation?.params.map((paramName) => (
              <FieldShell key={paramName} label={paramName}>
                <input
                  className="form-input"
                  onChange={(event) =>
                    updateNodeConfig(node.id, {
                      ...config,
                      params: {
                        ...config.params,
                        [paramName]: event.target.value,
                      },
                    })
                  }
                  value={config.params[paramName] ?? ''}
                />
              </FieldShell>
            ))}
          </div>
        </div>
      )
    }

    case 'end': {
      const config = node.data.config as EndNodeConfig
      return (
        <div className="space-y-4">
          <TextAreaInput
            label="End message"
            onChange={(endMessage) => updateNodeConfig(node.id, { ...config, endMessage })}
            value={config.endMessage}
          />
          <ToggleInput
            checked={config.includeSummary}
            label="Include summary"
            onChange={(includeSummary) =>
              updateNodeConfig(node.id, { ...config, includeSummary })
            }
          />
        </div>
      )
    }
  }
}
