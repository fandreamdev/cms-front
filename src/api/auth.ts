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
  captchaId: string
  captcha: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: CurrentUser
}

export interface LoginCaptcha {
  /** 服务端返回的验证码唯一标识，提交登录时原样带回。 */
  captchaId: string
  /** 可直接赋给 img src 的 data URL，例如 data:image/png;base64,... */
  image: string
}

export const login = (data: LoginPayload) =>
  request<LoginResult>('/auth/login', { method: 'POST', body: data, skipAuth: true })

export const getLoginCaptcha = () => request<LoginCaptcha>('/auth/captcha', { skipAuth: true })

export const getCurrentUser = () => request<CurrentUser>('/auth/me')

export const hasPermission = (user: CurrentUser | null, permission: string) =>
  Boolean(user && (user.isSuper || user.permissions.includes(permission)))
