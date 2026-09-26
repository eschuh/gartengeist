const TOKEN_KEY = 'gartengeist.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Speicher nicht verfügbar (z.B. privater Modus) – Login gilt dann nur für diese Sitzung
  }
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Wird aufgerufen, wenn der Server den Token ablehnt (abgelaufen/ungültig)
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  const response = await fetch(path, { ...options, headers })

  if (response.status === 401 && token) onUnauthorized?.()

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response))
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

async function readError(response: Response): Promise<string> {
  if (response.status === 429) return 'Zu viele Versuche – bitte eine Minute warten.'
  try {
    const body = await response.json()
    if (typeof body?.fehler === 'string') return body.fehler
    // ASP.NET-Validierungsfehler: { errors: { Feld: ["..."] } }
    if (body?.errors) {
      const first = Object.values(body.errors as Record<string, string[]>)[0]?.[0]
      if (first) return first
    }
    if (typeof body?.title === 'string') return body.title
  } catch {
    // keine JSON-Antwort
  }
  return `Fehler ${response.status}`
}
