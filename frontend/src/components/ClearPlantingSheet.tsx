import { useState } from 'react'
import { endPlanting, todayIso, type EndPlantingResult, type Planting } from '../api/plants'
import { inputClass, labelClass, primaryButtonClass } from './styles'

interface ClearPlantingSheetProps {
  planting: Planting
  onDone: (result: EndPlantingResult) => void
  onClose: () => void
}

// Kultur abräumen – ganz oder (bei mehreren Pflanzen) nur einen Teil
export default function ClearPlantingSheet({ planting, onDone, onClose }: ClearPlantingSheetProps) {
  const total = planting.count ?? 0
  const canSplit = total > 1
  const [partial, setPartial] = useState(false)
  const [count, setCount] = useState(Math.max(1, Math.floor(total / 2)))
  const [date, setDate] = useState(todayIso())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      onDone(await endPlanting(planting.id, date, partial ? count : null))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abräumen fehlgeschlagen')
      setSaving(false)
    }
  }

  const choice = (active: boolean) =>
    `min-h-12 rounded-xl border px-3 text-sm font-medium ${active ? 'border-accent bg-accent-light text-heading' : 'border-border bg-surface'}`
  const stepButton = 'flex size-12 items-center justify-center rounded-full border border-border bg-surface text-xl text-heading disabled:opacity-40'

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-t-2xl bg-bg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-heading">
            🧹 {planting.plantName}
            {planting.variety ? ` · ${planting.variety}` : ''} abräumen
          </h2>
          <button type="button" onClick={onClose} className="min-h-11 px-2 text-sm">
            Abbrechen
          </button>
        </div>

        {canSplit && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={choice(!partial)} onClick={() => setPartial(false)}>
              Alle {total} Pflanzen
            </button>
            <button type="button" className={choice(partial)} onClick={() => setPartial(true)}>
              Nur ein Teil
            </button>
          </div>
        )}

        {partial && (
          <div className="flex items-center justify-center gap-5">
            <button type="button" className={stepButton} onClick={() => setCount((c) => c - 1)} disabled={count <= 1} aria-label="Weniger">
              −
            </button>
            <span className="w-28 text-center">
              <span className="block text-3xl font-semibold text-heading">{count}</span>
              <span className="text-sm">von {total} Pflanzen</span>
            </span>
            <button type="button" className={stepButton} onClick={() => setCount((c) => c + 1)} disabled={count >= total - 1} aria-label="Mehr">
              +
            </button>
          </div>
        )}

        <div>
          <label htmlFor="cleared-on" className={labelClass}>
            Abgeräumt am
          </label>
          <input id="cleared-on" type="date" className={inputClass} value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
        </div>

        {!canSplit && planting.count == null && (
          <p className="text-xs">Tipp: Mit eingetragener Anzahl Pflanzen lässt sich auch nur ein Teil abräumen.</p>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="button" onClick={save} disabled={saving} className={primaryButtonClass}>
          {saving ? 'Speichert …' : partial ? `${count} Pflanzen abräumen` : 'Abräumen'}
        </button>
      </div>
    </div>
  )
}
