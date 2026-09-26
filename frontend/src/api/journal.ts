import type { User } from '../auth/context'
import { api } from './client'

export type JournalEntryType = 'notiz' | 'gegossen' | 'geduengt' | 'gejaetet' | 'geerntet' | 'abgeraeumt'
// Einträge, die mit einem Tipp (ohne Formular) angelegt werden
export type QuickActionType = 'gegossen' | 'geduengt' | 'gejaetet'
export const quickActionTypes: QuickActionType[] = ['gegossen', 'geduengt', 'gejaetet']
export type HarvestUnit = 'kg' | 'g' | 'stueck' | 'bund'

export const entryTypes: { value: JournalEntryType; label: string; icon: string }[] = [
  { value: 'notiz', label: 'Notiz', icon: '📝' },
  { value: 'gegossen', label: 'Gegossen', icon: '💧' },
  { value: 'geduengt', label: 'Gedüngt', icon: '🌱' },
  { value: 'gejaetet', label: 'Gejätet', icon: '🧤' },
  { value: 'geerntet', label: 'Geerntet', icon: '🧺' },
  { value: 'abgeraeumt', label: 'Abgeräumt', icon: '🧹' },
]

// „Abgeräumt“ entsteht beim Abräumen einer Kultur, nicht über das Eintragsformular
export const formEntryTypes = entryTypes.filter((t) => t.value !== 'abgeraeumt')

export function entryTypeInfo(type: JournalEntryType) {
  return entryTypes.find((t) => t.value === type) ?? entryTypes[0]
}

export const harvestUnits: { value: HarvestUnit; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'stueck', label: 'Stück' },
  { value: 'bund', label: 'Bund' },
]

export function formatAmount(amount: number, unit: string): string {
  const label = harvestUnits.find((u) => u.value === unit)?.label ?? unit
  return `${amount.toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${label}`
}

export interface JournalPhoto {
  id: string
  url: string
}

export interface JournalEntry {
  id: string
  date: string
  type: JournalEntryType
  text: string | null
  areaId: string | null
  areaName: string | null
  plantingId: string | null
  plantingName: string | null
  amount: number | null
  unit: HarvestUnit | null
  user: User
  weather: { tempMin: number | null; tempMax: number | null; precipitationMm: number | null; weatherCode: number | null } | null
  photos: JournalPhoto[]
  createdAt: string
  updatedAt: string
}

export interface JournalEntryInput {
  date: string
  type: JournalEntryType
  text: string | null
  areaId: string | null
  plantingId: string | null
  amount: number | null
  unit: HarvestUnit | null
}

export interface HarvestSummaryItem {
  plantingId: string
  plantName: string
  variety: string | null
  areaName: string
  unit: HarvestUnit
  total: number
  harvestCount: number
  lastHarvest: string
}

export const MAX_PHOTOS = 5

// Fotos vor dem Upload verkleinern (Handyfotos haben oft 5–10 MB). Klappt das nicht
// (z.B. HEIC in Chrome), wird das Original versucht – der Server lehnt nicht unterstützte Formate ab.
export async function resizeImage(file: File, maxSize = 2000, quality = 0.85): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    return blob ?? file
  } catch {
    return file
  }
}

export async function uploadPhoto(entryId: string, file: File): Promise<JournalPhoto> {
  const blob = await resizeImage(file)
  const form = new FormData()
  form.append('datei', blob, blob === file ? file.name : 'foto.jpg')
  return api<JournalPhoto>(`/api/tagebuch/${entryId}/fotos`, { method: 'POST', body: form })
}

export function quickAction(type: QuickActionType, areaIds: string[]): Promise<JournalEntry[]> {
  return api<JournalEntry[]>('/api/tagebuch/schnell', {
    method: 'POST',
    body: JSON.stringify({ type, areaIds }),
  })
}

export async function deleteEntries(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => api(`/api/tagebuch/${id}`, { method: 'DELETE' })))
}

// „Heute“, „Gestern“, sonst „Sa, 26.9.“
export function dayLabel(iso: string, todayIsoValue: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const [ty, tm, td] = todayIsoValue.split('-').map(Number)
  const diff = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86_400_000)
  if (diff === 0) return 'Heute'
  if (diff === 1) return 'Gestern'
  const weekday = new Date(y, m - 1, d).toLocaleDateString('de-DE', { weekday: 'short' })
  return `${weekday}, ${d}.${m}.${y === ty ? '' : y}`
}

export function daysAgoLabel(iso: string, todayIsoValue: string): string {
  const label = dayLabel(iso, todayIsoValue)
  if (label === 'Heute' || label === 'Gestern') return label.toLowerCase()
  const [y, m, d] = iso.split('-').map(Number)
  const [ty, tm, td] = todayIsoValue.split('-').map(Number)
  const diff = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86_400_000)
  return `vor ${diff} Tagen`
}
