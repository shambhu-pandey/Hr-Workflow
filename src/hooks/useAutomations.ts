import { useCallback, useEffect, useState } from 'react'
import { workflowApi } from '../api/workflowApi'
import type { AutomationDefinition } from '../types/workflow'

export const useAutomations = () => {
  const [automations, setAutomations] = useState<AutomationDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAutomations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await workflowApi.getAutomations()
      setAutomations(response)
    } catch {
      setError('Unable to load automations.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCurrent = true

    void workflowApi
      .getAutomations()
      .then((response) => {
        if (!isCurrent) {
          return
        }

        setAutomations(response)
        setError(null)
      })
      .catch(() => {
        if (isCurrent) {
          setError('Unable to load automations.')
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  return {
    automations,
    error,
    isLoading,
    refetch: loadAutomations,
  }
}
