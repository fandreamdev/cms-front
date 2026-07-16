import request from '../utils/request'

export interface WebsiteSetting {
  id: string
  key: string
  value: unknown
  isPublic: boolean
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface WebsiteSettingPayload {
  value: unknown
  isPublic?: boolean
  description?: string | null
}

const settingPath = (key: string) => `/settings/${encodeURIComponent(key)}`

export const getWebsiteSettings = () => request<WebsiteSetting[]>('/settings')

export const getWebsiteSetting = (key: string) => request<WebsiteSetting>(settingPath(key))

export const saveWebsiteSetting = (key: string, data: WebsiteSettingPayload) =>
  request<WebsiteSetting>(settingPath(key), { method: 'PUT', body: data })

export const deleteWebsiteSetting = (key: string) =>
  request<null>(settingPath(key), { method: 'DELETE' })

export const getPublicWebsiteSettings = () =>
  request<Record<string, unknown>>('/settings/public', { skipAuth: true })
