import { useMemo, useState } from 'react'
import { actionsThisMonth, plantCategories, type Plant, type PlantCategory } from '../api/plants'
import { inputClass } from './styles'

interface PlantPickerProps {
  plants: Plant[]
  onSelect: (plant: Plant) => void
  // Pflanzen, die auf der Fläche bereits stehen – für Mischkultur-Hinweise
  neighbors?: Plant[]
}

export default function PlantPicker({ plants, onSelect, neighbors = [] }: PlantPickerProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PlantCategory | 'jetzt' | null>('jetzt')
  const month = new Date().getMonth() + 1

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return plants.filter((plant) => {
      if (q) return plant.name.toLowerCase().includes(q) || plant.latinName?.toLowerCase().includes(q)
      if (category === 'jetzt') return actionsThisMonth(plant, month).length > 0
      return category === null || plant.category === category
    })
  }, [plants, query, category, month])

  const neighborKeys = new Set(neighbors.map((n) => n.key))
  const isBad = (plant: Plant) =>
    neighbors.some((n) => plant.badCompanions.includes(n.key) || n.badCompanions.includes(plant.key))
  const isGood = (plant: Plant) =>
    !isBad(plant) &&
    neighbors.some((n) => plant.goodCompanions.includes(n.key) || n.goodCompanions.includes(plant.key))

  const chip = (active: boolean) =>
    `min-h-10 shrink-0 rounded-full border px-4 text-sm ${
      active ? 'border-accent bg-accent-light font-medium text-heading' : 'border-border bg-surface'
    }`

  return (
    <div className="flex flex-col gap-3">
      <input
        className={inputClass}
        type="search"
        placeholder="Pflanze suchen …"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {!query && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button type="button" className={chip(category === 'jetzt')} onClick={() => setCategory('jetzt')}>
            Jetzt dran
          </button>
          <button type="button" className={chip(category === null)} onClick={() => setCategory(null)}>
            Alle
          </button>
          {plantCategories.map((c) => (
            <button
              key={c.value}
              type="button"
              className={chip(category === c.value)}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && <p className="text-sm">Keine passende Pflanze gefunden.</p>}

      <ul className="flex flex-col gap-2">
        {filtered.map((plant) => {
          const actions = actionsThisMonth(plant, month)
          const bad = isBad(plant)
          const good = isGood(plant)
          return (
            <li key={plant.id}>
              <button
                type="button"
                onClick={() => onSelect(plant)}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-heading">
                    {plant.name}
                    {neighborKeys.has(plant.key) && <span className="ml-2 text-xs font-normal">steht schon hier</span>}
                  </span>
                  {actions.length > 0 && <span className="block text-xs text-accent">Jetzt {actions.join(' / ')}</span>}
                </span>
                {bad && <span className="shrink-0 rounded-full bg-danger/10 px-2 py-1 text-xs text-danger">schlechter Nachbar</span>}
                {good && <span className="shrink-0 rounded-full bg-accent-light px-2 py-1 text-xs text-accent">guter Nachbar</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
