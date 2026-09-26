import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import {
  entryTypes,
  harvestUnits,
  MAX_PHOTOS,
  uploadPhoto,
  type HarvestUnit,
  type JournalEntry,
  type JournalEntryInput,
  type JournalEntryType,
  type JournalPhoto,
} from '../api/journal'
import { todayIso, type Planting } from '../api/plants'
import type { Area } from '../api/types'
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../components/styles'

interface NewPhoto {
  key: number
  file: File
  preview: string
}

// Neu: /tagebuch/neu?typ=&flaeche=&bepflanzung= – Bearbeiten: /tagebuch/:id
export default function JournalEntryFormPage() {
  const { id } = useParams()
  const isNew = id === undefined
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [areas, setAreas] = useState<Area[] | null>(null)
  const [plantings, setPlantings] = useState<Planting[]>([])
  const [existing, setExisting] = useState<JournalEntry | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [date, setDate] = useState(todayIso())
  const [type, setType] = useState<JournalEntryType>((searchParams.get('typ') as JournalEntryType) || 'notiz')
  const [areaId, setAreaId] = useState(searchParams.get('flaeche') ?? '')
  const [plantingId, setPlantingId] = useState(searchParams.get('bepflanzung') ?? '')
  const [text, setText] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState<HarvestUnit>('kg')
  const [photos, setPhotos] = useState<JournalPhoto[]>([])
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  // Nach dem ersten Speichern eines neuen Eintrags (falls danach ein Foto-Upload scheitert)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const photoKey = useRef(0)

  useEffect(() => {
    Promise.all([api<Area[]>('/api/flaechen'), api<Planting[]>('/api/bepflanzungen?includeEnded=true')])
      .then(([loadedAreas, loadedPlantings]) => {
        setAreas(loadedAreas)
        setPlantings(loadedPlantings)
        // Bei vorgewählter Kultur die Fläche mit auswählen
        const preselected = loadedPlantings.find((p) => p.id === searchParams.get('bepflanzung'))
        if (preselected) setAreaId(preselected.areaId)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Laden fehlgeschlagen'))
  }, [searchParams])

  useEffect(() => {
    if (isNew) return
    api<JournalEntry>(`/api/tagebuch/${id}`)
      .then((entry) => {
        setExisting(entry)
        setDate(entry.date)
        setType(entry.type)
        setAreaId(entry.areaId ?? '')
        setPlantingId(entry.plantingId ?? '')
        setText(entry.text ?? '')
        setAmount(entry.amount?.toString().replace('.', ',') ?? '')
        setUnit(entry.unit ?? 'kg')
        setPhotos(entry.photos)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Eintrag nicht gefunden'))
  }, [id, isNew])

  // Vorschaubilder freigeben: einzeln beim Entfernen, den Rest beim Verlassen der Seite
  const newPhotosRef = useRef(newPhotos)
  useEffect(() => {
    newPhotosRef.current = newPhotos
  }, [newPhotos])
  useEffect(() => () => newPhotosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), [])

  function removeNewPhoto(key: number) {
    setNewPhotos((prev) => {
      const photo = prev.find((p) => p.key === key)
      if (photo) URL.revokeObjectURL(photo.preview)
      return prev.filter((p) => p.key !== key)
    })
  }

  // Zurück zur vorherigen Seite der App – oder zum Tagebuch, wenn die Seite direkt geöffnet wurde
  function goBack() {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (historyIndex > 0) navigate(-1)
    else navigate('/tagebuch', { replace: true })
  }

  // Kulturen der gewählten Fläche; laufende zuerst. Beim Bearbeiten bleibt die gespeicherte Kultur wählbar.
  const plantingOptions = useMemo(
    () =>
      plantings
        .filter((p) => (!areaId || p.areaId === areaId) && (!p.endedOn || p.id === plantingId))
        .sort((a, b) => a.plantName.localeCompare(b.plantName)),
    [plantings, areaId, plantingId],
  )

  const photoCount = photos.length + newPhotos.length

  function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_PHOTOS - photoCount)
    setNewPhotos((prev) => [
      ...prev,
      ...files.map((file) => ({ key: photoKey.current++, file, preview: URL.createObjectURL(file) })),
    ])
    event.target.value = ''
  }

  async function removeExistingPhoto(photo: JournalPhoto) {
    const entryId = id ?? savedId
    if (!entryId || !confirm('Foto löschen?')) return
    try {
      await api(`/api/tagebuch/${entryId}/fotos/${photo.id}`, { method: 'DELETE' })
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsedAmount = amount.trim() ? Number(amount.trim().replace(',', '.')) : null
    if (type === 'geerntet') {
      if (!plantingId) return setError('Bitte die geerntete Kultur auswählen.')
      if (parsedAmount === null || !(parsedAmount > 0)) return setError('Bitte eine Menge angeben.')
    }
    if (type === 'notiz' && !text.trim() && photoCount === 0) {
      return setError('Bitte einen Text oder ein Foto hinzufügen.')
    }

    setError(null)
    setSaving('Speichert …')
    const input: JournalEntryInput = {
      date,
      type,
      text: text.trim() || null,
      areaId: areaId || null,
      plantingId: plantingId || null,
      amount: type === 'geerntet' ? parsedAmount : null,
      unit: type === 'geerntet' ? unit : null,
    }

    const entryId = id ?? savedId
    let saved: JournalEntry
    try {
      saved = await api<JournalEntry>(entryId ? `/api/tagebuch/${entryId}` : '/api/tagebuch', {
        method: entryId ? 'PUT' : 'POST',
        body: JSON.stringify(input),
      })
      setSavedId(saved.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
      setSaving(null)
      return
    }

    // Fotos nacheinander hochladen; bei Fehlern bleibt der Eintrag gespeichert und man kann es erneut versuchen
    for (const [i, photo] of newPhotos.entries()) {
      setSaving(`Foto ${i + 1} von ${newPhotos.length} …`)
      try {
        const uploaded = await uploadPhoto(saved.id, photo.file)
        setPhotos((prev) => [...prev, uploaded])
        removeNewPhoto(photo.key)
      } catch (err) {
        setError(
          `Eintrag gespeichert, aber ein Foto konnte nicht hochgeladen werden (${err instanceof Error ? err.message : 'Fehler'}). Nochmal tippen zum Wiederholen.`,
        )
        setSaving(null)
        return
      }
    }

    goBack()
  }

  async function deleteEntry() {
    if (!existing || !confirm('Eintrag mit allen Fotos löschen?')) return
    try {
      await api(`/api/tagebuch/${existing.id}`, { method: 'DELETE' })
      navigate('/tagebuch', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  if (loadError) return <p className="text-sm text-danger">{loadError}</p>
  if (!areas || (!isNew && !existing)) return <p className="text-sm">Lädt …</p>

  return (
    <section>
      <Link to="/tagebuch" className="mb-2 inline-flex min-h-11 items-center text-sm text-accent">
        ‹ Tagebuch
      </Link>
      <h1 className="mb-4 text-xl font-semibold text-heading">{isNew ? 'Neuer Eintrag' : 'Eintrag bearbeiten'}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-5 gap-1.5">
          {entryTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              aria-pressed={type === t.value}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl border text-xs font-medium ${
                type === t.value ? 'border-accent bg-accent-light text-heading' : 'border-border bg-surface'
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="date" className={labelClass}>
            Datum
          </label>
          <input id="date" type="date" className={inputClass} value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div>
          <label htmlFor="area" className={labelClass}>
            Fläche {type !== 'geerntet' && <span className="font-normal text-text">(optional)</span>}
          </label>
          <select
            id="area"
            className={inputClass}
            value={areaId}
            onChange={(e) => {
              setAreaId(e.target.value)
              setPlantingId('')
            }}
          >
            <option value="">{type === 'geerntet' ? 'Alle Flächen' : 'Ganzer Garten'}</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="planting" className={labelClass}>
            Kultur {type !== 'geerntet' && <span className="font-normal text-text">(optional)</span>}
          </label>
          <select
            id="planting"
            className={inputClass}
            value={plantingId}
            onChange={(e) => {
              setPlantingId(e.target.value)
              const planting = plantings.find((p) => p.id === e.target.value)
              if (planting) setAreaId(planting.areaId)
            }}
            required={type === 'geerntet'}
          >
            <option value="">{plantingOptions.length === 0 ? 'Keine Kulturen eingetragen' : '– auswählen –'}</option>
            {plantingOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.plantName}
                {p.variety ? ` · ${p.variety}` : ''}
                {!areaId ? ` (${p.areaName})` : ''}
              </option>
            ))}
          </select>
        </div>

        {type === 'geerntet' && (
          <div>
            <label htmlFor="amount" className={labelClass}>
              Menge
            </label>
            <div className="flex gap-2">
              <input
                id="amount"
                className={inputClass}
                inputMode="decimal"
                placeholder="z.B. 1,5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="flex shrink-0 gap-1">
                {harvestUnits.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setUnit(u.value)}
                    aria-pressed={unit === u.value}
                    className={`min-h-12 rounded-xl border px-3 text-sm ${
                      unit === u.value ? 'border-accent bg-accent-light font-medium text-heading' : 'border-border bg-surface'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="text" className={labelClass}>
            {type === 'notiz' ? 'Was gibt es Neues?' : 'Notiz'} {type !== 'notiz' && <span className="font-normal text-text">(optional)</span>}
          </label>
          <textarea
            id="text"
            className={`${inputClass} min-h-28 py-3`}
            placeholder={type === 'notiz' ? 'z.B. Erste Blüten an den Tomaten, Blattläuse am Kohl …' : ''}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={5000}
          />
        </div>

        <div>
          <span className={labelClass}>
            Fotos <span className="font-normal text-text">({photoCount}/{MAX_PHOTOS})</span>
          </span>
          {photoCount > 0 && (
            <div className="mb-2 grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg bg-border">
                  <img src={photo.url} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(photo)}
                    className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="Foto löschen"
                  >
                    ×
                  </button>
                </div>
              ))}
              {newPhotos.map((photo) => (
                <div key={photo.key} className="relative aspect-square overflow-hidden rounded-lg bg-border">
                  <img src={photo.preview} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(photo.key)}
                    className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="Foto entfernen"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {photoCount < MAX_PHOTOS && (
            <div className="grid grid-cols-2 gap-2">
              <label className={`${secondaryButtonClass} flex cursor-pointer items-center justify-center`}>
                📷 Kamera
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={addFiles} />
              </label>
              <label className={`${secondaryButtonClass} flex cursor-pointer items-center justify-center`}>
                🖼️ Galerie
                <input type="file" accept="image/*" multiple className="sr-only" onChange={addFiles} />
              </label>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving !== null} className={primaryButtonClass}>
          {saving ?? (isNew ? 'Eintragen' : 'Speichern')}
        </button>
      </form>

      {existing && (
        <button type="button" onClick={deleteEntry} className="mt-6 min-h-11 w-full text-sm text-danger">
          Eintrag löschen
        </button>
      )}
    </section>
  )
}
