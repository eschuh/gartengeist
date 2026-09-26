import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import {
  dayLabel,
  deleteEntries,
  entryTypeInfo,
  entryTypes,
  quickActionTypes,
  type JournalEntry,
  type JournalEntryType,
  type QuickActionType,
} from '../api/journal'
import { todayIso } from '../api/plants'
import type { Area } from '../api/types'
import JournalEntryCard from '../components/JournalEntryCard'
import QuickActionSheet from '../components/QuickActionSheet'
import UndoToast from '../components/UndoToast'
import { inputClass } from '../components/styles'

const PAGE_SIZE = 50

const actionButton =
  'flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface text-sm font-medium text-heading'

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [areaFilter, setAreaFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<JournalEntryType | ''>('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [error, setError] = useState<string | null>(null)
  const [sheet, setSheet] = useState<QuickActionType | null>(null)
  const [undo, setUndo] = useState<{ message: string; ids: string[] } | null>(null)

  const load = useCallback(() => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (areaFilter) params.set('flaecheId', areaFilter)
    if (typeFilter) params.set('typ', typeFilter)
    api<JournalEntry[]>(`/api/tagebuch?${params}`)
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : 'Tagebuch konnte nicht geladen werden'))
  }, [areaFilter, typeFilter, limit])

  useEffect(load, [load])

  useEffect(() => {
    api<Area[]>('/api/flaechen')
      .then(setAreas)
      .catch(() => setAreas([]))
  }, [])

  const dismissUndo = useCallback(() => setUndo(null), [])

  async function undoQuickAction() {
    if (!undo) return
    const ids = undo.ids
    setUndo(null)
    await deleteEntries(ids).catch(() => undefined)
    load()
  }

  const today = todayIso()
  const groups: { date: string; entries: JournalEntry[] }[] = []
  for (const entry of entries ?? []) {
    const last = groups[groups.length - 1]
    if (last?.date === entry.date) last.entries.push(entry)
    else groups.push({ date: entry.date, entries: [entry] })
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-heading">Tagebuch</h1>
        <Link to="/tagebuch/ernte" className="inline-flex min-h-11 items-center text-sm text-accent">
          Ernte-Übersicht
        </Link>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {quickActionTypes.map((type) => {
          const info = entryTypeInfo(type)
          return (
            <button key={type} type="button" className={`${actionButton} col-span-2`} onClick={() => setSheet(type)}>
              <span className="text-xl">{info.icon}</span>
              {info.label}
            </button>
          )
        })}
        <Link to="/tagebuch/neu?typ=geerntet" className={`${actionButton} col-span-3`}>
          <span className="text-xl">🧺</span>Ernte
        </Link>
        <Link to="/tagebuch/neu" className={`${actionButton} col-span-3`}>
          <span className="text-xl">📷</span>Eintrag
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <select
          className={inputClass}
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          aria-label="Nach Fläche filtern"
        >
          <option value="">Alle Flächen</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {[{ value: '' as const, label: 'Alles', icon: '' }, ...entryTypes].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTypeFilter(t.value)}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-sm ${
                typeFilter === t.value ? 'border-accent bg-accent-light font-medium text-heading' : 'border-border bg-surface'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {entries === null && !error && <p className="text-sm">Lädt …</p>}
      {entries?.length === 0 && (
        <p className="text-sm">
          Noch keine Einträge{areaFilter || typeFilter ? ' für diesen Filter' : ''}. Tipp oben auf eine Aktion oder
          „Eintrag“, um loszulegen.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.date}>
          <h2 className="mb-2 text-sm font-semibold text-heading">{dayLabel(group.date, today)}</h2>
          <div className="flex flex-col gap-2">
            {group.entries.map((entry) => (
              <JournalEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}

      {entries && entries.length >= limit && (
        <button type="button" onClick={() => setLimit((l) => l + PAGE_SIZE)} className="min-h-11 text-sm text-accent">
          Ältere Einträge laden
        </button>
      )}

      {sheet && (
        <QuickActionSheet
          type={sheet}
          areas={areas}
          onClose={() => setSheet(null)}
          onDone={(created) => {
            setSheet(null)
            setUndo({
              message: `${created.length} ${created.length === 1 ? 'Fläche' : 'Flächen'} eingetragen`,
              ids: created.map((e) => e.id),
            })
            load()
          }}
        />
      )}
      {undo && <UndoToast message={undo.message} onUndo={undoQuickAction} onDismiss={dismissUndo} />}
    </section>
  )
}
