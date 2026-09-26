import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Planting } from '../api/plants'
import type { Area } from '../api/types'
import AreaCard from '../components/AreaCard'
import { primaryButtonClass, secondaryButtonClass } from '../components/styles'
import { useGarden } from '../garden/useGarden'

export default function GardenPage() {
  const { garden } = useGarden()
  const [areas, setAreas] = useState<Area[] | null>(null)
  const [plantings, setPlantings] = useState<Planting[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Area[]>(`/api/flaechen?includeArchived=${showArchived}`)
      .then(setAreas)
      .catch((err) => setError(err instanceof Error ? err.message : 'Flächen konnten nicht geladen werden'))
  }, [showArchived])

  useEffect(() => {
    api<Planting[]>('/api/bepflanzungen')
      .then(setPlantings)
      .catch(() => setPlantings([]))
  }, [])

  function plantingSummary(areaId: string): string | null {
    const names = plantings.filter((p) => p.areaId === areaId).map((p) => p.plantName)
    const unique = [...new Set(names)]
    if (unique.length === 0) return null
    return unique.length <= 3 ? unique.join(', ') : `${unique.slice(0, 3).join(', ')} +${unique.length - 3}`
  }

  const active = areas?.filter((a) => !a.archivedAt) ?? []
  const archived = areas?.filter((a) => a.archivedAt) ?? []
  const totalSize = active.reduce((sum, a) => sum + (a.width ?? 0) * (a.length ?? 0), 0)

  async function reactivate(area: Area) {
    try {
      const updated = await api<Area>(`/api/flaechen/${area.id}/reaktivieren`, { method: 'PATCH' })
      setAreas((prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reaktivieren fehlgeschlagen')
    }
  }

  return (
    <section className="flex flex-col gap-6">
      {garden && (
        <Link
          to="/garten/einstellungen"
          className="flex min-h-16 items-center justify-between rounded-xl bg-accent-light px-4 py-3"
        >
          <span>
            <span className="block font-semibold text-heading">{garden.locationName}</span>
            <span className="block text-xs">
              {garden.householdSize} {garden.householdSize === 1 ? 'Person' : 'Personen'}
              {totalSize > 0 &&
                ` · ${totalSize.toLocaleString('de-DE', { maximumFractionDigits: 1 })} m² Anbaufläche`}
            </span>
          </span>
          <span className="text-sm text-accent">Ändern</span>
        </Link>
      )}

      <div>
        <h1 className="mb-3 text-xl font-semibold text-heading">Flächen</h1>

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        {areas === null && !error && <p className="text-sm">Lädt …</p>}
        {areas !== null && active.length === 0 && (
          <p className="mb-3 text-sm">Noch keine Flächen angelegt.</p>
        )}

        <ul className="flex flex-col gap-2">
          {active.map((area) => (
            <li key={area.id}>
              <Link to={`/garten/flaechen/${area.id}`} className="block">
                <AreaCard
                  area={area}
                  subtitle={plantingSummary(area.id)}
                  action={<span className="text-xl text-text">›</span>}
                />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link to="/garten/flaechen/neu" className={`${secondaryButtonClass} flex items-center justify-center`}>
            + Fläche
          </Link>
          <Link to="/garten/katalog" className={`${primaryButtonClass} flex items-center justify-center`}>
            Pflanzen-Katalog
          </Link>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="min-h-11 text-sm text-accent"
        >
          {showArchived ? 'Archivierte ausblenden' : 'Archivierte Flächen anzeigen'}
        </button>
        {showArchived && archived.length === 0 && areas !== null && (
          <p className="text-sm">Keine archivierten Flächen.</p>
        )}
        {showArchived && archived.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2 opacity-70">
            {archived.map((area) => (
              <li key={area.id}>
                <AreaCard
                  area={area}
                  action={
                    <button
                      type="button"
                      onClick={() => reactivate(area)}
                      className="min-h-11 px-2 text-sm text-accent"
                    >
                      Wiederherstellen
                    </button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
