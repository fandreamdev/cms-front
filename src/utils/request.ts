import { message } from 'antd'

const BASE_URL = '/api'

// 后端统一响应结构
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  // 查询参数，自动拼到 url 上
  params?: Record<string, unknown>
  // 请求体，自动 JSON 序列化
  body?: unknown
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
  const { params, body, headers, ...rest } = options

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${url}${buildQuery(params)}`, {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...rest,
    })
  } catch {
    message.error('网络请求失败，请检查网络连接')
    throw new Error('Network error')
  }

  if (!res.ok) {
    message.error(`请求失败：${res.status}`)
    throw new Error(`HTTP ${res.status}`)
  }

  const json = (await res.json()) as ApiResponse<T>
  if (json.code !== 0) {
    message.error(json.message || '操作失败')
    throw new Error(json.message)
  }

  return json.data
}

export default request
