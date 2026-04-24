import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ValidationResult } from '../../types/workflow'

interface ValidationPanelProps {
  validation: ValidationResult
}

export function ValidationPanel({ validation }: ValidationPanelProps) {
  const errors = validation.issues.filter((issue) => issue.severity === 'error')
  const warnings = validation.issues.filter((issue) => issue.severity === 'warning')

  return (
    <section className="panel-section">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-md ${
            validation.isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {validation.isValid ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Validation</p>
          <h3 className="text-base font-semibold text-zinc-950">
            {validation.isValid ? 'Ready to simulate' : `${errors.length} blocking issue${errors.length === 1 ? '' : 's'}`}
          </h3>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {validation.issues.length === 0 && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
            Structure and required fields are valid.
          </p>
        )}

        {validation.issues.map((issue) => (
          <div
            className={`rounded-lg border px-3 py-2 text-sm leading-5 ${
              issue.severity === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
            key={issue.id}
          >
            {issue.message}
          </div>
        ))}
      </div>

      {warnings.length > 0 && (
        <p className="mt-3 text-xs font-medium text-zinc-500">
          {warnings.length} warning{warnings.length === 1 ? '' : 's'} can ship with simulation.
        </p>
      )}
    </section>
  )
}
