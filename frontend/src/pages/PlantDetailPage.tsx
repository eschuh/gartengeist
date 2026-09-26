import { Link, useParams } from 'react-router-dom'
import {
  nutrientDemandLabels,
  plantCategories,
  waterDemandLabels,
  type Plant,
} from '../api/plants'
import { useCatalog } from '../api/useCatalog'
import MonthCalendar from '../components/MonthCalendar'

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="rounded-xl bg-surface px-3 py-2">
      <dt className="text-xs">{label}</dt>
      <dd className="font-medium text-heading">{value}</dd>
    </div>
  )
}

function CompanionList({ title, keys, plants, tone }: { title: string; keys: string[]; plants: Plant[]; tone: 'good' | 'bad' }) {
  const companions = keys
    .map((key) => plants.find((p) => p.key === key))
    .filter((p): p is Plant => p !== undefined)
  if (companions.length === 0) return null

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-heading">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {companions.map((p) => (
          <Link
            key={p.id}
            to={`/garten/katalog/${p.id}`}
            className={`inline-flex min-h-9 items-center rounded-full px-3 text-sm ${
              tone === 'good' ? 'bg-accent-light text-heading' : 'bg-danger/10 text-danger'
            }`}
          >
            {p.name}
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function PlantDetailPage() {
  const { id } = useParams()
  const { plants, error } = useCatalog()
  const plant = plants?.find((p) => p.id === id)

  if (error) return <p className="text-sm text-danger">{error}</p>
  if (!plants) return <p className="text-sm">Lädt …</p>
  if (!plant) return <p className="text-sm">Pflanze nicht gefunden.</p>

  const spacing =
    plant.plantSpacingCm && plant.rowSpacingCm ? `${plant.plantSpacingCm} × ${plant.rowSpacingCm} cm` : null

  return (
    <section className="flex flex-col gap-6">
      <div>
        <Link to="/garten/katalog" className="mb-2 inline-flex min-h-11 items-center text-sm text-accent">
          ‹ Katalog
        </Link>
        <h1 className="text-2xl font-semibold text-heading">{plant.name}</h1>
        <p className="text-sm italic">{plant.latinName}</p>
        <p className="mt-1 text-xs">
          {plantCategories.find((c) => c.value === plant.category)?.label} · {plant.family}
          {plant.perennial && ' · mehrjährig'}
        </p>
      </div>

      <MonthCalendar plant={plant} />

      {plant.note && <p className="rounded-xl bg-accent-light px-4 py-3 text-sm text-heading">{plant.note}</p>}

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Fact label="Nährstoffbedarf" value={nutrientDemandLabels[plant.nutrientDemand]} />
        <Fact label="Wasserbedarf" value={waterDemandLabels[plant.waterDemand]} />
        <Fact label="Abstand (Pflanze × Reihe)" value={spacing} />
        <Fact label="Kulturdauer" value={plant.daysToHarvest ? `ca. ${plant.daysToHarvest} Tage` : null} />
        <Fact label="Voranzucht" value={plant.preCultivationWeeks ? `ca. ${plant.preCultivationWeeks} Wochen` : null} />
        <Fact label="Frost" value={plant.frostSensitive ? 'empfindlich' : 'verträgt leichten Frost'} />
      </dl>

      <CompanionList title="Gute Nachbarn" keys={plant.goodCompanions} plants={plants} tone="good" />
      <CompanionList title="Schlechte Nachbarn" keys={plant.badCompanions} plants={plants} tone="bad" />
    </section>
  )
}
