import { createContext } from 'react'
import type { Garden } from '../api/types'

export interface GardenContextValue {
  // undefined = lädt noch, null = Einrichtung noch nicht abgeschlossen
  garden: Garden | null | undefined
  error: string | null
  setGarden: (garden: Garden) => void
}

export const GardenContext = createContext<GardenContextValue | null>(null)
