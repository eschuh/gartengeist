export interface Garden {
  locationName: string
  postalCode: string | null
  latitude: number
  longitude: number
  householdSize: number
}

export interface PlaceResult {
  name: string
  description: string
  postalCode: string | null
  latitude: number
  longitude: number
}

export type AreaType = 'freiland' | 'gewaechshaus' | 'tomatenhaus' | 'naturnah'

export const areaTypes: { value: AreaType; label: string; defaultName: string }[] = [
  { value: 'freiland', label: 'Beet / Freiland', defaultName: 'Beet' },
  { value: 'gewaechshaus', label: 'Gewächshaus', defaultName: 'Gewächshaus' },
  { value: 'tomatenhaus', label: 'Tomatenhaus', defaultName: 'Tomatenhaus' },
  { value: 'naturnah', label: 'Naturnaher Bereich', defaultName: 'Naturnaher Bereich' },
]

export function areaTypeLabel(type: AreaType): string {
  return areaTypes.find((t) => t.value === type)?.label ?? type
}

// „Beet 1“, „Beet 2“ … bzw. „Gewächshaus“, „Gewächshaus 2“ …
export function suggestAreaName(type: AreaType, existingNames: string[]): string {
  const base = areaTypes.find((t) => t.value === type)?.defaultName ?? ''
  const taken = new Set(existingNames.map((n) => n.trim().toLowerCase()))
  if (type !== 'freiland' && !taken.has(base.toLowerCase())) return base
  let n = type === 'freiland' ? 1 : 2
  while (taken.has(`${base} ${n}`.toLowerCase())) n++
  return `${base} ${n}`
}

export interface AreaInput {
  name: string
  type: AreaType
  width: number | null
  length: number | null
  description: string | null
}

export interface Area extends AreaInput {
  id: string
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export function areaSizeM2(area: Pick<AreaInput, 'width' | 'length'>): number | null {
  return area.width == null || area.length == null ? null : area.width * area.length
}

export function formatAreaSize(area: Pick<AreaInput, 'width' | 'length'>): string | null {
  if (area.width == null || area.length == null) return null
  const fmt = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 2 })
  return `${fmt(area.width)} × ${fmt(area.length)} m · ${fmt(area.width * area.length)} m²`
}
