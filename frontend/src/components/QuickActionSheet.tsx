import { useState } from 'react'
import { entryTypeInfo, quickAction, type JournalEntry } from '../api/journal'
import type { Area } from '../api/types'
import { primaryButtonClass } from './styles'

interface QuickActionSheetProps {
  type: 'gegossen' | 'geduengt'
  areas: Area[]
  onDone: (entries: JournalEntry[]) => void
  onClose: () => void
}

// Schnell-Aktion für mehrere Flächen: Flächen antippen, speichern
export default function QuickActionSheet({ type, areas, onDone, onClose }: QuickActionSheetProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const info = entryTypeInfo(type)
  const allSelected = selected.size === areas.length

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      onDone(await quickAction(type, [...selected]))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="mx-auto w-full max-w-2xl rounded-t-2xl bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-heading">
            {info.icon} {info.label} – wo?
          </h2>
          <button type="button" onClick={onClose} className="min-h-11 px-2 text-sm" aria-label="Abbrechen">
            Abbrechen
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSelected(allSelected ? new Set() : new Set(areas.map((a) => a.id)))}
          className="mb-2 min-h-11 text-sm text-accent"
        >
          {allSelected ? 'Keine' : 'Alle Flächen'}
        </button>

        <div className="mb-4 grid max-h-[50dvh] grid-cols-2 gap-2 overflow-y-auto">
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => toggle(area.id)}
              aria-pressed={selected.has(area.id)}
              className={`min-h-12 rounded-xl border px-3 text-left text-sm font-medium ${
                selected.has(area.id) ? 'border-accent bg-accent-light text-heading' : 'border-border bg-surface'
              }`}
            >
              {area.name}
            </button>
          ))}
        </div>

        {error && <p className="mb-2 text-sm text-danger">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving || selected.size === 0}
          className={`${primaryButtonClass} w-full`}
        >
          {saving ? 'Speichert …' : `${selected.size || ''} ${selected.size === 1 ? 'Fläche' : 'Flächen'} eintragen`}
        </button>
      </div>
    </div>
  )
}
