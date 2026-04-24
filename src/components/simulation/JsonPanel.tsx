import { Check, Copy, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useWorkflowStore } from '../../store/workflowStore'
import { parseWorkflowJson, serializeWorkflow } from '../../utils/serialization'

export function JsonPanel() {
  const nodes = useWorkflowStore((state) => state.nodes)
  const edges = useWorkflowStore((state) => state.edges)
  const importWorkflow = useWorkflowStore((state) => state.importWorkflow)
  const [copied, setCopied] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)

  const exportedJson = useMemo(
    () => serializeWorkflow({ nodes, edges }),
    [edges, nodes],
  )

  const copyJson = async () => {
    await navigator.clipboard.writeText(exportedJson)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  const importJson = () => {
    try {
      const workflow = parseWorkflowJson(importText)
      importWorkflow(workflow)
      setImportError(null)
      setImportText('')
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Invalid workflow JSON.')
    }
  }

  return (
    <section className="panel-section">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">JSON</p>
          <h3 className="text-base font-semibold text-zinc-950">Export and import</h3>
        </div>
        <button className="secondary-button" onClick={copyJson} type="button">
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <textarea
        className="mt-3 h-44 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-100 outline-none"
        readOnly
        value={exportedJson}
      />

      <div className="mt-4 space-y-2">
        <textarea
          className="form-input min-h-24 font-mono text-xs"
          onChange={(event) => setImportText(event.target.value)}
          placeholder="Paste workflow JSON"
          value={importText}
        />
        {importError && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {importError}
          </p>
        )}
        <button
          className="secondary-button w-full justify-center"
          disabled={!importText.trim()}
          onClick={importJson}
          type="button"
        >
          <Upload size={15} />
          Import JSON
        </button>
      </div>
    </section>
  )
}
