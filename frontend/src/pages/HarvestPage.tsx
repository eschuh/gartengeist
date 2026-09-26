import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { formatAmount, type HarvestSummaryItem } from '../api/journal'
import { formatDate } from '../api/plants'
import { primaryButtonClass } from '../components/styles'

export default function HarvestPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [items, setItems] = useState<HarvestSummaryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<HarvestSummaryItem[]>(`/api/tagebuch/ernte?jahr=${year}`)
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Ernte konnte nicht geladen werden'))
  }, [year])

  // Gesamtsummen je Einheit über alle Kulturen
  const totals = new Map<string, number>()
  for (const item of items ?? []) totals.set(item.unit, (totals.get(item.unit) ?? 0) + item.total)

  return (
    <section className="flex flex-col gap-5">
      <div>
        <Link to="/tagebuch" className="mb-2 inline-flex min-h-11 items-center text-sm text-accent">
          ‹ Tagebuch
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-heading">Ernte {year}</h1>
          <div className="flex">
            <button type="button" onClick={() => setYear((y) => y - 1)} className="min-h-11 px-3 text-xl" aria-label="Vorjahr">
              ‹
            </button>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              disabled={year >= currentYear}
              className="min-h-11 px-3 text-xl disabled:opacity-30"
              aria-label="Nächstes Jahr"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {items === null && !error && <p className="text-sm">Lädt …</p>}

      {items?.length === 0 && <p className="text-sm">In diesem Jahr ist noch keine Ernte eingetragen.</p>}

      {totals.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {[...totals].map(([unit, total]) => (
            <span key={unit} className="rounded-xl bg-accent-light px-4 py-2 text-lg font-semibold text-heading">
              {formatAmount(total, unit)}
            </span>
          ))}
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={`${item.plantingId}-${item.unit}`}>
              <Link
                to={`/garten/bepflanzungen/${item.plantingId}`}
                className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-heading">
                    {item.plantName}
                    {item.variety && <span className="font-normal text-text"> · {item.variety}</span>}
                  </span>
                  <span className="block text-xs">
                    {item.areaName} · {item.harvestCount}× geerntet, zuletzt {formatDate(item.lastHarvest)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-heading">{formatAmount(item.total, item.unit)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link to="/tagebuch/neu?typ=geerntet" className={`${primaryButtonClass} flex items-center justify-center`}>
        🧺 Ernte eintragen
      </Link>
    </section>
  )
}
