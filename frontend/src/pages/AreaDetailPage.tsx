import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { EndPlantingResult, Planting } from '../api/plants'
import { areaTypeLabel, formatAreaSize, type Area } from '../api/types'
import AreaJournal from '../components/AreaJournal'
import AreaRecommendationsCard from '../components/AreaRecommendationsCard'
import ClearPlantingSheet from '../components/ClearPlantingSheet'
import PlantingCard from '../components/PlantingCard'
import { primaryButtonClass } from '../components/styles'

export default function AreaDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const [area, setArea] = useState<Area | null>(null)
  const [plantings, setPlantings] = useState<Planting[] | null>(null)
  const [showEnded, setShowEnded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clearing, setClearing] = useState<Planting | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  // Gerade frei geworden (hier abgeräumt oder von der Kulturseite kommend)
  const [justFreed, setJustFreed] = useState(Boolean((location.state as { justFreed?: boolean } | null)?.justFreed))

  const load = useCallback(() => {
    Promise.all([
      api<Area>(`/api/flaechen/${id}`),
      api<Planting[]>(`/api/bepflanzungen?flaecheId=${id}&includeEnded=true`),
    ])
      .then(([loadedArea, loadedPlantings]) => {
        setArea(loadedArea)
        setPlantings(loadedPlantings)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Fläche konnte nicht geladen werden'))
  }, [id])

  useEffect(load, [load])

  function handleCleared(result: EndPlantingResult) {
    setClearing(null)
    if (result.areaFree) setJustFreed(true)
    setRefreshKey((k) => k + 1)
    load()
  }

  if (error) return <p className="text-sm text-danger">{error}</p>
  if (!area || !plantings) return <p className="text-sm">Lädt …</p>

  const active = plantings.filter((p) => !p.endedOn)
  const ended = plantings.filter((p) => p.endedOn)
  const size = formatAreaSize(area)

  return (
    <section className="flex flex-col gap-6">
      <div>
        <Link to="/garten" className="mb-2 inline-flex min-h-11 items-center text-sm text-accent">
          ‹ Garten
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-heading">{area.name}</h1>
            <p className="text-sm">
              {areaTypeLabel(area.type)}
              {size && ` · ${size}`}
            </p>
          </div>
          <Link
            to={`/garten/flaechen/${area.id}/bearbeiten`}
            className="inline-flex min-h-11 items-center text-sm text-accent"
          >
            Bearbeiten
          </Link>
        </div>
        {area.description && <p className="mt-2 text-sm">{area.description}</p>}
        {area.archivedAt && <p className="mt-2 text-sm text-danger">Diese Fläche ist archiviert.</p>}
      </div>

      {justFreed && active.length === 0 && (
        <p role="status" className="rounded-xl bg-accent-light px-4 py-3 text-sm font-medium text-heading">
          🧹 {area.name} ist jetzt frei. Unten stehen Vorschläge, was jetzt passt.
        </p>
      )}

      {!area.archivedAt && <AreaJournal key={refreshKey} areaId={area.id} />}

      <div>
        <h2 className="mb-3 font-semibold text-heading">Was wächst hier</h2>
        {active.length === 0 && <p className="mb-3 text-sm">Gerade nichts eingetragen.</p>}
        <ul className="flex flex-col gap-2">
          {active.map((planting) => (
            <li key={planting.id}>
              <PlantingCard planting={planting} onClear={area.archivedAt ? undefined : setClearing} />
            </li>
          ))}
        </ul>
        {!area.archivedAt && (
          <Link
            to={`/garten/flaechen/${area.id}/bepflanzen`}
            className={`${primaryButtonClass} mt-4 flex items-center justify-center`}
          >
            + Pflanze eintragen
          </Link>
        )}
      </div>

      {!area.archivedAt && (
        <AreaRecommendationsCard
          key={`${active.length === 0}-${justFreed}`}
          areaId={area.id}
          refreshKey={refreshKey}
          initiallyOpen={active.length === 0}
        />
      )}

      {ended.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowEnded((v) => !v)} className="min-h-11 text-sm text-accent">
            {showEnded ? 'Frühere Kulturen ausblenden' : `Frühere Kulturen anzeigen (${ended.length})`}
          </button>
          {showEnded && (
            <ul className="mt-2 flex flex-col gap-2 opacity-75">
              {ended.map((planting) => (
                <li key={planting.id}>
                  <PlantingCard planting={planting} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {clearing && <ClearPlantingSheet planting={clearing} onDone={handleCleared} onClose={() => setClearing(null)} />}
    </section>
  )
}
