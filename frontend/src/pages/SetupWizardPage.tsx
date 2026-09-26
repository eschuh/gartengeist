import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { suggestAreaName, type Area, type AreaInput, type Garden, type PlaceResult } from '../api/types'
import AreaCard from '../components/AreaCard'
import AreaForm from '../components/AreaForm'
import HouseholdSizeInput from '../components/HouseholdSizeInput'
import PlaceSearch from '../components/PlaceSearch'
import { primaryButtonClass, secondaryButtonClass } from '../components/styles'
import { useGarden } from '../garden/useGarden'

type Step = 'standort' | 'haushalt' | 'flaechen'

const steps: { id: Step; title: string; intro: string }[] = [
  {
    id: 'standort',
    title: 'Wo liegt euer Garten?',
    intro: 'Der Standort bestimmt Wetter, Frostdaten und Aussaatzeiten.',
  },
  {
    id: 'haushalt',
    title: 'Für wie viele Personen?',
    intro: 'Daraus berechnet Gartengeist später, wie viel ihr anbauen solltet.',
  },
  {
    id: 'flaechen',
    title: 'Welche Flächen habt ihr?',
    intro: 'Beete, Gewächshaus, Tomatenhaus, naturnahe Ecken. Du kannst später jederzeit weitere ergänzen.',
  },
]

// Entwurf einer Fläche; id wird gesetzt, sobald sie gespeichert ist (damit ein erneuter Versuch keine Duplikate erzeugt)
type AreaDraft = AreaInput & { key: number; savedId?: string }

export default function SetupWizardPage() {
  const { garden, setGarden } = useGarden()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('standort')
  const [place, setPlace] = useState<PlaceResult | null>(null)
  const [householdSize, setHouseholdSize] = useState(2)
  const [drafts, setDrafts] = useState<AreaDraft[]>([])
  const [formKey, setFormKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (garden === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-sm">Lädt …</div>
  }
  // Schon eingerichtet → direkt zur App
  if (garden) return <Navigate to="/" replace />

  const stepIndex = steps.findIndex((s) => s.id === step)
  const current = steps[stepIndex]

  function addDraft(area: AreaInput) {
    setDrafts((prev) => [...prev, { ...area, key: formKey }])
    setFormKey((k) => k + 1)
  }

  async function finish() {
    if (!place) return
    setSaving(true)
    setError(null)
    try {
      const savedGarden = await api<Garden>('/api/garten', {
        method: 'PUT',
        body: JSON.stringify({
          locationName: place.name,
          postalCode: place.postalCode,
          latitude: place.latitude,
          longitude: place.longitude,
          householdSize,
        }),
      })

      for (const { key, savedId, ...input } of drafts) {
        if (savedId) continue
        const created = await api<Area>('/api/flaechen', { method: 'POST', body: JSON.stringify(input) })
        setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, savedId: created.id } : d)))
      }

      setGarden(savedGarden)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="mb-6 flex gap-2" aria-label={`Schritt ${stepIndex + 1} von ${steps.length}`}>
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-accent' : 'bg-border'}`}
          />
        ))}
      </div>

      <h1 className="text-2xl font-semibold text-heading">{current.title}</h1>
      <p className="mb-6 mt-2 text-sm">{current.intro}</p>

      <div className="flex-1">
        {step === 'standort' && <PlaceSearch selected={place} onSelect={setPlace} />}

        {step === 'haushalt' && (
          <div className="py-8">
            <HouseholdSizeInput value={householdSize} onChange={setHouseholdSize} />
          </div>
        )}

        {step === 'flaechen' && (
          <div className="flex flex-col gap-6">
            {drafts.length > 0 && (
              <ul className="flex flex-col gap-2">
                {drafts.map((draft) => (
                  <li key={draft.key}>
                    <AreaCard
                      area={draft}
                      action={
                        !draft.savedId && (
                          <button
                            type="button"
                            onClick={() => setDrafts((prev) => prev.filter((d) => d.key !== draft.key))}
                            className="min-h-11 px-2 text-sm text-danger"
                            aria-label={`${draft.name} entfernen`}
                          >
                            Entfernen
                          </button>
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            )}

            <div className="rounded-2xl border border-border p-4">
              <h2 className="mb-4 font-semibold text-heading">Fläche hinzufügen</h2>
              <AreaForm
                key={formKey}
                submitLabel="Hinzufügen"
                suggestName={(type) =>
                  suggestAreaName(
                    type,
                    drafts.map((d) => d.name),
                  )
                }
                onSubmit={addDraft}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        {stepIndex > 0 && (
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => setStep(steps[stepIndex - 1].id)}
            disabled={saving}
          >
            Zurück
          </button>
        )}
        {step !== 'flaechen' ? (
          <button
            type="button"
            className={`${primaryButtonClass} flex-1`}
            onClick={() => setStep(steps[stepIndex + 1].id)}
            disabled={step === 'standort' && !place}
          >
            Weiter
          </button>
        ) : (
          <button
            type="button"
            className={`${primaryButtonClass} flex-1`}
            onClick={finish}
            disabled={saving}
          >
            {saving ? 'Speichert …' : drafts.length === 0 ? 'Ohne Flächen fertig' : 'Fertig'}
          </button>
        )}
      </div>
    </div>
  )
}
