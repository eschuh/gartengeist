import type { ReactNode } from 'react'
import { areaTypeLabel, formatAreaSize, type AreaInput } from '../api/types'

const typeColors: Record<AreaInput['type'], string> = {
  freiland: 'bg-amber-700',
  gewaechshaus: 'bg-sky-600',
  tomatenhaus: 'bg-red-600',
  naturnah: 'bg-lime-600',
}

interface AreaCardProps {
  area: AreaInput
  // Zusätzliche Zeile, z.B. was gerade darauf wächst
  subtitle?: string | null
  action?: ReactNode
}

export default function AreaCard({ area, subtitle, action }: AreaCardProps) {
  const size = formatAreaSize(area)

  return (
    <div className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <span className={`size-3 shrink-0 rounded-full ${typeColors[area.type]}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <span className="block truncate font-medium text-heading">{area.name}</span>
        <span className="block text-xs">
          {areaTypeLabel(area.type)}
          {size && ` · ${size}`}
        </span>
        {subtitle && <span className="block truncate text-xs text-accent">{subtitle}</span>}
      </div>
      {action}
    </div>
  )
}
