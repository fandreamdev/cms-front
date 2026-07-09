import request from '../utils/request'

// 用户实体
export interface User {
  id: number
  username: string
  mobile: string | null
  email: string | null
  status: number // 1 启用 0 禁用
  isSuper: number // 1 超级管理员 0 普通
  sort: number
  createdAt: string
  updatedAt: string
}

// 列表查询参数
export interface UserQuery {
  username?: string
  mobile?: string
  email?: string
  status?: number | ''
  isSuper?: number | ''
  page?: number
  pageSize?: number
}

// 分页返回结构
export interface UserListResult {
  list: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 新增 / 编辑提交的字段
export interface UserPayload {
  username: string
  password?: string
  mobile?: string | null
  email?: string | null
  status: number
  isSuper: number
  sort: number
}

export function getUserList(params: UserQuery) {
  return request<UserListResult>('/users', {
    params: params as Record<string, unknown>,
  })
}

export function createUser(data: UserPayload) {
  return request<User>('/users', { method: 'POST', body: data })
}

export function updateUser(id: number, data: UserPayload) {
  return request<User>(`/users/${id}`, { method: 'PUT', body: data })
}

export function deleteUser(id: number) {
  return request<null>(`/users/${id}`, { method: 'DELETE' })
}
