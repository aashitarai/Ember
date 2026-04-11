import React, { createContext, useContext, useMemo, useState } from 'react'
import { MOCK_USERS, type MockUser } from './mockUsers'

type AuthUser = Omit<MockUser, 'password'>

type AuthContextValue = {
  user: AuthUser | null
  loginWithPassword: (email: string, password: string) => { ok: true } | { ok: false; error: string }
  loginWithGoogle: () => void
  logout: () => void
}

const STORAGE_KEY = 'ember.auth.user'

function loadStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function store(user: AuthUser | null) {
  try {
    if (!user) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch {
    // ignore
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStored())

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      loginWithPassword: (email, password) => {
        const found = MOCK_USERS.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
        )
        if (!found) return { ok: false, error: 'Email or password is incorrect.' }
        const next: AuthUser = { ...found, password: undefined } as unknown as AuthUser
        setUser(next)
        store(next)
        return { ok: true }
      },
      loginWithGoogle: () => {
        const googleUser: AuthUser = {
          id: 'u_google_demo',
          name: 'Google Demo',
          email: 'google.demo@ember.demo',
          avatar: 'fox',
          tier: 'Bronze',
        }
        setUser(googleUser)
        store(googleUser)
      },
      logout: () => {
        setUser(null)
        store(null)
      },
    }
  }, [user])

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

