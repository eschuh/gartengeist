import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import {
  daysAgoLabel,
  deleteEntries,
  entryTypeInfo,
  quickAction,
  quickActionTypes,
  type JournalEntry,
  type QuickActionType,
} from '../api/journal'
import { todayIso } from '../api/plants'
import JournalEntryCard from './JournalEntryCard'
import UndoToast from './UndoToast'

const RECENT_COUNT = 5

const actionButton =
  'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl border border-border bg-surface text-xs font-medium text-heading disabled:opacity-60'

// Schnell-Aktionen (1 Tap) und letzte Tagebucheinträge einer Fläche
export default function AreaJournal({ areaId }: { areaId: string }) {
  const [recent, setRecent] = useState<JournalEntry[] | null>(null)
  const [lastWatered, setLastWatered] = useState<JournalEntry | null>(null)
  const [busy, setBusy] = useState(false)
  const [undo, setUndo] = useState<{ message: string; ids: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api<JournalEntry[]>(`/api/tagebuch?flaecheId=${areaId}&limit=${RECENT_COUNT}`)
      .then(setRecent)
      .catch(() => setRecent([]))
    api<JournalEntry[]>(`/api/tagebuch?flaecheId=${areaId}&typ=gegossen&limit=1`)
      .then((entries) => setLastWatered(entries[0] ?? null))
      .catch(() => setLastWatered(null))
  }, [areaId])

  useEffect(load, [load])

  const dismissUndo = useCallback(() => setUndo(null), [])

  async function run(type: QuickActionType) {
    setBusy(true)
    setError(null)
    try {
      const created = await quickAction(type, [areaId])
      const info = entryTypeInfo(type)
      setUndo({ message: `${info.icon} ${info.label} eingetragen`, ids: created.map((e) => e.id) })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  async function undoAction() {
    if (!undo) return
    const ids = undo.ids
    setUndo(null)
    await deleteEntries(ids).catch(() => undefined)
    load()
  }

  const today = todayIso()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="grid grid-cols-4 gap-2">
          {quickActionTypes.map((type) => {
            const info = entryTypeInfo(type)
            return (
              <button key={type} type="button" className={actionButton} onClick={() => run(type)} disabled={busy}>
                <span className="text-lg">{info.icon}</span>
                {info.label}
              </button>
            )
          })}
          <Link to={`/tagebuch/neu?flaeche=${areaId}`} className={actionButton}>
            <span className="text-lg">📷</span>Notiz
          </Link>
        </div>
        <p className="mt-2 text-xs">
          {lastWatered
            ? `Zuletzt gegossen ${daysAgoLabel(lastWatered.date, today)} von ${lastWatered.user.name.split(' ')[0]}`
            : 'Noch kein Gießen eingetragen'}
        </p>
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>

      {recent && recent.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-heading">Tagebuch</h2>
            <span className="text-xs">letzte {Math.min(recent.length, RECENT_COUNT)} Einträge</span>
          </div>
          <div className="flex flex-col gap-2">
            {recent.map((entry) => (
              <JournalEntryCard key={entry.id} entry={entry} showArea={false} />
            ))}
          </div>
        </div>
      )}

      {undo && <UndoToast message={undo.message} onUndo={undoAction} onDismiss={dismissUndo} />}
    </div>
  )
}
