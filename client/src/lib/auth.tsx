import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from './api'
import { SESSION_KEY, storage } from './storage'
import type { User } from './types'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (sessionToken: string, user: User) => void
  setUser: (user: User) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => Boolean(storage.get(SESSION_KEY)))

  useEffect(() => {
    if (!storage.get(SESSION_KEY)) return
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => storage.set(SESSION_KEY, null))
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback((token: string, u: User) => {
    storage.set(SESSION_KEY, token)
    setUser(u)
  }, [])

  const signOut = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined)
    storage.set(SESSION_KEY, null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, signIn, setUser, signOut }), [user, loading, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth hors AuthProvider')
  return ctx
}
