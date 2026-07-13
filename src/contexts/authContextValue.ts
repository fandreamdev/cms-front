import { createContext, use } from 'react'
import type { CurrentUser, LoginPayload } from '../api/auth'

export interface AuthContextValue {
  accessToken: string | null
  refreshToken: string | null
  user: CurrentUser | null
  initialized: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const context = use(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
