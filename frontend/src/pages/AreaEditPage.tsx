import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { suggestAreaName, type Area, type AreaInput } from '../api/types'
import AreaForm from '../components/AreaForm'

export default function AreaEditPage() {
  const { id } = useParams()
  const isNew = id === undefined
  const navigate = useNavigate()

  const [area, setArea] = useState<Area | null>(null)
  const [existingNames, setExistingNames] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) {
      api<Area[]>('/api/flaechen')
        .then((areas) => setExistingNames(areas.map((a) => a.name)))
        .catch(() => setExistingNames([]))
    } else {
      api<Area>(`/api/flaechen/${id}`)
        .then(setArea)
        .catch((err) => setError(err instanceof Error ? err.message : 'Fläche nicht gefunden'))
    }
  }, [id, isNew])

  async function save(input: AreaInput) {
    setSaving(true)
    setError(null)
    try {
      await api<Area>(isNew ? '/api/flaechen' : `/api/flaechen/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(input),
      })
      navigate('/garten')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
      setSaving(false)
    }
  }

  async function archive() {
    if (!area || !confirm(`„${area.name}“ archivieren? Du kannst sie später wiederherstellen.`)) return
    try {
      await api(`/api/flaechen/${area.id}`, { method: 'DELETE' })
      navigate('/garten')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archivieren fehlgeschlagen')
    }
  }

  const ready = isNew ? existingNames !== null : area !== null

  return (
    <section>
      <Link to="/garten" className="mb-2 inline-flex min-h-11 items-center text-sm text-accent">
        ‹ Garten
      </Link>
      <h1 className="mb-4 text-xl font-semibold text-heading">{isNew ? 'Neue Fläche' : area?.name ?? 'Fläche'}</h1>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      {!ready && !error && <p className="text-sm">Lädt …</p>}

      {ready && (
        <AreaForm
          initial={area ?? undefined}
          submitLabel={isNew ? 'Anlegen' : 'Speichern'}
          submitting={saving}
          suggestName={isNew ? (type) => suggestAreaName(type, existingNames ?? []) : undefined}
          onSubmit={save}
        />
      )}

      {area && !area.archivedAt && (
        <button type="button" onClick={archive} className="mt-6 min-h-11 w-full text-sm text-danger">
          Fläche archivieren
        </button>
      )}
    </section>
  )
}
