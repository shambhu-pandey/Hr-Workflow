import type { DragEvent } from 'react'
import {
  CheckSquare,
  CirclePlay,
  Flag,
  GripVertical,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { NODE_TEMPLATES } from '../../utils/nodeFactory'
import type { WorkflowNodeKind } from '../../types/workflow'

const NODE_ICONS: Record<WorkflowNodeKind, LucideIcon> = {
  start: CirclePlay,
  task: CheckSquare,
  approval: ShieldCheck,
  automated: Zap,
  end: Flag,
}

const NODE_ACCENTS: Record<WorkflowNodeKind, string> = {
  start: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  task: 'border-sky-200 bg-sky-50 text-sky-700',
  approval: 'border-amber-200 bg-amber-50 text-amber-700',
  automated: 'border-violet-200 bg-violet-50 text-violet-700',
  end: 'border-rose-200 bg-rose-50 text-rose-700',
}

export function NodePalette() {
  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    kind: WorkflowNodeKind,
  ) => {
    event.dataTransfer.setData('application/reactflow', kind)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="flex h-full flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-4">
        <p className="text-xs font-semibold uppercase text-zinc-500">Node Library</p>
        <h2 className="mt-1 text-lg font-semibold text-zinc-950">HR workflow blocks</h2>
      </div>

      <div className="space-y-3 overflow-y-auto p-3">
        {NODE_TEMPLATES.map((template) => {
          const Icon = NODE_ICONS[template.kind]

          return (
            <button
              draggable
              key={template.kind}
              onDragStart={(event) => handleDragStart(event, template.kind)}
              type="button"
              className="group flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-left shadow-sm transition hover:border-zinc-300 hover:shadow-md"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${NODE_ACCENTS[template.kind]}`}
              >
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-950">
                  {template.label}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
                  {template.description}
                </span>
              </span>
              <GripVertical
                className="shrink-0 text-zinc-300 transition group-hover:text-zinc-500"
                size={16}
              />
            </button>
          )
        })}
      </div>
    </aside>
  )
}
