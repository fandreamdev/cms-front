import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCurrentUser,
  login as loginRequest,
  type CurrentUser,
  type LoginPayload,
} from '../api/auth'
import { clearAccessToken, getAccessToken, saveAccessToken } from '../utils/authStorage'
import { AuthContext } from './authContextValue'
import { queryKeys } from '../app/queryKeys'

const initialToken = getAccessToken()

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState(initialToken)
  const [sessionUser, setSessionUser] = useState<CurrentUser | null>(null)
  const queryClient = useQueryClient()
  const meQuery = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken),
    retry: false,
  })
  const user = sessionUser ?? meQuery.data ?? null
  const initialized = !accessToken || !meQuery.isPending

  const logout = useCallback(() => {
    clearAccessToken()
    setAccessToken(null)
    setSessionUser(null)
    queryClient.clear()
  }, [queryClient])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const result = await loginRequest(payload)
      saveAccessToken(result.accessToken)
      setAccessToken(result.accessToken)
      setSessionUser(result.user)
      queryClient.setQueryData(queryKeys.auth.me, result.user)
    },
    [queryClient],
  )

  const value = useMemo(
    () => ({ accessToken, user, initialized, login, logout }),
    [accessToken, user, initialized, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
