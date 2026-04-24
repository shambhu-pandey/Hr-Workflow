import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  AlertCircle,
  CheckSquare,
  CirclePlay,
  Flag,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { WorkflowNode, WorkflowNodeKind } from '../types/workflow'

const NODE_ICONS: Record<WorkflowNodeKind, LucideIcon> = {
  start: CirclePlay,
  task: CheckSquare,
  approval: ShieldCheck,
  automated: Zap,
  end: Flag,
}

const NODE_STYLES: Record<WorkflowNodeKind, string> = {
  start: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  task: 'border-sky-300 bg-sky-50 text-sky-700',
  approval: 'border-amber-300 bg-amber-50 text-amber-700',
  automated: 'border-violet-300 bg-violet-50 text-violet-700',
  end: 'border-rose-300 bg-rose-50 text-rose-700',
}

export function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowNode>) {
  const Icon = NODE_ICONS[data.kind]
  const hasIssues = Boolean(data.validationMessages?.length)

  return (
    <div
      className={`workflow-node ${selected ? 'workflow-node-selected' : ''} ${
        hasIssues ? 'workflow-node-error' : ''
      }`}
    >
      {data.kind !== 'start' && (
        <Handle
          className="workflow-handle"
          position={Position.Left}
          type="target"
        />
      )}

      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${NODE_STYLES[data.kind]}`}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-950">{data.label}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                {data.description}
              </p>
            </div>

            {hasIssues && (
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600"
                title={data.validationMessages?.join('\n')}
              >
                <AlertCircle size={15} />
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-semibold uppercase text-zinc-500">
              {data.kind}
            </span>
            {hasIssues && (
              <span className="text-[11px] font-semibold text-rose-600">
                {data.validationMessages?.length} issue
                {data.validationMessages?.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>

      {data.kind !== 'end' && (
        <Handle
          className="workflow-handle"
          position={Position.Right}
          type="source"
        />
      )}
    </div>
  )
}
