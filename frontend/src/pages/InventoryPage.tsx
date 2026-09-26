import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { inventoryCategories, type InventoryItem } from '../api/tasks'
import TasksTabs from '../components/TasksTabs'
import { primaryButtonClass } from '../components/styles'

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    api<InventoryItem[]>('/api/vorrat')
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Vorrat konnte nicht geladen werden'))
  }, [])

  const grouped = inventoryCategories
    .map((c) => ({ ...c, items: (items ?? []).filter((i) => i.category === c.value) }))
    .filter((g) => g.items.length > 0)
  const expired = (items ?? []).filter((i) => i.usableUntilYear !== null && i.usableUntilYear < currentYear)

  return (
    <section>
      <TasksTabs />

      <div className="flex flex-col gap-5">
        {error && <p className="text-sm text-danger">{error}</p>}
        {items === null && !error && <p className="text-sm">Lädt …</p>}
        {items?.length === 0 && (
          <p className="text-sm">Noch nichts im Vorrat. Tipp: Saatgut mit Keimfähigkeit (Jahr auf der Tüte) eintragen – abgelaufenes wird hier markiert.</p>
        )}

        {expired.length > 0 && (
          <p className="rounded-xl bg-amber-500/15 px-4 py-3 text-sm text-heading">
            Saatgut über dem Haltbarkeitsjahr: {expired.map((i) => i.name).join(', ')}. Keimprobe machen oder ersetzen.
          </p>
        )}

        {grouped.map((group) => (
          <div key={group.value}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide">{group.label}</h2>
            <ul className="flex flex-col gap-2">
              {group.items.map((item) => {
                const isExpired = item.usableUntilYear !== null && item.usableUntilYear < currentYear
                return (
                  <li key={item.id}>
                    <Link
                      to={`/aufgaben/vorrat/${item.id}`}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-heading">{item.name}</span>
                        {(item.plantName || item.usableUntilYear) && (
                          <span className={`block text-xs ${isExpired ? 'text-danger' : ''}`}>
                            {[item.plantName, item.usableUntilYear && `keimfähig bis ${item.usableUntilYear}`]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </span>
                      {item.quantity && <span className="shrink-0 text-sm">{item.quantity}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        <Link to="/aufgaben/vorrat/neu" className={`${primaryButtonClass} flex items-center justify-center`}>
          + Zum Vorrat hinzufügen
        </Link>
      </div>
    </section>
  )
}
