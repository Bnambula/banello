// ============================================================
// BANELLO — Auth Context
// Provides auth state and helpers to all components
// Handles auto token refresh before expiry
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface AuthUser {
  id:      string
  email:   string
  role:    'admin' | 'manager' | 'rider' | 'customer'
  isAdmin: boolean
}

interface AuthState {
  user:          AuthUser | null
  loading:       boolean
  authenticated: boolean
}

interface AuthContextValue extends AuthState {
  login:  (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  refresh: () => Promise<boolean>
}

interface LoginResult {
  success: boolean
  error?:  string
  remainingAttempts?: number
  retryAfter?: number
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, authenticated: false })

  // ─── Check session on mount ────────────────────────────────
  useEffect(() => {
    checkSession()
  }, [])

  // ─── Auto-refresh token 2 minutes before expiry ──────────
  // Access token lives 15 min — refresh at 13 min mark
  useEffect(() => {
    if (!state.authenticated) return
    const timer = setTimeout(async () => {
      await refresh()
    }, 13 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [state.authenticated])

  async function checkSession() {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' })
      const data = await res.json()
      setState({ user: data.user, loading: false, authenticated: data.authenticated })
    } catch {
      setState({ user: null, loading: false, authenticated: false })
    }
  }

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.status === 429) {
        return {
          success: false,
          error: data.message || 'Too many login attempts. Please wait before trying again.',
          retryAfter: data.retryAfter,
          remainingAttempts: 0,
        }
      }

      if (!res.ok) {
        return {
          success: false,
          error: data.message || 'Invalid email or password',
          remainingAttempts: data.remainingAttempts,
        }
      }

      setState({ user: data.user, loading: false, authenticated: true })
      return { success: true }
    } catch {
      return { success: false, error: 'Network error. Please check your connection and try again.' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      setState({ user: null, loading: false, authenticated: false })
    }
  }, [])

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      if (res.ok) {
        await checkSession()
        return true
      }
      setState({ user: null, loading: false, authenticated: false })
      return false
    } catch {
      return false
    }
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// HOC to protect client-side components — use alongside middleware for defense-in-depth
export function withAuth<P extends object>(Component: React.ComponentType<P>, requiredRole?: string) {
  return function ProtectedComponent(props: P) {
    const { authenticated, loading, user } = useAuth()

    if (loading) return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#F5F5F5' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:40, height:40, border:'3px solid #E8B84B', borderTopColor:'#1C3A28', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
          <div style={{ fontFamily:'Georgia,serif', color:'#1C3A28', fontSize:16 }}>banello</div>
          <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
        </div>
      </div>
    )

    if (!authenticated || !user) {
      if (typeof window !== 'undefined') window.location.href = '/login'
      return null
    }

    if (requiredRole && user.role !== requiredRole && !user.isAdmin) {
      return (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🚫</div>
            <div style={{ fontSize:16, fontWeight:500 }}>Access denied</div>
            <div style={{ fontSize:13, color:'#9E9E9E', marginTop:6 }}>You don&apos;t have permission to view this page.</div>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
