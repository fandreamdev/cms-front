import { message } from 'antd'
import { clearAccessToken, getAccessToken } from './authStorage'

const BASE_URL = '/api'

// 后端统一响应结构
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  // 查询参数，自动拼到 url 上
  params?: Record<string, unknown>
  // 请求体，自动 JSON 序列化
  body?: unknown
  skipAuth?: boolean
}

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return ''
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    // 过滤掉 undefined / null，空字符串保留（后端接口需要空参数占位）
    if (value === undefined || value === null) return
    search.append(key, String(value))
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, headers, skipAuth, ...rest } = options
  const isFormData = body instanceof FormData
  const token = skipAuth ? null : getAccessToken()

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${url}${buildQuery(params)}`, {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      ...rest,
    })
  } catch {
    message.error('网络请求失败，请检查网络连接')
    throw new Error('Network error')
  }

  if (!res.ok) {
    let errorMessage = `请求失败：${res.status}`
    try {
      const error = (await res.json()) as Partial<ApiResponse<unknown>>
      if (error.message) errorMessage = error.message
    } catch {
      // 非 JSON 错误响应使用 HTTP 状态提示
    }
    if (res.status === 401 && !skipAuth) {
      clearAccessToken()
      const redirect = `${window.location.pathname}${window.location.search}`
      window.location.replace(`/login?redirect=${encodeURIComponent(redirect)}`)
    } else if (res.status === 403) {
      errorMessage = '没有访问权限'
    } else if (res.status === 409) {
      errorMessage = errorMessage || '当前数据状态已变化，请刷新后重试'
    }
    message.error(errorMessage)
    throw new HttpError(res.status, errorMessage)
  }

  const json = (await res.json()) as ApiResponse<T>
  if (json.code !== 0) {
    message.error(json.message || '操作失败')
    throw new Error(json.message)
  }

  return json.data
}

export default request
