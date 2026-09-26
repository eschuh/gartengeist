import type { User } from '../auth/context'
import { api } from './client'

export interface GardenTask {
  id: string
  title: string
  description: string | null
  dueDate: string
  intervalDays: number | null
  category: 'allgemein' | 'voranzucht' | 'winter'
  source: 'manuell' | 'automatisch' | 'ki' | 'dokument'
  areaId: string | null
  areaName: string | null
  plantId: string | null
  plantName: string | null
  doneAt: string | null
  doneBy: User | null
  createdBy: User | null
  createdAt: string
}

export interface TaskInput {
  title: string
  description: string | null
  dueDate: string
  intervalDays: number | null
  areaId: string | null
}

export const taskCategoryIcons: Record<GardenTask['category'], string> = {
  allgemein: '✔️',
  voranzucht: '🌱',
  winter: '❄️',
}

export interface PreCultivationPlan {
  plantId: string
  plantName: string
  sowDate: string
  plantOutDate: string
  weeks: number
  taskCreated: boolean
}

export interface WateringStatus {
  areaId: string
  areaName: string
  areaType: string
  lastWatered: string | null
  lastWateredBy: string | null
  lastRain: string | null
  daysSince: number | null
  thresholdDays: number
  due: boolean
  reason: string
}

export function completeTask(id: string): Promise<GardenTask> {
  return api<GardenTask>(`/api/aufgaben/${id}/erledigen`, { method: 'POST' })
}

export function reopenTask(id: string): Promise<GardenTask> {
  return api<GardenTask>(`/api/aufgaben/${id}/wieder-oeffnen`, { method: 'POST' })
}

export type ShoppingCategory = 'saatgut' | 'pflanzen' | 'duenger' | 'werkzeug' | 'sonstiges'
export type InventoryCategory = 'saatgut' | 'duenger' | 'werkzeug' | 'sonstiges'

export const shoppingCategories: { value: ShoppingCategory; label: string }[] = [
  { value: 'saatgut', label: 'Saatgut' },
  { value: 'pflanzen', label: 'Pflanzen' },
  { value: 'duenger', label: 'Dünger & Erde' },
  { value: 'werkzeug', label: 'Werkzeug' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

export const inventoryCategories: { value: InventoryCategory; label: string }[] = [
  { value: 'saatgut', label: 'Saatgut' },
  { value: 'duenger', label: 'Dünger & Erde' },
  { value: 'werkzeug', label: 'Werkzeug' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

export interface ShoppingItem {
  id: string
  name: string
  quantity: string | null
  category: ShoppingCategory
  done: boolean
  addedBy: User
  createdAt: string
}

export interface InventoryItem {
  id: string
  name: string
  quantity: string | null
  category: InventoryCategory
  plantId: string | null
  plantName: string | null
  usableUntilYear: number | null
  notes: string | null
  updatedAt: string
}

export interface InventoryInput {
  name: string
  quantity: string | null
  category: InventoryCategory
  plantId: string | null
  usableUntilYear: number | null
  notes: string | null
}
