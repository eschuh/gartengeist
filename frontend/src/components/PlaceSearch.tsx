import { useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { PlaceResult } from '../api/types'
import { inputClass, secondaryButtonClass } from './styles'

interface PlaceSearchProps {
  selected: PlaceResult | null
  onSelect: (place: PlaceResult) => void
}

export default function PlaceSearch({ selected, onSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Suche nur auf Knopfdruck – Nominatim erlaubt max. 1 Anfrage pro Sekunde
  async function handleSearch(event: FormEvent) {
    event.preventDefault()
    if (query.trim().length < 2) return
    setSearching(true)
    setError(null)
    try {
      setResults(await api<PlaceResult[]>(`/api/garten/ortssuche?q=${encodeURIComponent(query.trim())}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suche fehlgeschlagen')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className={inputClass}
          placeholder="PLZ oder Ort"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          enterKeyHint="search"
          autoComplete="postal-code"
        />
        <button type="submit" disabled={searching} className={secondaryButtonClass}>
          {searching ? '…' : 'Suchen'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {results && results.length === 0 && (
        <p className="mt-3 text-sm">Nichts gefunden. Probier die PLZ oder einen anderen Ortsnamen.</p>
      )}

      {results && results.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {results.map((place) => {
            const isSelected =
              selected?.latitude === place.latitude && selected?.longitude === place.longitude
            return (
              <li key={`${place.latitude},${place.longitude}`}>
                <button
                  type="button"
                  onClick={() => onSelect(place)}
                  className={`min-h-12 w-full rounded-xl border px-4 py-2 text-left ${
                    isSelected ? 'border-accent bg-accent-light' : 'border-border bg-surface'
                  }`}
                >
                  <span className="block font-medium text-heading">{place.name}</span>
                  <span className="block text-xs">{place.description}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
