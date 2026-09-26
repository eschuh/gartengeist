import { useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import type { Garden } from '../api/types'
import { GardenContext } from './context'

// Layout-Route: lädt die Garten-Konfiguration einmal für alle Seiten darunter
export default function GardenProvider() {
  const [garden, setGarden] = useState<Garden | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Garden>('/api/garten')
      .then(setGarden)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setGarden(null)
        else setError(err instanceof Error ? err.message : 'Garten konnte nicht geladen werden')
      })
  }, [])

  const value = useMemo(() => ({ garden, error, setGarden }), [garden, error])

  return (
    <GardenContext.Provider value={value}>
      <Outlet />
    </GardenContext.Provider>
  )
}
