import {
  RotateCcw,
  Trash2,
  Undo2,
  Redo2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { useWorkflowStore } from '../../store/workflowStore'
import type { ValidationResult } from '../../types/workflow'

interface CanvasToolbarProps {
  validation: ValidationResult
}

export function CanvasToolbar({ validation }: CanvasToolbarProps) {
  const deleteSelected = useWorkflowStore((state) => state.deleteSelected)
  const resetWorkflow = useWorkflowStore((state) => state.resetWorkflow)
  const undo = useWorkflowStore((state) => state.undo)
  const redo = useWorkflowStore((state) => state.redo)
  const canUndo = useWorkflowStore((state) => state.past.length > 0)
  const canRedo = useWorkflowStore((state) => state.future.length > 0)
  const hasSelection = useWorkflowStore(
    (state) => state.nodes.some((node) => node.selected) || state.edges.some((edge) => edge.selected),
  )

  const blockingCount = validation.issues.filter((issue) => issue.severity === 'error').length

  return (
    <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white/95 p-2 shadow-lg backdrop-blur">
      <button
        aria-label="Undo"
        className="toolbar-button"
        disabled={!canUndo}
        onClick={undo}
        title="Undo"
        type="button"
      >
        <Undo2 size={16} />
      </button>
      <button
        aria-label="Redo"
        className="toolbar-button"
        disabled={!canRedo}
        onClick={redo}
        title="Redo"
        type="button"
      >
        <Redo2 size={16} />
      </button>
      <span className="h-6 w-px bg-zinc-200" />
      <button
        aria-label="Delete selected"
        className="toolbar-button"
        disabled={!hasSelection}
        onClick={deleteSelected}
        title="Delete selected"
        type="button"
      >
        <Trash2 size={16} />
      </button>
      <button
        aria-label="Reset workflow"
        className="toolbar-button"
        onClick={resetWorkflow}
        title="Reset workflow"
        type="button"
      >
        <RotateCcw size={16} />
      </button>
      <span className="h-6 w-px bg-zinc-200" />
      <div
        className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
          validation.isValid
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-rose-50 text-rose-700'
        }`}
      >
        {validation.isValid ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
        {validation.isValid ? 'Valid' : `${blockingCount} issue${blockingCount === 1 ? '' : 's'}`}
      </div>
    </div>
  )
}
