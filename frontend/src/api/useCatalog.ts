import { useEffect, useState } from 'react'
import { api } from './client'
import type { Plant } from './plants'

// Der Katalog ändert sich nur beim Deployment – einmal pro Sitzung laden reicht
let cached: Promise<Plant[]> | null = null

function loadCatalog(): Promise<Plant[]> {
  cached ??= api<Plant[]>('/api/katalog').catch((err) => {
    cached = null
    throw err
  })
  return cached
}

export function useCatalog() {
  const [plants, setPlants] = useState<Plant[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadCatalog()
      .then((result) => active && setPlants(result))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Katalog konnte nicht geladen werden'))
    return () => {
      active = false
    }
  }, [])

  return { plants, error }
}
