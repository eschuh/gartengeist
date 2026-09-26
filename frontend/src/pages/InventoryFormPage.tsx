import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { inventoryCategories, type InventoryCategory, type InventoryInput, type InventoryItem } from '../api/tasks'
import { useCatalog } from '../api/useCatalog'
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from '../components/styles'

export default function InventoryFormPage() {
  const { id } = useParams()
  const isNew = id === undefined
  const navigate = useNavigate()
  const { plants } = useCatalog()

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<InventoryCategory>('saatgut')
  const [quantity, setQuantity] = useState('')
  const [plantId, setPlantId] = useState('')
  const [usableUntil, setUsableUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    api<InventoryItem>(`/api/vorrat/${id}`)
      .then((loaded) => {
        setItem(loaded)
        setName(loaded.name)
        setCategory(loaded.category)
        setQuantity(loaded.quantity ?? '')
        setPlantId(loaded.plantId ?? '')
        setUsableUntil(loaded.usableUntilYear?.toString() ?? '')
        setNotes(loaded.notes ?? '')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Nicht gefunden'))
  }, [id, isNew])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const year = usableUntil.trim() ? Number(usableUntil) : null
    if (year !== null && (!Number.isInteger(year) || year < 2000 || year > 2100)) {
      setError('Haltbarkeit bitte als Jahreszahl angeben, z.B. 2028.')
      return
    }
    setSaving(true)
    setError(null)
    const input: InventoryInput = {
      name: name.trim(),
      quantity: quantity.trim() || null,
      category,
      plantId: category === 'saatgut' && plantId ? plantId : null,
      usableUntilYear: category === 'saatgut' ? year : null,
      notes: notes.trim() || null,
    }
    try {
      await api(isNew ? '/api/vorrat' : `/api/vorrat/${id}`, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(input) })
      navigate('/aufgaben/vorrat')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen')
      setSaving(false)
    }
  }

  async function addToShoppingList() {
    if (!item) return
    const shoppingCategory = item.category === 'saatgut' || item.category === 'duenger' || item.category === 'werkzeug' ? item.category : 'sonstiges'
    try {
      await api('/api/einkauf', { method: 'POST', body: JSON.stringify({ name: item.name, quantity: null, category: shoppingCategory }) })
      setMessage(`„${item.name}“ steht auf der Einkaufsliste.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehlgeschlagen')
    }
  }

  async function remove() {
    if (!item || !confirm(`„${item.name}“ aus dem Vorrat entfernen?`)) return
    await api(`/api/vorrat/${item.id}`, { method: 'DELETE' }).catch(() => undefined)
    navigate('/aufgaben/vorrat', { replace: true })
  }

  if (!isNew && !item) return <p className="text-sm">{error ?? 'Lädt …'}</p>

  return (
    <section>
      <Link to="/aufgaben/vorrat" className="mb-2 inline-flex min-h-11 items-center text-sm text-accent">
        ‹ Vorrat
      </Link>
      <h1 className="mb-4 text-xl font-semibold text-heading">{isNew ? 'Zum Vorrat hinzufügen' : item?.name}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {inventoryCategories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              aria-pressed={category === c.value}
              className={`min-h-12 rounded-xl border text-sm font-medium ${
                category === c.value ? 'border-accent bg-accent-light text-heading' : 'border-border bg-surface'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {category === 'saatgut' && plants && (
          <div>
            <label htmlFor="plant" className={labelClass}>
              Pflanze <span className="font-normal text-text">(optional)</span>
            </label>
            <select
              id="plant"
              className={inputClass}
              value={plantId}
              onChange={(e) => {
                setPlantId(e.target.value)
                const plant = plants.find((p) => p.id === e.target.value)
                if (plant && !name.trim()) setName(plant.name)
              }}
            >
              <option value="">– keine –</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="name" className={labelClass}>
            {category === 'saatgut' ? 'Name / Sorte' : 'Name'}
          </label>
          <input
            id="name"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={category === 'saatgut' ? 'z.B. Tomate Berner Rose' : ''}
            required
            maxLength={200}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="quantity" className={labelClass}>
              Menge
            </label>
            <input
              id="quantity"
              className={inputClass}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="z.B. halbe Tüte"
              maxLength={100}
            />
          </div>
          {category === 'saatgut' && (
            <div>
              <label htmlFor="usable" className={labelClass}>
                Keimfähig bis
              </label>
              <input
                id="usable"
                className={inputClass}
                inputMode="numeric"
                value={usableUntil}
                onChange={(e) => setUsableUntil(e.target.value)}
                placeholder="Jahr"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            Notizen <span className="font-normal text-text">(optional)</span>
          </label>
          <textarea id="notes" className={`${inputClass} min-h-20 py-3`} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? 'Speichert …' : isNew ? 'Hinzufügen' : 'Speichern'}
        </button>
      </form>

      {item && (
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" onClick={addToShoppingList} className={secondaryButtonClass}>
            🛒 Auf die Einkaufsliste
          </button>
          {message && <p className="text-sm text-accent">{message}</p>}
          <button type="button" onClick={remove} className="min-h-11 text-sm text-danger">
            Aus dem Vorrat entfernen
          </button>
        </div>
      )}
    </section>
  )
}
