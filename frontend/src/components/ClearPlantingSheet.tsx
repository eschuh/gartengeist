import { useState } from 'react'
import { endPlanting, formatNumber, todayIso, type EndPlantingResult, type Planting } from '../api/plants'
import { inputClass, labelClass, primaryButtonClass } from './styles'

interface ClearPlantingSheetProps {
  planting: Planting
  onDone: (result: EndPlantingResult) => void
  onClose: () => void
}

// Kultur abräumen – ganz oder nur einen Teil. Sind Reihen eingetragen, wird nach Reihen aufgeteilt
// (eine bekannte Pflanzenzahl teilt das Backend anteilig mit auf), sonst nach Pflanzen.
export default function ClearPlantingSheet({ planting, onDone, onClose }: ClearPlantingSheetProps) {
  // Reihen in halben Schritten, Pflanzen in ganzen
  const byRows = (planting.rows ?? 0) > 0.5
  const step = byRows ? 0.5 : 1
  const total = byRows ? planting.rows! : (planting.count ?? 0)
  const unit = byRows ? 'Reihen' : 'Pflanzen'
  // Größte Teilmenge, die noch etwas stehen lässt
  const maxAmount = Math.floor((total - 0.001) / step) * step
  const canSplit = maxAmount >= step
  const [partial, setPartial] = useState(false)
  const [amount, setAmount] = useState(Math.min(maxAmount, Math.max(step, Math.round(total / 2 / step) * step)))
  const [date, setDate] = useState(todayIso())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    const part = !partial ? null : byRows ? { rows: amount } : { count: amount }
    try {
      onDone(await endPlanting(planting.id, date, part))
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
              Alle {formatNumber(total)} {unit}
            </button>
            <button type="button" className={choice(partial)} onClick={() => setPartial(true)}>
              Nur ein Teil
            </button>
          </div>
        )}

        {partial && (
          <div className="flex items-center justify-center gap-5">
            <button type="button" className={stepButton} onClick={() => setAmount((a) => a - step)} disabled={amount <= step} aria-label="Weniger">
              −
            </button>
            <span className="w-28 text-center">
              <span className="block text-3xl font-semibold text-heading">{formatNumber(amount)}</span>
              <span className="text-sm">
                von {formatNumber(total)} {unit}
              </span>
            </span>
            <button type="button" className={stepButton} onClick={() => setAmount((a) => a + step)} disabled={amount >= maxAmount} aria-label="Mehr">
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

        {!canSplit && (
          <p className="text-xs">Tipp: Mit eingetragener Anzahl Reihen oder Pflanzen lässt sich auch nur ein Teil abräumen.</p>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="button" onClick={save} disabled={saving} className={primaryButtonClass}>
          {saving ? 'Speichert …' : partial ? `${formatNumber(amount)} ${unit} abräumen` : 'Abräumen'}
        </button>
      </div>
    </div>
  )
}
