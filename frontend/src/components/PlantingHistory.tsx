import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { formatAmount, type JournalEntry, type JournalPhoto } from '../api/journal'
import { formatDate } from '../api/plants'
import PhotoViewer from './PhotoViewer'

// Ernte-Summe, Ernte-Button und Foto-Verlauf einer Kultur
export default function PlantingHistory({ plantingId }: { plantingId: string }) {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  useEffect(() => {
    api<JournalEntry[]>(`/api/tagebuch?bepflanzungId=${plantingId}&limit=500`)
      .then(setEntries)
      .catch(() => setEntries([]))
  }, [plantingId])

  if (!entries) return null

  // Ernte-Summe je Einheit (g → kg)
  const totals = new Map<string, number>()
  let harvestCount = 0
  for (const e of entries) {
    if (e.type !== 'geerntet' || e.amount == null || !e.unit) continue
    harvestCount++
    const unit = e.unit === 'g' ? 'kg' : e.unit
    totals.set(unit, (totals.get(unit) ?? 0) + (e.unit === 'g' ? e.amount / 1000 : e.amount))
  }

  // Foto-Verlauf chronologisch (älteste zuerst), jedes Foto mit Datum
  const timeline: (JournalPhoto & { date: string })[] = [...entries]
    .reverse()
    .flatMap((e) => e.photos.map((p) => ({ ...p, date: e.date })))

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-accent-light px-4 py-3">
        <div className="text-sm text-heading">
          {harvestCount === 0 ? (
            'Noch nichts geerntet'
          ) : (
            <>
              <span className="font-semibold">{[...totals].map(([u, t]) => formatAmount(t, u)).join(' + ')}</span>
              <span className="block text-xs text-text">{harvestCount}× geerntet</span>
            </>
          )}
        </div>
        <Link
          to={`/tagebuch/neu?typ=geerntet&bepflanzung=${plantingId}`}
          className="inline-flex min-h-11 shrink-0 items-center rounded-xl bg-accent-strong px-4 text-sm font-semibold text-white dark:text-black"
        >
          🧺 Ernte eintragen
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-heading">Foto-Verlauf</h2>
        <Link to={`/tagebuch/neu?bepflanzung=${plantingId}`} className="inline-flex min-h-11 items-center text-sm text-accent">
          📷 Foto hinzufügen
        </Link>
      </div>
      {timeline.length === 0 ? (
        <p className="-mt-2 text-sm">Noch keine Fotos – so lässt sich die Entwicklung verfolgen.</p>
      ) : (
        <div className="-mx-4 -mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
          {timeline.map((photo, i) => (
            <button key={photo.id} type="button" onClick={() => setViewerIndex(i)} className="w-28 shrink-0 text-left">
              <img src={photo.url} alt="" loading="lazy" className="aspect-square w-full rounded-lg bg-border object-cover" />
              <span className="mt-1 block text-xs">{formatDate(photo.date)}</span>
            </button>
          ))}
        </div>
      )}

      {viewerIndex !== null && (
        <PhotoViewer photos={timeline} index={viewerIndex} onIndexChange={setViewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </div>
  )
}
