import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import {
  companionReport,
  estimateHarvest,
  formatDate,
  inWindow,
  todayIso,
  usedAreaM2,
  type EndPlantingResult,
  type Plant,
  type Planting,
  type PlantingInput,
} from '../api/plants'
import { areaSizeM2, type Area } from '../api/types'
import { useCatalog } from '../api/useCatalog'
import ClearPlantingSheet from '../components/ClearPlantingSheet'
import PlantingHistory from '../components/PlantingHistory'
import PlantPicker from '../components/PlantPicker'
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../components/styles'

const ROTATION_YEARS = 3

// Neu: /garten/flaechen/:areaId/bepflanzen – Bearbeiten: /garten/bepflanzungen/:id
export default function PlantingFormPage() {
  const { areaId: areaIdParam, id } = useParams()
  const isNew = id === undefined
  const navigate = useNavigate()
  const { plants: catalog, error: catalogError } = useCatalog()
  // Aus den Nachkultur-Empfehlungen: ?pflanze=<id>&aktion=säen|pflanzen
  const [searchParams] = useSearchParams()
  const presetPlantId = isNew ? searchParams.get('pflanze') : null
  const presetAction = searchParams.get('aktion')
  const [presetDismissed, setPresetDismissed] = useState(false)
  const [clearing, setClearing] = useState(false)

  const [existing, setExisting] = useState<Planting | null>(null)
  const [area, setArea] = useState<Area | null>(null)
  const [areaPlantings, setAreaPlantings] = useState<Planting[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [pickedPlant, setPickedPlant] = useState<Plant | null>(null)
  const [variety, setVariety] = useState('')
  const [count, setCount] = useState('')
  const [rows, setRows] = useState('')
  const [sowingDate, setSowingDate] = useState(presetPlantId && presetAction === 'säen' ? todayIso() : '')
  const [plantingDate, setPlantingDate] = useState(presetPlantId && presetAction === 'pflanzen' ? todayIso() : '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Daten laden: beim Bearbeiten zuerst die Bepflanzung, daraus die Fläche
  useEffect(() => {
    async function load() {
      let areaId = areaIdParam
      if (!isNew) {
        const planting = await api<Planting>(`/api/bepflanzungen/${id}`)
        setExisting(planting)
        setVariety(planting.variety ?? '')
        setCount(planting.count?.toString() ?? '')
        setRows(planting.rows?.toString() ?? '')
        setSowingDate(planting.sowingDate ?? '')
        setPlantingDate(planting.plantingDate ?? '')
        setNotes(planting.notes ?? '')
        areaId = planting.areaId
      }
      const [loadedArea, loadedPlantings] = await Promise.all([
        api<Area>(`/api/flaechen/${areaId}`),
        api<Planting[]>(`/api/bepflanzungen?flaecheId=${areaId}&includeEnded=true`),
      ])
      setArea(loadedArea)
      setAreaPlantings(loadedPlantings)
    }
    load().catch((err) => setLoadError(err instanceof Error ? err.message : 'Laden fehlgeschlagen'))
  }, [areaIdParam, id, isNew])

  // Neu: vom Nutzer gewählt oder aus der Empfehlung vorbelegt.
  // Bearbeiten: die Pflanze der bestehenden Bepflanzung (nicht änderbar).
  const presetPlant = presetPlantId && !presetDismissed ? (catalog?.find((p) => p.id === presetPlantId) ?? null) : null
  const plant =
    pickedPlant ??
    presetPlant ??
    (existing && catalog ? (catalog.find((p) => p.id === existing.plantId) ?? null) : null)

  const others = useMemo(
    () => (areaPlantings ?? []).filter((p) => p.id !== existing?.id),
    [areaPlantings, existing],
  )
  const neighbors = useMemo(() => {
    const activeIds = new Set(others.filter((p) => !p.endedOn).map((p) => p.plantId))
    return (catalog ?? []).filter((p) => activeIds.has(p.id))
  }, [others, catalog])

  function selectPlant(selected: Plant) {
    setPickedPlant(selected)
    if (isNew && !sowingDate && !plantingDate) {
      // Vorschlag: im Pflanzmonat ist „heute gepflanzt“ wahrscheinlicher als „heute gesät“
      const month = new Date().getMonth() + 1
      if (inWindow(month, selected.plantingOut)) setPlantingDate(todayIso())
      else setSowingDate(todayIso())
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!plant || !area) return
    const parsedCount = count.trim() ? Number(count) : null
    const parsedRows = rows.trim() ? Number(rows) : null
    const invalid = (n: number | null) => n !== null && (!Number.isInteger(n) || n < 1)
    if (invalid(parsedCount) || invalid(parsedRows)) {
      setError('Reihen und Pflanzen bitte als ganze Zahl angeben.')
      return
    }
    setSaving(true)
    setError(null)
    const input: PlantingInput = {
      areaId: area.id,
      plantId: plant.id,
      variety: variety.trim() || null,
      count: parsedCount,
      rows: parsedRows,
      sowingDate: sowingDate || null,
      plantingDate: plantingDate || null,
      notes: notes.trim() || null,
    }
    try {
      await api<Planting>(isNew ? '/api/bepflanzungen' : `/api/bepflanzungen/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(input),
      })
      navigate(`/garten/flaechen/${area.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
      setSaving(false)
    }
  }

  function handleCleared(result: EndPlantingResult) {
    setClearing(false)
    navigate(`/garten/flaechen/${result.ended.areaId}`, { state: { justFreed: result.areaFree } })
  }

  async function deletePlanting() {
    if (!existing || !confirm(`Eintrag „${existing.plantName}“ endgültig löschen? Nur für Fehleinträge – sonst lieber „Abräumen“.`)) return
    try {
      await api(`/api/bepflanzungen/${existing.id}`, { method: 'DELETE' })
      navigate(`/garten/flaechen/${existing.areaId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  const errorMessage = loadError ?? catalogError
  if (errorMessage) return <p className="text-sm text-danger">{errorMessage}</p>
  if (!catalog || !area || !areaPlantings || (!isNew && !plant)) return <p className="text-sm">Lädt …</p>

  const backLink = (
    <Link to={`/garten/flaechen/${area.id}`} className="mb-2 inline-flex min-h-11 items-center text-sm text-accent">
      ‹ {area.name}
    </Link>
  )

  // Schritt 1: Pflanze wählen
  if (!plant) {
    return (
      <section>
        {backLink}
        <h1 className="mb-4 text-xl font-semibold text-heading">Was pflanzt du?</h1>
        <PlantPicker plants={catalog} neighbors={neighbors} onSelect={selectPlant} />
      </section>
    )
  }

  const companions = companionReport(plant, neighbors)
  const rotationConflicts = findRotationConflicts(plant, area, others, catalog)
  const harvest = estimateHarvest(plant, sowingDate || null, plantingDate || null)
  // Platz auf dem noch freien Teil der Fläche (laufende Kulturen mit bekannter Anzahl abgezogen)
  const areaM2 = areaSizeM2(area)
  const longSide = area.width != null && area.length != null ? Math.max(area.width, area.length) : null
  const usedM2 = others
    .filter((p) => !p.endedOn)
    .reduce((sum, p) => sum + (usedAreaM2(p, catalog.find((c) => c.id === p.plantId), longSide) ?? 0), 0)
  const freeM2 = areaM2 !== null ? Math.max(0, areaM2 - usedM2) : null
  const fitsPlants = freeM2 && plant.spacePerPlantM2 ? Math.floor(freeM2 / plant.spacePerPlantM2) : null
  // Reihen laufen entlang der langen Seite; jede belegt einen Reihenabstand
  const fitsRows = freeM2 && longSide && plant.rowSpacingCm ? Math.floor(freeM2 / ((plant.rowSpacingCm / 100) * longSide)) : null
  const fmtM = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 1 })
  const capacity = [
    fitsRows ? `ca. ${fitsRows} ${fitsRows === 1 ? 'Reihe' : 'Reihen'} à ${fmtM(longSide!)} m (${plant.rowSpacingCm} cm Abstand)` : null,
    fitsPlants ? `ca. ${fitsPlants} Pflanzen` : null,
  ].filter(Boolean)
  const spaceHint =
    capacity.length === 0
      ? null
      : `${usedM2 > 0 ? `Auf dem freien Teil (ca. ${fmtM(freeM2!)} m²)` : 'Auf der Fläche'} ist Platz für ${capacity.join(' bzw. ')}.`

  return (
    <section>
      {backLink}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-heading">{plant.name}</h1>
          <p className="text-sm">auf {area.name}</p>
        </div>
        {isNew && (
          <button
            type="button"
            onClick={() => {
              setPickedPlant(null)
              setPresetDismissed(true)
            }}
            className="min-h-11 text-sm text-accent"
          >
            Andere Pflanze
          </button>
        )}
      </div>

      {existing && <PlantingHistory plantingId={existing.id} />}

      <div className="mb-5 flex flex-col gap-2">
        {companions.bad.length > 0 && (
          <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
            Schlechte Nachbarn auf dieser Fläche: {companions.bad.join(', ')}
          </p>
        )}
        {companions.good.length > 0 && (
          <p className="rounded-xl bg-accent-light px-4 py-3 text-sm text-heading">
            Gute Nachbarn: {companions.good.join(', ')}
          </p>
        )}
        {rotationConflicts.length > 0 && (
          <p className="rounded-xl bg-amber-500/15 px-4 py-3 text-sm text-heading">
            Fruchtfolge: Hier standen in den letzten {ROTATION_YEARS} Jahren schon {plant.family} (
            {rotationConflicts.join(', ')}). Besser eine andere Fläche wählen.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="variety" className={labelClass}>
            Sorte <span className="font-normal text-text">(optional)</span>
          </label>
          <input
            id="variety"
            className={inputClass}
            placeholder="z.B. Ochsenherz"
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
            maxLength={100}
          />
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rows" className={labelClass}>
                Reihen <span className="font-normal text-text">(optional)</span>
              </label>
              <input id="rows" className={inputClass} inputMode="numeric" value={rows} onChange={(e) => setRows(e.target.value)} />
            </div>
            <div>
              <label htmlFor="count" className={labelClass}>
                Pflanzen <span className="font-normal text-text">(optional)</span>
              </label>
              <input id="count" className={inputClass} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
            </div>
          </div>
          {spaceHint && <p className="mt-1 text-xs">{spaceHint}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sowing" className={labelClass}>
              Gesät am
            </label>
            <input
              id="sowing"
              type="date"
              className={inputClass}
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="planting" className={labelClass}>
              Gepflanzt am
            </label>
            <input
              id="planting"
              type="date"
              className={inputClass}
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
            />
          </div>
        </div>

        {harvest && <p className="text-sm">Voraussichtliche Ernte ab ca. <strong className="text-heading">{formatDate(harvest)}</strong></p>}
        {plant.perennial && !harvest && <p className="text-sm">Mehrjährig – Ernte laut Kalender im Katalog.</p>}

        <div>
          <label htmlFor="notes" className={labelClass}>
            Notizen <span className="font-normal text-text">(optional)</span>
          </label>
          <textarea
            id="notes"
            className={`${inputClass} min-h-20 py-3`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Speichert …' : isNew ? 'Eintragen' : 'Speichern'}
        </button>
      </form>

      {existing && (
        <div className="mt-8 flex flex-col gap-3">
          {!existing.endedOn && (
            <button type="button" onClick={() => setClearing(true)} className={secondaryButtonClass}>
              🧹 Abräumen
            </button>
          )}
          <button type="button" onClick={deletePlanting} className="min-h-11 text-sm text-danger">
            Eintrag löschen
          </button>
        </div>
      )}

      {clearing && existing && (
        <ClearPlantingSheet planting={existing} onDone={handleCleared} onClose={() => setClearing(false)} />
      )}
    </section>
  )
}

// Einfache Fruchtfolge-Regel: gleiche Pflanzenfamilie als Vorkultur auf derselben Fläche in den letzten Jahren.
// Vorkultur = bereits beendet oder aus einem früheren Jahr; was gerade gleichzeitig wächst, ist Mischkultur.
// Das Tomatenhaus ist bewusst für Tomaten da – dort keine Warnung.
function findRotationConflicts(plant: Plant, area: Area, others: Planting[], catalog: Plant[]): string[] {
  if (plant.perennial || area.type === 'tomatenhaus') return []
  const currentYear = new Date().getFullYear()
  const names = new Set<string>()
  for (const other of others) {
    const otherPlant = catalog.find((p) => p.id === other.plantId)
    if (!otherPlant || otherPlant.family !== plant.family || otherPlant.perennial) continue
    const year = Number((other.plantingDate ?? other.sowingDate ?? other.createdAt).slice(0, 4))
    const isPreviousCrop = other.endedOn !== null || year < currentYear
    if (isPreviousCrop && year >= currentYear - ROTATION_YEARS) names.add(otherPlant.name)
  }
  return [...names]
}
