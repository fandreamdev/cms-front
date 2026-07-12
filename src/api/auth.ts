import request from '../utils/request'
import type { Role } from './role'

export interface CurrentUser {
  id: number
  username: string
  mobile: string | null
  email: string | null
  status: number
  isSuper: boolean
  roles: Role[]
  permissions: string[]
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResult {
  accessToken: string
  user: CurrentUser
}

export const login = (data: LoginPayload) =>
  request<LoginResult>('/auth/login', { method: 'POST', body: data, skipAuth: true })

export const getCurrentUser = () => request<CurrentUser>('/auth/me')

export const hasPermission = (user: CurrentUser | null, permission: string) =>
  Boolean(user && (user.isSuper || user.permissions.includes(permission)))
