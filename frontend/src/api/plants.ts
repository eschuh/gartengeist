import type { User } from '../auth/context'

// Monate 1–12; from > to bedeutet über den Jahreswechsel (z.B. Okt–März)
export interface MonthWindow {
  from: number
  to: number
}

export interface Plant {
  id: string
  key: string
  name: string
  latinName: string | null
  family: string
  category: PlantCategory
  preCultivation: MonthWindow | null
  directSowing: MonthWindow | null
  plantingOut: MonthWindow | null
  harvest: MonthWindow | null
  preCultivationWeeks: number | null
  daysToHarvest: number | null
  plantSpacingCm: number | null
  rowSpacingCm: number | null
  spacePerPlantM2: number | null
  nutrientDemand: 'stark' | 'mittel' | 'schwach'
  waterDemand: 'hoch' | 'mittel' | 'niedrig'
  frostSensitive: boolean
  perennial: boolean
  goodCompanions: string[]
  badCompanions: string[]
  note: string | null
}

export type PlantCategory =
  | 'fruchtgemuese'
  | 'huelsenfruechte'
  | 'kohl'
  | 'wurzelgemuese'
  | 'zwiebelgemuese'
  | 'blattgemuese'
  | 'obst'
  | 'kraeuter'
  | 'blumen'

export const plantCategories: { value: PlantCategory; label: string }[] = [
  { value: 'fruchtgemuese', label: 'Fruchtgemüse' },
  { value: 'huelsenfruechte', label: 'Hülsenfrüchte' },
  { value: 'kohl', label: 'Kohl' },
  { value: 'wurzelgemuese', label: 'Wurzel & Knollen' },
  { value: 'zwiebelgemuese', label: 'Zwiebel & Lauch' },
  { value: 'blattgemuese', label: 'Salat & Blattgemüse' },
  { value: 'obst', label: 'Obst & Stauden' },
  { value: 'kraeuter', label: 'Kräuter' },
  { value: 'blumen', label: 'Blumen & Gründüngung' },
]

export const nutrientDemandLabels: Record<Plant['nutrientDemand'], string> = {
  stark: 'Starkzehrer',
  mittel: 'Mittelzehrer',
  schwach: 'Schwachzehrer',
}

export const waterDemandLabels: Record<Plant['waterDemand'], string> = {
  hoch: 'hoch',
  mittel: 'mittel',
  niedrig: 'niedrig',
}

export const monthShort = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

export function inWindow(month: number, window: MonthWindow | null): boolean {
  if (!window) return false
  return window.from <= window.to
    ? month >= window.from && month <= window.to
    : month >= window.from || month <= window.to
}

export function formatWindow(window: MonthWindow | null): string | null {
  if (!window) return null
  if (window.from === 1 && window.to === 12) return 'ganzjährig'
  return window.from === window.to
    ? monthShort[window.from - 1]
    : `${monthShort[window.from - 1]}–${monthShort[window.to - 1]}`
}

// Was lässt sich in diesem Monat mit der Pflanze tun?
export function actionsThisMonth(plant: Plant, month: number): string[] {
  const actions: string[] = []
  if (inWindow(month, plant.preCultivation)) actions.push('vorziehen')
  if (inWindow(month, plant.directSowing)) actions.push('säen')
  if (inWindow(month, plant.plantingOut)) actions.push('pflanzen')
  return actions
}

export interface Planting {
  id: string
  areaId: string
  areaName: string
  plantId: string
  plantName: string
  variety: string | null
  count: number | null
  sowingDate: string | null
  plantingDate: string | null
  expectedHarvest: string | null
  notes: string | null
  endedOn: string | null
  createdBy: User
  createdAt: string
  updatedAt: string
}

export interface PlantingInput {
  areaId: string
  plantId: string
  variety: string | null
  count: number | null
  sowingDate: string | null
  plantingDate: string | null
  notes: string | null
}

// Muss zur Berechnung in PlantingService.EstimateHarvest (Backend) passen
export function estimateHarvest(plant: Plant, sowingDate: string | null, plantingDate: string | null): string | null {
  if (plant.daysToHarvest == null) return null
  if (plantingDate) return addDays(plantingDate, plant.daysToHarvest)
  if (!sowingDate) return null
  const onlyPreCultivated = plant.preCultivation !== null && plant.directSowing === null
  const preDays = onlyPreCultivated ? (plant.preCultivationWeeks ?? 0) * 7 : 0
  return addDays(sowingDate, preDays + plant.daysToHarvest)
}

// Datumsangaben als YYYY-MM-DD (lokal), ohne Zeitzonen-Verschiebung
export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  return `${Number(d)}.${Number(m)}.${y}`
}

export interface CompanionReport {
  good: string[]
  bad: string[]
}

// Mischkultur: schlecht, wenn eine der beiden Pflanzen die andere als schlechten Nachbarn führt
export function companionReport(plant: Plant, neighbors: Plant[]): CompanionReport {
  const good = new Set<string>()
  const bad = new Set<string>()
  for (const other of neighbors) {
    if (other.key === plant.key) continue
    if (plant.badCompanions.includes(other.key) || other.badCompanions.includes(plant.key)) bad.add(other.name)
    else if (plant.goodCompanions.includes(other.key) || other.goodCompanions.includes(plant.key)) good.add(other.name)
  }
  return { good: [...good], bad: [...bad] }
}
