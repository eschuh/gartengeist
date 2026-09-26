import { Link } from 'react-router-dom'
import { formatDate, type Planting } from '../api/plants'
import UserAvatar from './UserAvatar'

interface PlantingCardProps {
  planting: Planting
  // Wenn gesetzt, erscheint ein „Abräumen“-Knopf
  onClear?: (planting: Planting) => void
}

export default function PlantingCard({ planting, onClear }: PlantingCardProps) {
  const details = [
    planting.count != null && `${planting.count} Stk.`,
    planting.endedOn
      ? `abgeräumt ${formatDate(planting.endedOn)}`
      : planting.expectedHarvest && `Ernte ab ca. ${formatDate(planting.expectedHarvest)}`,
  ].filter(Boolean)

  return (
    <div className="flex min-h-16 items-center rounded-xl border border-border bg-surface">
      <Link to={`/garten/bepflanzungen/${planting.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <span className="block truncate font-medium text-heading">
            {planting.plantName}
            {planting.variety && <span className="font-normal text-text"> · {planting.variety}</span>}
          </span>
          {details.length > 0 && <span className="block text-xs">{details.join(' · ')}</span>}
        </div>
        <UserAvatar user={planting.createdBy} size={24} />
      </Link>
      {onClear && !planting.endedOn && (
        <button
          type="button"
          onClick={() => onClear(planting)}
          className="flex min-h-16 shrink-0 flex-col items-center justify-center border-l border-border px-3 text-xs"
          aria-label={`${planting.plantName} abräumen`}
        >
          <span className="text-lg">🧹</span>
          Abräumen
        </button>
      )}
    </div>
  )
}
