import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getToken, setToken, setUnauthorizedHandler } from '../api/client'
import { AuthContext, type User } from './context'

interface AuthResponse {
  token: string
  expiresAt: string
  user: User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => getToken() !== null)

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Gespeicherten Token beim Start prüfen
  useEffect(() => {
    if (!getToken()) return
    api<User>('/api/auth/ich')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const handleAuth = useCallback((response: AuthResponse) => {
    setToken(response.token)
    setUser(response.user)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      handleAuth(
        await api<AuthResponse>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }),
      )
    },
    [handleAuth],
  )

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      handleAuth(
        await api<AuthResponse>('/api/auth/registrieren', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        }),
      )
    },
    [handleAuth],
  )

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
