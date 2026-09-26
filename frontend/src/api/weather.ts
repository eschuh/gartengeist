export interface WeatherDay {
  date: string
  weatherCode: number | null
  tempMin: number | null
  tempMax: number | null
  precipitationMm: number | null
  precipitationProbability: number | null
  source: 'meteoschweiz' | 'open-meteo'
}

export interface WeatherForecast {
  locationName: string
  fetchedAt: string
  days: WeatherDay[]
}

// Ab dieser Lufttemperatur (2 m) ist Bodenfrost möglich
export const FROST_RISK_TEMP = 2

// WMO-Wettercodes, zusammengefasst
export function weatherInfo(code: number | null): { icon: string; label: string } {
  if (code === null) return { icon: '–', label: 'unbekannt' }
  if (code === 0) return { icon: '☀️', label: 'sonnig' }
  if (code <= 2) return { icon: '🌤️', label: 'leicht bewölkt' }
  if (code === 3) return { icon: '☁️', label: 'bewölkt' }
  if (code <= 48) return { icon: '🌫️', label: 'Nebel' }
  if (code <= 57) return { icon: '🌦️', label: 'Niesel' }
  if (code <= 67) return { icon: '🌧️', label: 'Regen' }
  if (code <= 77) return { icon: '🌨️', label: 'Schnee' }
  if (code <= 82) return { icon: '🌦️', label: 'Schauer' }
  if (code <= 86) return { icon: '🌨️', label: 'Schneeschauer' }
  return { icon: '⛈️', label: 'Gewitter' }
}

export function weekdayLabel(iso: string, index: number): string {
  if (index === 0) return 'Heute'
  if (index === 1) return 'Morgen'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', { weekday: 'short' })
}
