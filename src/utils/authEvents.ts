import type { CurrentUser } from '../api/auth'

export const AUTH_REFRESHED_EVENT = 'cms:auth-refreshed'
export const AUTH_EXPIRED_EVENT = 'cms:auth-expired'

export interface AuthRefreshedDetail {
  accessToken: string
  refreshToken: string
  user: CurrentUser
}
