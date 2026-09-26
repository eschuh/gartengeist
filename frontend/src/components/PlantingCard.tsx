import { Link } from 'react-router-dom'
import { formatDate, type Planting } from '../api/plants'
import UserAvatar from './UserAvatar'

export default function PlantingCard({ planting }: { planting: Planting }) {
  const details = [
    planting.count != null && `${planting.count} Stk.`,
    planting.endedOn
      ? `beendet ${formatDate(planting.endedOn)}`
      : planting.expectedHarvest && `Ernte ab ca. ${formatDate(planting.expectedHarvest)}`,
  ].filter(Boolean)

  return (
    <Link
      to={`/garten/bepflanzungen/${planting.id}`}
      className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <span className="block truncate font-medium text-heading">
          {planting.plantName}
          {planting.variety && <span className="font-normal text-text"> · {planting.variety}</span>}
        </span>
        {details.length > 0 && <span className="block text-xs">{details.join(' · ')}</span>}
      </div>
      <UserAvatar user={planting.createdBy} size={24} />
    </Link>
  )
}
