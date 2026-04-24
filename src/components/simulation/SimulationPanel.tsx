import { AlertTriangle, CheckCircle2, Loader2, Play } from 'lucide-react'
import { useWorkflowSimulation } from '../../hooks/useWorkflowSimulation'
import type { ValidationResult } from '../../types/workflow'

interface SimulationPanelProps {
  validation: ValidationResult
}

export function SimulationPanel({ validation }: SimulationPanelProps) {
  const { runId, runSimulation, status, visibleLogs } =
    useWorkflowSimulation(validation)
  const isRunning = status === 'running' || status === 'playing'

  return (
    <section className="panel-section">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Sandbox</p>
          <h3 className="text-base font-semibold text-zinc-950">Workflow simulation</h3>
        </div>
        <button
          className="primary-button"
          disabled={isRunning}
          onClick={runSimulation}
          type="button"
        >
          {status === 'running' ? (
            <Loader2 className="animate-spin" size={15} />
          ) : (
            <Play size={15} />
          )}
          Run
        </button>
      </div>

      {runId && (
        <div className="mt-3 rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600">
          Run ID: {runId}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {visibleLogs.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-3 py-4 text-sm text-zinc-500">
            Simulation logs will appear here.
          </div>
        )}

        {visibleLogs.map((log) => {
          const isError = log.status === 'error'

          return (
            <div
              className={`rounded-lg border p-3 ${
                isError
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-emerald-200 bg-emerald-50'
              }`}
              key={log.id}
            >
              <div className="flex items-center gap-2">
                {isError ? (
                  <AlertTriangle className="text-rose-600" size={16} />
                ) : (
                  <CheckCircle2 className="text-emerald-600" size={16} />
                )}
                <p
                  className={`text-sm font-semibold ${
                    isError ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {log.status}
                </p>
                <span className="ml-auto text-xs text-zinc-500">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <p
                className={`mt-2 text-sm leading-5 ${
                  isError ? 'text-rose-700' : 'text-emerald-800'
                }`}
              >
                {log.message}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
