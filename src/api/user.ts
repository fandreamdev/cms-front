import request from '../utils/request'
import type { PagedResult } from './types'

export interface UserRole {
  id: number
  name: string
}

// 用户实体
export interface User {
  id: number
  username: string
  mobile: string | null
  email: string | null
  status: number // 1 启用 0 禁用
  isSuper: number // 1 超级管理员 0 普通
  sort: number
  roles?: UserRole[]
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

// 新增 / 编辑提交的字段
export interface UserPayload {
  username: string
  password?: string
  mobile?: string | null
  email?: string | null
  status: number
  isSuper: number
  sort: number
  roleIds?: number[]
}

export function getUserList(params: UserQuery) {
  return request<PagedResult<User>>('/users', {
    params: params as Record<string, unknown>,
  })
}

export function getUser(id: number) {
  return request<User>(`/users/${id}`)
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
