import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Garden, PlaceResult } from '../api/types'
import HouseholdSizeInput from '../components/HouseholdSizeInput'
import PlaceSearch from '../components/PlaceSearch'
import { labelClass, primaryButtonClass } from '../components/styles'
import { useGarden } from '../garden/useGarden'

export default function GardenSettingsPage() {
  const { garden, setGarden } = useGarden()
  const navigate = useNavigate()

  const [place, setPlace] = useState<PlaceResult | null>(null)
  const [householdSize, setHouseholdSize] = useState(garden?.householdSize ?? 2)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!garden) return null

  async function save() {
    if (!garden) return
    setSaving(true)
    setError(null)
    try {
      const saved = await api<Garden>('/api/garten', {
        method: 'PUT',
        body: JSON.stringify({
          locationName: place?.name ?? garden.locationName,
          postalCode: place ? place.postalCode : garden.postalCode,
          latitude: place?.latitude ?? garden.latitude,
          longitude: place?.longitude ?? garden.longitude,
          householdSize,
        }),
      })
      setGarden(saved)
      navigate('/garten')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
      setSaving(false)
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div>
        <Link to="/garten" className="mb-2 inline-flex min-h-11 items-center text-sm text-accent">
          ‹ Garten
        </Link>
        <h1 className="text-xl font-semibold text-heading">Garten-Einstellungen</h1>
      </div>

      <div>
        <span className={labelClass}>Standort</span>
        <p className="mb-3 text-sm">
          Aktuell: <span className="font-medium text-heading">{place?.name ?? garden.locationName}</span>
          {(place?.postalCode ?? garden.postalCode) && ` (${place?.postalCode ?? garden.postalCode})`}
        </p>
        <PlaceSearch selected={place} onSelect={setPlace} />
      </div>

      <div>
        <span className={labelClass}>Haushaltsgröße</span>
        <div className="py-4">
          <HouseholdSizeInput value={householdSize} onChange={setHouseholdSize} />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button type="button" onClick={save} disabled={saving} className={primaryButtonClass}>
        {saving ? 'Speichert …' : 'Speichern'}
      </button>
    </section>
  )
}
