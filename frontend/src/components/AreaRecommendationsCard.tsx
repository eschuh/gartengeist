import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { AreaRecommendations } from '../api/plants'

interface AreaRecommendationsCardProps {
  areaId: string
  // Neu laden, wenn sich die Kulturen der Fläche geändert haben
  refreshKey: number
  // Direkt aufgeklappt (z.B. wenn die Fläche frei ist). Zum erneuten Aufklappen per key neu mounten.
  initiallyOpen: boolean
}

// „Was passt jetzt hierher?“ – Nachkultur-Vorschläge für die Fläche
export default function AreaRecommendationsCard({ areaId, refreshKey, initiallyOpen }: AreaRecommendationsCardProps) {
  const [data, setData] = useState<AreaRecommendations | null>(null)
  const [open, setOpen] = useState(initiallyOpen)

  useEffect(() => {
    api<AreaRecommendations>(`/api/flaechen/${areaId}/empfehlungen`)
      .then(setData)
      .catch(() => setData(null))
  }, [areaId, refreshKey])

  if (!data) return null

  const subtitle = data.areaFree
    ? `Die Fläche ist frei${data.previousCrop ? ` – zuletzt stand hier ${data.previousCrop}` : ''}.`
    : data.freeM2 !== null && data.freeM2 >= 0.3
      ? `Noch ca. ${data.freeM2.toLocaleString('de-DE')} m² frei.`
      : null

  return (
    <div className={`rounded-2xl p-4 ${data.areaFree ? 'bg-accent-light' : 'border border-border'}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span>
          <span className="block font-semibold text-heading">🌱 Was passt jetzt hierher?</span>
          {subtitle && <span className="block text-xs">{subtitle}</span>}
        </span>
        <span className="text-sm text-accent">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2">
          {data.hint && <p className="text-sm text-heading">{data.hint}</p>}
          {data.items.map((item) => (
            <Link
              key={item.plantId}
              to={`/garten/flaechen/${areaId}/bepflanzen?pflanze=${item.plantId}&aktion=${item.action}`}
              className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-surface px-4 py-2"
            >
              <span className="min-w-0">
                <span className="block font-medium text-heading">{item.plantName}</span>
                <span className="block text-xs">{item.reasons.join(' · ')}</span>
              </span>
              <span className="shrink-0 text-sm text-accent">Eintragen ›</span>
            </Link>
          ))}
          {data.items.length > 0 && (
            <p className="text-[11px]">
              Berücksichtigt Jahreszeit, Frost, Fruchtfolge der letzten 3 Jahre, Nährstoffbedarf und Nachbarn auf der Fläche.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
