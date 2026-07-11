export function resolveAssetUrl(url?: string | null) {
  if (!url) return ''
  const normalized = url.trim().replaceAll('\\', '/')
  if (/^(?:https?:|data:|blob:)/i.test(normalized)) return normalized
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}
