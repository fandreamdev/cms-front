import { createContext, useContext } from 'react'
import type { CurrentUser, LoginPayload } from '../api/auth'

export interface AuthContextValue {
  accessToken: string | null
  user: CurrentUser | null
  initialized: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
