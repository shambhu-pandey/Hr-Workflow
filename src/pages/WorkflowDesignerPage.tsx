import { Activity, GitBranch, Users, type LucideIcon } from 'lucide-react'
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas'
import { NodePalette } from '../components/canvas/NodePalette'
import { NodeConfigPanel } from '../components/forms/NodeConfigPanel'
import { JsonPanel } from '../components/simulation/JsonPanel'
import { SimulationPanel } from '../components/simulation/SimulationPanel'
import { ValidationPanel } from '../components/validation/ValidationPanel'
import { useAutomations } from '../hooks/useAutomations'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useWorkflowValidation } from '../hooks/useWorkflowValidation'
import { useWorkflowStore } from '../store/workflowStore'

export function WorkflowDesignerPage() {
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
  const { automations, error, isLoading } = useAutomations()
  const validation = useWorkflowValidation(automations)

  useKeyboardShortcuts()

  return (
    <div className="flex h-screen min-h-screen flex-col bg-zinc-100 text-zinc-950">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white px-5 py-3">
        <div>
          <p className="text-xs font-semibold uppercase text-teal-700">Tredence case study</p>
          <h1 className="text-xl font-semibold text-zinc-950">HR Workflow Designer</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Metric icon={Users} label="Nodes" value={nodes.length.toString()} />
          <Metric icon={GitBranch} label="Edges" value={edges.length.toString()} />
          <Metric
            icon={Activity}
            label="Status"
            value={validation.isValid ? 'Valid' : 'Needs work'}
          />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)_390px]">
        <NodePalette />

        <main className="min-h-[640px] min-w-0">
          <WorkflowCanvas validation={validation} />
        </main>

        <aside className="min-h-0 overflow-y-auto border-l border-zinc-200 bg-zinc-50">
          <NodeConfigPanel
            automationError={error}
            automations={automations}
            isLoadingAutomations={isLoading}
            validation={validation}
          />

          <div className="space-y-4 p-4">
            <ValidationPanel validation={validation} />
            <SimulationPanel validation={validation} />
            <JsonPanel />
          </div>
        </aside>
      </div>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
      <Icon className="text-teal-700" size={16} />
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      <span className="text-sm font-semibold text-zinc-900">{value}</span>
    </div>
  )
}
