import { useCallback, useEffect, useMemo, useState } from 'react'
import { workflowApi } from '../api/workflowApi'
import { useWorkflowStore } from '../store/workflowStore'
import type { SimulationLog, ValidationResult } from '../types/workflow'
import { toSerializableWorkflow } from '../utils/serialization'

type SimulationState = 'idle' | 'running' | 'playing' | 'completed' | 'blocked' | 'failed'

const validationLog = (message: string, index: number): SimulationLog => ({
  id: `validation-${index}`,
  status: 'error',
  message,
  timestamp: new Date().toISOString(),
  durationMs: 0,
})

export const useWorkflowSimulation = (validation: ValidationResult) => {
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
  const [status, setStatus] = useState<SimulationState>('idle')
  const [logs, setLogs] = useState<SimulationLog[]>([])
  const [runId, setRunId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(0)

  const workflowJson = useMemo(
    () => toSerializableWorkflow({ nodes, edges }),
    [edges, nodes],
  )

  const visibleLogs = useMemo(
    () => logs.slice(0, visibleCount),
    [logs, visibleCount],
  )

  useEffect(() => {
    if (status !== 'playing' || logs.length === 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= logs.length) {
          window.clearInterval(intervalId)
          setStatus('completed')
          return current
        }

        return current + 1
      })
    }, 420)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [logs.length, status])

  const runSimulation = useCallback(async () => {
    const blockingIssues = validation.issues.filter((issue) => issue.severity === 'error')

    if (blockingIssues.length > 0) {
      setRunId(null)
      setLogs(blockingIssues.map((issue, index) => validationLog(issue.message, index)))
      setVisibleCount(blockingIssues.length)
      setStatus('blocked')
      return
    }

    setStatus('running')
    setVisibleCount(0)
    setLogs([])

    try {
      const result = await workflowApi.simulateWorkflow(workflowJson)
      setRunId(result.runId)
      setLogs(result.logs)
      setStatus('playing')
    } catch {
      setRunId(null)
      setLogs([validationLog('Simulation request failed. Please retry.', 0)])
      setVisibleCount(1)
      setStatus('failed')
    }
  }, [validation.issues, workflowJson])

  return {
    logs,
    runId,
    runSimulation,
    status,
    visibleLogs,
    workflowJson,
  }
}
