import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { actionsThisMonth, formatDate, monthShort, todayIso, type Plant, type Planting } from '../api/plants'
import type { Area } from '../api/types'
import { useCatalog } from '../api/useCatalog'
import { FROST_RISK_TEMP, weekdayLabel, type WeatherForecast } from '../api/weather'
import WeatherStrip from '../components/WeatherStrip'
import { useAuth } from '../auth/useAuth'
import { useGarden } from '../garden/useGarden'

const HARVEST_LOOKAHEAD_DAYS = 21
// Im Gewächshaus/Tomatenhaus erst bei echtem Frost warnen
const GREENHOUSE_FROST_TEMP = -1

function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-heading">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function daysBetween(fromIso: string, toIso: string): number {
  const [a, b] = [fromIso, toIso].map((iso) => {
    const [y, m, d] = iso.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  })
  return Math.round((b - a) / 86_400_000)
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { garden } = useGarden()
  const { plants: catalog } = useCatalog()

  const [forecast, setForecast] = useState<WeatherForecast | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [plantings, setPlantings] = useState<Planting[] | null>(null)
  const [areas, setAreas] = useState<Area[]>([])

  useEffect(() => {
    api<WeatherForecast>('/api/wetter/prognose')
      .then(setForecast)
      .catch((err) => setWeatherError(err instanceof Error ? err.message : 'Wetter nicht verfügbar'))
    api<Planting[]>('/api/bepflanzungen')
      .then(setPlantings)
      .catch(() => setPlantings([]))
    api<Area[]>('/api/flaechen')
      .then(setAreas)
      .catch(() => setAreas([]))
  }, [])

  const today = todayIso()
  const month = new Date().getMonth() + 1
  const plantById = new Map((catalog ?? []).map((p) => [p.id, p]))
  const areaById = new Map(areas.map((a) => [a.id, a]))

  // Frost: erster Tag mit Frostgefahr und die Kulturen, die dann Schutz brauchen
  const frostDayIndex = forecast?.days.findIndex((d) => d.tempMin !== null && d.tempMin <= FROST_RISK_TEMP) ?? -1
  const frostDay = frostDayIndex >= 0 ? forecast!.days[frostDayIndex] : null
  const frostAtRisk = frostDay
    ? (plantings ?? []).filter((p) => {
        if (!plantById.get(p.plantId)?.frostSensitive) return false
        const areaType = areaById.get(p.areaId)?.type
        const covered = areaType === 'gewaechshaus' || areaType === 'tomatenhaus'
        return !covered || (frostDay.tempMin ?? 0) <= GREENHOUSE_FROST_TEMP
      })
    : []

  // Ernte: überfällig oder in den nächsten Wochen
  const harvests = (plantings ?? [])
    .filter((p) => p.expectedHarvest && daysBetween(today, p.expectedHarvest) <= HARVEST_LOOKAHEAD_DAYS)
    .sort((a, b) => a.expectedHarvest!.localeCompare(b.expectedHarvest!))
  const nextHarvest = harvests.length === 0
    ? (plantings ?? [])
        .filter((p) => p.expectedHarvest)
        .sort((a, b) => a.expectedHarvest!.localeCompare(b.expectedHarvest!))[0]
    : undefined

  // Jetzt dran: was lässt sich diesen Monat vorziehen, säen, pflanzen?
  const groups: { label: string; action: string; plants: Plant[] }[] = [
    { label: 'Vorziehen', action: 'vorziehen', plants: [] },
    { label: 'Säen', action: 'säen', plants: [] },
    { label: 'Pflanzen', action: 'pflanzen', plants: [] },
  ]
  for (const plant of catalog ?? []) {
    const actions = actionsThisMonth(plant, month)
    for (const group of groups) if (actions.includes(group.action)) group.plants.push(plant)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-heading">Hallo {user?.name.split(' ')[0]}!</h1>
        {garden && <p className="text-sm">Garten in {garden.locationName}</p>}
      </div>

      {frostDay && (
        <div role="alert" className="rounded-2xl bg-sky-500/15 px-4 py-3 text-sm text-heading">
          <p className="font-semibold">
            ❄️ Frostgefahr{' '}
            {frostDayIndex <= 1
              ? weekdayLabel(frostDay.date, frostDayIndex).toLowerCase()
              : `am ${weekdayLabel(frostDay.date, frostDayIndex)}`}
            : bis {Math.round(frostDay.tempMin!)} °C
          </p>
          {frostAtRisk.length > 0 ? (
            <p className="mt-1">
              Schützen oder abdecken:{' '}
              {frostAtRisk.map((p) => `${p.plantName} (${p.areaName})`).join(', ')}
            </p>
          ) : (
            <p className="mt-1">Keine frostempfindlichen Kulturen im Freiland eingetragen.</p>
          )}
        </div>
      )}

      <Card title="Wetter">
        {forecast && <WeatherStrip forecast={forecast} />}
        {!forecast && !weatherError && <p className="text-sm">Lädt …</p>}
        {weatherError && <p className="text-sm text-danger">{weatherError}</p>}
      </Card>

      <Card title="Ernte">
        {plantings === null && <p className="text-sm">Lädt …</p>}
        {plantings !== null && harvests.length === 0 && !nextHarvest && (
          <p className="text-sm">
            Noch keine Ernte absehbar.{' '}
            <Link to="/garten" className="text-accent">
              Pflanzen eintragen
            </Link>
          </p>
        )}
        {harvests.length > 0 && (
          <ul className="flex flex-col gap-2">
            {harvests.map((p) => {
              const days = daysBetween(today, p.expectedHarvest!)
              return (
                <li key={p.id}>
                  <Link
                    to={`/garten/bepflanzungen/${p.id}`}
                    className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-surface px-4 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-heading">
                        {p.plantName}
                        {p.variety && <span className="font-normal text-text"> · {p.variety}</span>}
                      </span>
                      <span className="block text-xs">{p.areaName}</span>
                    </span>
                    <span className={`shrink-0 text-sm ${days <= 0 ? 'font-semibold text-accent' : ''}`}>
                      {days <= 0 ? 'erntereif' : days === 1 ? 'morgen' : `in ${days} Tagen`}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {nextHarvest && (
          <p className="text-sm">
            Nächste Ernte: <span className="font-medium text-heading">{nextHarvest.plantName}</span> (
            {nextHarvest.areaName}) ab ca. {formatDate(nextHarvest.expectedHarvest)}
          </p>
        )}
      </Card>

      <Card
        title={`Jetzt dran im ${monthShort[month - 1]}`}
        action={
          <Link to="/garten/katalog" className="text-sm text-accent">
            Katalog
          </Link>
        }
      >
        {!catalog && <p className="text-sm">Lädt …</p>}
        {catalog && groups.every((g) => g.plants.length === 0) && (
          <p className="text-sm">Diesen Monat steht nichts an – Zeit für Pflege und Planung.</p>
        )}
        <div className="flex flex-col gap-3">
          {groups
            .filter((g) => g.plants.length > 0)
            .map((group) => (
              <div key={group.action}>
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide">{group.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.plants.map((plant) => (
                    <Link
                      key={plant.id}
                      to={`/garten/katalog/${plant.id}`}
                      className="inline-flex min-h-9 items-center rounded-full bg-accent-light px-3 text-sm text-heading"
                    >
                      {plant.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}
