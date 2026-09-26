import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { formatDate, todayIso, type Planting } from '../api/plants'
import { taskCategoryIcons, type GardenTask, type PreCultivationPlan } from '../api/tasks'
import TasksTabs from '../components/TasksTabs'

const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

interface CalendarItem {
  key: string
  date: string
  kind: 'aufgabe' | 'ernte' | 'voranzucht' | 'pflanzen'
  label: string
  icon: string
  to: string
  done?: boolean
}

const kindStyles: Record<CalendarItem['kind'], { dot: string; icon: string }> = {
  aufgabe: { dot: 'bg-accent', icon: '✔️' },
  ernte: { dot: 'bg-red-500', icon: '🧺' },
  voranzucht: { dot: 'bg-sky-500', icon: '🌱' },
  pflanzen: { dot: 'bg-amber-600', icon: '🪴' },
}

function iso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const today = todayIso()
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selected, setSelected] = useState(today)
  const [tasks, setTasks] = useState<GardenTask[]>([])
  const [plantings, setPlantings] = useState<Planting[]>([])
  const [plan, setPlan] = useState<PreCultivationPlan[]>([])

  // Raster: volle Wochen (Mo–So) rund um den Monat
  const grid = useMemo(() => {
    const start = new Date(month)
    start.setDate(1 - ((month.getDay() + 6) % 7))
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [month])
  const from = iso(grid[0])
  const to = iso(grid[grid.length - 1])

  useEffect(() => {
    api<GardenTask[]>(`/api/aufgaben?von=${from}&bis=${to}`).then(setTasks).catch(() => setTasks([]))
  }, [from, to])

  useEffect(() => {
    api<Planting[]>('/api/bepflanzungen').then(setPlantings).catch(() => setPlantings([]))
    api<PreCultivationPlan[]>('/api/aufgaben/voranzucht-plan').then(setPlan).catch(() => setPlan([]))
  }, [])

  const items = useMemo(() => {
    const list: CalendarItem[] = tasks.map((t) => ({
      key: `t-${t.id}`,
      date: t.dueDate,
      kind: t.category === 'voranzucht' ? 'voranzucht' : 'aufgabe',
      label: t.title,
      icon: taskCategoryIcons[t.category],
      to: `/aufgaben/${t.id}`,
      done: t.doneAt !== null,
    }))
    for (const p of plantings) {
      if (p.expectedHarvest) {
        list.push({
          key: `h-${p.id}`,
          date: p.expectedHarvest,
          kind: 'ernte',
          label: `${p.plantName} erntereif (${p.areaName})`,
          icon: kindStyles.ernte.icon,
          to: `/garten/bepflanzungen/${p.id}`,
        })
      }
    }
    // Voranzucht-Plan nur, solange es noch keine Aufgabe dafür gibt
    for (const p of plan.filter((p) => !p.taskCreated)) {
      const to = `/garten/katalog/${p.plantId}`
      list.push({ key: `v-${p.plantId}`, date: p.sowDate, kind: 'voranzucht', label: `${p.plantName} vorziehen`, icon: kindStyles.voranzucht.icon, to })
      list.push({ key: `a-${p.plantId}`, date: p.plantOutDate, kind: 'pflanzen', label: `${p.plantName} auspflanzen`, icon: kindStyles.pflanzen.icon, to })
    }
    return list
  }, [tasks, plantings, plan])

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of items) map.set(item.date, [...(map.get(item.date) ?? []), item])
    return map
  }, [items])

  const selectedItems = byDate.get(selected) ?? []
  const monthLabel = month.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  function shiftMonth(delta: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1)
    setMonth(next)
    setSelected(iso(next))
  }

  return (
    <section>
      <TasksTabs />

      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shiftMonth(-1)} className="min-h-11 px-3 text-xl" aria-label="Voriger Monat">
          ‹
        </button>
        <h1 className="font-semibold capitalize text-heading">{monthLabel}</h1>
        <button type="button" onClick={() => shiftMonth(1)} className="min-h-11 px-3 text-xl" aria-label="Nächster Monat">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekdays.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
        {grid.map((date) => {
          const key = iso(date)
          const dayItems = byDate.get(key) ?? []
          const inMonth = date.getMonth() === month.getMonth()
          const kinds = [...new Set(dayItems.map((i) => i.kind))]
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-lg text-sm ${
                key === selected ? 'bg-accent-light font-semibold text-heading ring-1 ring-accent' : ''
              } ${inMonth ? 'text-heading' : 'opacity-40'} ${key === today ? 'font-bold underline' : ''}`}
            >
              {date.getDate()}
              <span className="flex h-1.5 gap-0.5">
                {kinds.map((k) => (
                  <span key={k} className={`size-1.5 rounded-full ${kindStyles[k].dot}`} />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {(Object.keys(kindStyles) as CalendarItem['kind'][]).map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`size-2 rounded-full ${kindStyles[k].dot}`} />
            {{ aufgabe: 'Aufgabe', ernte: 'Ernte', voranzucht: 'Vorziehen', pflanzen: 'Auspflanzen' }[k]}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <h2 className="mb-2 font-semibold text-heading">{formatDate(selected)}</h2>
        {selectedItems.length === 0 && <p className="text-sm">Nichts geplant.</p>}
        <ul className="flex flex-col gap-2">
          {selectedItems.map((item) => (
            <li key={item.key}>
              <Link
                to={item.to}
                className={`flex min-h-12 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2 ${
                  item.done ? 'line-through opacity-60' : ''
                }`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span className="text-heading">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
