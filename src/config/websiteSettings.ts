import type { WebsiteSettingPayload } from '../api/setting'

export const WEBSITE_SETTING_KEYS = {
  name: 'site:name',
  description: 'site:description',
  contactEmail: 'site:contact-email',
} as const

export const CORE_WEBSITE_SETTINGS: Array<{
  key: string
  payload: WebsiteSettingPayload
}> = [
  {
    key: WEBSITE_SETTING_KEYS.name,
    payload: { value: 'CMS', isPublic: true, description: '网站名称' },
  },
  {
    key: WEBSITE_SETTING_KEYS.description,
    payload: { value: '内容管理系统', isPublic: true, description: '网站描述' },
  },
  {
    key: WEBSITE_SETTING_KEYS.contactEmail,
    payload: { value: 'contact@example.com', isPublic: true, description: '联系邮箱' },
  },
]

export const getPublicStringSetting = (
  settings: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
) => {
  const value = settings?.[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}
