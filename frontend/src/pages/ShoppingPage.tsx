import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { shoppingCategories, type ShoppingCategory, type ShoppingItem } from '../api/tasks'
import TasksTabs from '../components/TasksTabs'
import UserAvatar from '../components/UserAvatar'
import { inputClass, primaryButtonClass } from '../components/styles'

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[] | null>(null)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState<ShoppingCategory>('sonstiges')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api<ShoppingItem[]>('/api/einkauf')
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Einkaufsliste konnte nicht geladen werden'))
  }, [])

  useEffect(load, [load])

  async function add(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    try {
      await api('/api/einkauf', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), quantity: quantity.trim() || null, category }),
      })
      setName('')
      setQuantity('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hinzufügen fehlgeschlagen')
    }
  }

  async function toggle(item: ShoppingItem) {
    // Sofort anzeigen, dann speichern
    setItems((prev) => prev?.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)) ?? null)
    try {
      await api(`/api/einkauf/${item.id}/erledigt?wert=${!item.done}`, { method: 'PATCH' })
    } catch {
      load()
    }
  }

  async function clearDone() {
    await api('/api/einkauf/erledigte', { method: 'DELETE' }).catch(() => undefined)
    load()
  }

  const open = items?.filter((i) => !i.done) ?? []
  const done = items?.filter((i) => i.done) ?? []
  const grouped = shoppingCategories
    .map((c) => ({ ...c, items: open.filter((i) => i.category === c.value) }))
    .filter((g) => g.items.length > 0)

  const row = (item: ShoppingItem) => (
    <li key={item.id}>
      <button
        type="button"
        onClick={() => toggle(item)}
        className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-left"
      >
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold ${
            item.done ? 'border-accent bg-accent text-white dark:text-black' : 'border-border'
          }`}
        >
          {item.done && '✓'}
        </span>
        <span className={`min-w-0 flex-1 ${item.done ? 'text-text line-through' : 'text-heading'}`}>
          {item.name}
          {item.quantity && <span className="text-text"> · {item.quantity}</span>}
        </span>
        <UserAvatar user={item.addedBy} size={20} />
      </button>
    </li>
  )

  return (
    <section>
      <TasksTabs />

      <form onSubmit={add} className="mb-5 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            className={inputClass}
            placeholder="Was brauchen wir?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            enterKeyHint="done"
            maxLength={200}
          />
          <input
            className={`${inputClass} w-28`}
            placeholder="Menge"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            maxLength={100}
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {shoppingCategories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-sm ${
                category === c.value ? 'border-accent bg-accent-light font-medium text-heading' : 'border-border bg-surface'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button type="submit" className={primaryButtonClass} disabled={!name.trim()}>
          Hinzufügen
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}
      {items === null && !error && <p className="text-sm">Lädt …</p>}
      {items?.length === 0 && <p className="text-sm">Die Einkaufsliste ist leer.</p>}

      <div className="flex flex-col gap-4">
        {grouped.map((group) => (
          <div key={group.value}>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide">{group.label}</h2>
            <ul className="flex flex-col gap-2">{group.items.map(row)}</ul>
          </div>
        ))}

        {done.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wide">Erledigt</h2>
              <button type="button" onClick={clearDone} className="min-h-10 text-sm text-accent">
                Erledigte entfernen
              </button>
            </div>
            <ul className="flex flex-col gap-2 opacity-70">{done.map(row)}</ul>
          </div>
        )}
      </div>
    </section>
  )
}
