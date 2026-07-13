import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCurrentUser,
  login as loginRequest,
  type CurrentUser,
  type LoginPayload,
} from '../api/auth'
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  saveAuthTokens,
} from '../utils/authStorage'
import {
  AUTH_EXPIRED_EVENT,
  AUTH_REFRESHED_EVENT,
  type AuthRefreshedDetail,
} from '../utils/authEvents'
import { AuthContext } from './authContextValue'
import { queryKeys } from '../app/queryKeys'

const initialToken = getAccessToken()
const initialRefreshToken = getRefreshToken()

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState(initialToken)
  const [refreshToken, setRefreshToken] = useState(initialRefreshToken)
  const [sessionUser, setSessionUser] = useState<CurrentUser | null>(null)
  const queryClient = useQueryClient()
  const meQuery = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken || refreshToken),
    retry: false,
  })
  const user = sessionUser ?? meQuery.data ?? null
  const initialized = !(accessToken || refreshToken) || !meQuery.isPending

  const logout = useCallback(() => {
    clearAuthTokens()
    setAccessToken(null)
    setRefreshToken(null)
    setSessionUser(null)
    queryClient.clear()
  }, [queryClient])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await loginRequest(payload)
      saveAuthTokens(result.accessToken, result.refreshToken)
      setAccessToken(result.accessToken)
      setRefreshToken(result.refreshToken)
      setSessionUser(result.user)
      queryClient.setQueryData(queryKeys.auth.me, result.user)
    },
    [queryClient],
  )

  useEffect(() => {
    const handleRefreshed = (event: Event) => {
      const detail = (event as CustomEvent<AuthRefreshedDetail>).detail
      setAccessToken(detail.accessToken)
      setRefreshToken(detail.refreshToken)
      setSessionUser(detail.user)
      queryClient.setQueryData(queryKeys.auth.me, detail.user)
    }
    const handleExpired = () => {
      setAccessToken(null)
      setRefreshToken(null)
      setSessionUser(null)
      queryClient.clear()
    }
    window.addEventListener(AUTH_REFRESHED_EVENT, handleRefreshed)
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired)
    return () => {
      window.removeEventListener(AUTH_REFRESHED_EVENT, handleRefreshed)
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired)
    }
  }, [queryClient])

  const value = useMemo(
    () => ({ accessToken, refreshToken, user, initialized, login, logout }),
    [accessToken, refreshToken, user, initialized, login, logout],
  )
  return <AuthContext value={value}>{children}</AuthContext>
}
