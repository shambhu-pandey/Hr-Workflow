import type { ReactNode } from 'react'

interface FieldShellProps {
  children: ReactNode
  helpText?: string
  label: string
}

export function FieldShell({ children, helpText, label }: FieldShellProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-700">{label}</span>
      <span className="mt-1 block">{children}</span>
      {helpText && <span className="mt-1 block text-xs text-zinc-500">{helpText}</span>}
    </label>
  )
}

interface TextInputProps {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'date'
  value: string
}

export function TextInput({
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: TextInputProps) {
  return (
    <FieldShell label={label}>
      <input
        className="form-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </FieldShell>
  )
}

interface TextAreaInputProps {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}

export function TextAreaInput({
  label,
  onChange,
  placeholder,
  value,
}: TextAreaInputProps) {
  return (
    <FieldShell label={label}>
      <textarea
        className="form-input min-h-24 resize-y"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </FieldShell>
  )
}

interface NumberInputProps {
  label: string
  min?: number
  onChange: (value: number) => void
  value: number
}

export function NumberInput({ label, min, onChange, value }: NumberInputProps) {
  return (
    <FieldShell label={label}>
      <input
        className="form-input"
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </FieldShell>
  )
}

interface SelectInputProps {
  children: ReactNode
  label: string
  onChange: (value: string) => void
  value: string
}

export function SelectInput({ children, label, onChange, value }: SelectInputProps) {
  return (
    <FieldShell label={label}>
      <select
        className="form-input"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </FieldShell>
  )
}

interface ToggleInputProps {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}

export function ToggleInput({ checked, label, onChange }: ToggleInputProps) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <span className="text-sm font-semibold text-zinc-700">{label}</span>
      <input
        checked={checked}
        className="h-4 w-4 accent-teal-600"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  )
}
