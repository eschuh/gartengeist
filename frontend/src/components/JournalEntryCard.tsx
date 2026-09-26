import { useState } from 'react'
import { Link } from 'react-router-dom'
import { entryTypeInfo, formatAmount, type JournalEntry } from '../api/journal'
import { weatherInfo } from '../api/weather'
import PhotoViewer from './PhotoViewer'
import UserAvatar from './UserAvatar'

export default function JournalEntryCard({ entry, showArea = true }: { entry: JournalEntry; showArea?: boolean }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const type = entryTypeInfo(entry.type)
  const place = entry.plantingName ?? (showArea ? entry.areaName : null)

  return (
    <article className="rounded-xl border border-border bg-surface px-4 py-3">
      <Link to={`/tagebuch/${entry.id}`} className="flex items-start gap-3">
        <span className="text-xl leading-7" aria-hidden="true">
          {type.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-heading">
            {entry.type === 'notiz' ? (place ?? 'Notiz') : type.label}
            {entry.amount != null && entry.unit && ` · ${formatAmount(entry.amount, entry.unit)}`}
          </p>
          {entry.type !== 'notiz' && place && <p className="text-xs">{place}</p>}
          {entry.type === 'notiz' && entry.plantingName && showArea && entry.areaName && (
            <p className="text-xs">{entry.areaName}</p>
          )}
          {entry.text && <p className="mt-1 whitespace-pre-line text-sm text-heading">{entry.text}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <UserAvatar user={entry.user} size={24} />
          {entry.weather && (
            <span className="text-[11px]" title={weatherInfo(entry.weather.weatherCode).label}>
              {weatherInfo(entry.weather.weatherCode).icon}{' '}
              {entry.weather.tempMax != null && `${Math.round(entry.weather.tempMax)}°`}
            </span>
          )}
        </div>
      </Link>

      {entry.photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {entry.photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setViewerIndex(i)}
              className="aspect-square overflow-hidden rounded-lg bg-border"
            >
              <img src={photo.url} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {viewerIndex !== null && (
        <PhotoViewer
          photos={entry.photos}
          index={viewerIndex}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </article>
  )
}
