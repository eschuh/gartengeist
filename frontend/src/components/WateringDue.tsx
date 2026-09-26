import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { deleteEntries, quickAction } from '../api/journal'
import type { WateringStatus } from '../api/tasks'
import UndoToast from './UndoToast'

// Flächen, die gegossen werden sollten – mit 1-Tap „Gegossen“
export default function WateringDue({ compact = false }: { compact?: boolean }) {
  const [statuses, setStatuses] = useState<WateringStatus[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ message: string; ids: string[] } | null>(null)

  const load = useCallback(() => {
    api<WateringStatus[]>('/api/giessen')
      .then(setStatuses)
      .catch(() => setStatuses([]))
  }, [])

  useEffect(load, [load])
  const dismissUndo = useCallback(() => setUndo(null), [])

  async function water(areaIds: string[], label: string) {
    setBusy(areaIds.join())
    try {
      const created = await quickAction('gegossen', areaIds)
      setUndo({ message: `💧 ${label} gegossen`, ids: created.map((e) => e.id) })
      load()
    } finally {
      setBusy(null)
    }
  }

  async function undoWatering() {
    if (!undo) return
    const ids = undo.ids
    setUndo(null)
    await deleteEntries(ids).catch(() => undefined)
    load()
  }

  const due = statuses?.filter((s) => s.due) ?? []
  if (due.length === 0) return undo ? <UndoToast message={undo.message} onUndo={undoWatering} onDismiss={dismissUndo} /> : null

  return (
    <div className={compact ? '' : 'rounded-2xl bg-sky-500/10 p-4'}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-heading">💧 Gießen fällig</h2>
        {due.length > 1 && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => water(due.map((s) => s.areaId), `${due.length} Flächen`)}
            className="min-h-10 text-sm text-accent"
          >
            Alle gegossen
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {due.map((s) => (
          <li key={s.areaId} className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-surface px-4 py-2">
            <span className="min-w-0">
              <span className="block font-medium text-heading">{s.areaName}</span>
              <span className="block text-xs">{s.reason}</span>
            </span>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => water([s.areaId], s.areaName)}
              className="min-h-11 shrink-0 rounded-xl bg-sky-600 px-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              Gegossen
            </button>
          </li>
        ))}
      </ul>
      {undo && <UndoToast message={undo.message} onUndo={undoWatering} onDismiss={dismissUndo} />}
    </div>
  )
}
