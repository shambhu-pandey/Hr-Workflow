import { Plus, Trash2 } from 'lucide-react'
import type { KeyValuePair } from '../../types/workflow'
import { createKeyValuePair } from '../../utils/nodeFactory'

interface KeyValueEditorProps {
  label: string
  onChange: (pairs: KeyValuePair[]) => void
  pairs: KeyValuePair[]
}

export function KeyValueEditor({ label, onChange, pairs }: KeyValueEditorProps) {
  const updatePair = (id: string, patch: Partial<KeyValuePair>) => {
    onChange(
      pairs.map((pair) => (pair.id === id ? { ...pair, ...patch } : pair)),
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-700">{label}</p>
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition hover:border-teal-300 hover:text-teal-700"
          onClick={() => onChange([...pairs, createKeyValuePair()])}
          title="Add field"
          type="button"
        >
          <Plus size={15} />
        </button>
      </div>

      <div className="space-y-2">
        {pairs.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
            No custom fields
          </div>
        )}

        {pairs.map((pair) => (
          <div
            className="grid grid-cols-[1fr_1fr_32px] items-center gap-2"
            key={pair.id}
          >
            <input
              className="form-input"
              onChange={(event) => updatePair(pair.id, { key: event.target.value })}
              placeholder="Key"
              value={pair.key}
            />
            <input
              className="form-input"
              onChange={(event) => updatePair(pair.id, { value: event.target.value })}
              placeholder="Value"
              value={pair.value}
            />
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
              onClick={() => onChange(pairs.filter((item) => item.id !== pair.id))}
              title="Remove field"
              type="button"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
