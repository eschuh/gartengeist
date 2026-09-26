import { useContext } from 'react'
import { GardenContext } from './context'

export function useGarden() {
  const context = useContext(GardenContext)
  if (!context) throw new Error('useGarden muss innerhalb von <GardenProvider> verwendet werden')
  return context
}
