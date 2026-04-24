import { useMemo } from 'react'
import { useWorkflowStore } from '../store/workflowStore'
import type { AutomationDefinition } from '../types/workflow'
import { validateWorkflow } from '../utils/validation'

export const useWorkflowValidation = (automations: AutomationDefinition[]) => {
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)

  return useMemo(
    () => validateWorkflow({ nodes, edges }, automations),
    [automations, edges, nodes],
  )
}
