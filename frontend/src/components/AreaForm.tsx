import { useState, type FormEvent } from 'react'
import { areaTypes, type AreaInput, type AreaType } from '../api/types'
import { inputClass, labelClass, primaryButtonClass } from './styles'

interface AreaFormProps {
  initial?: AreaInput
  submitLabel: string
  submitting?: boolean
  // Vorschlag für den Namen, wenn der Typ gewechselt wird (z.B. „Beet 3“)
  suggestName?: (type: AreaType) => string
  onSubmit: (area: AreaInput) => void | Promise<void>
}

// Deutsche Tastaturen liefern Komma als Dezimaltrenner
function parseMeters(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return null
  const number = Number(normalized)
  return Number.isFinite(number) && number > 0 ? number : NaN
}

function formatMeters(value: number | null | undefined): string {
  return value == null ? '' : String(value).replace('.', ',')
}

export default function AreaForm({ initial, submitLabel, submitting, suggestName, onSubmit }: AreaFormProps) {
  const initialType = initial?.type ?? 'freiland'
  const [type, setType] = useState<AreaType>(initialType)
  const [name, setName] = useState(initial?.name ?? suggestName?.(initialType) ?? '')
  const [nameTouched, setNameTouched] = useState(initial !== undefined)
  const [width, setWidth] = useState(formatMeters(initial?.width))
  const [length, setLength] = useState(formatMeters(initial?.length))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [error, setError] = useState<string | null>(null)

  function selectType(next: AreaType) {
    setType(next)
    if (!nameTouched && suggestName) setName(suggestName(next))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const parsedWidth = parseMeters(width)
    const parsedLength = parseMeters(length)
    if (Number.isNaN(parsedWidth) || Number.isNaN(parsedLength)) {
      setError('Maße bitte als Zahl in Metern angeben, z.B. 1,2')
      return
    }
    if ((parsedWidth === null) !== (parsedLength === null)) {
      setError('Bitte Breite und Länge angeben – oder beide leer lassen.')
      return
    }
    setError(null)
    await onSubmit({
      name: name.trim(),
      type,
      width: parsedWidth,
      length: parsedLength,
      description: description.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset>
        <legend className={labelClass}>Art</legend>
        <div className="grid grid-cols-2 gap-2">
          {areaTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => selectType(t.value)}
              aria-pressed={type === t.value}
              className={`min-h-12 rounded-xl border px-3 text-sm font-medium ${
                type === t.value ? 'border-accent bg-accent-light text-heading' : 'border-border bg-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="area-name" className={labelClass}>
          Name
        </label>
        <input
          id="area-name"
          className={inputClass}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setNameTouched(true)
          }}
          required
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="area-width" className={labelClass}>
            Breite (m)
          </label>
          <input
            id="area-width"
            className={inputClass}
            inputMode="decimal"
            placeholder="z.B. 1,2"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="area-length" className={labelClass}>
            Länge (m)
          </label>
          <input
            id="area-length"
            className={inputClass}
            inputMode="decimal"
            placeholder="z.B. 4"
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="area-description" className={labelClass}>
          Beschreibung <span className="font-normal text-text">(optional)</span>
        </label>
        <textarea
          id="area-description"
          className={`${inputClass} min-h-20 py-3`}
          placeholder="Lage, Boden, Besonderheiten …"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? '…' : submitLabel}
      </button>
    </form>
  )
}
