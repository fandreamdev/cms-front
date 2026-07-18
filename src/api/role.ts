import request from '../utils/request'
import type { AccessType } from './access'
import type { PagedResult } from './types'

interface RoleAccess {
  id: number
  type: AccessType
  url: string
  description: string
}

export interface Role {
  id: number
  name: string
  accesses?: RoleAccess[]
  createdAt: string
  updatedAt: string
}

export interface RoleQuery {
  name?: string
  page?: number
  pageSize?: number
  orderBy?: 'updatedAt'
  order?: 'asc' | 'desc'
  createdFrom?: string
  createdTo?: string
}

export interface RolePayload {
  name: string
  accessIds?: number[]
}

export function getRoleList(params: RoleQuery) {
  return request<PagedResult<Role>>('/roles', {
    params: params as Record<string, unknown>,
  })
}

export function getRole(id: number) {
  return request<Role>(`/roles/${id}`)
}

export function createRole(data: RolePayload) {
  return request<Role>('/roles', { method: 'POST', body: data })
}

export function updateRole(id: number, data: RolePayload) {
  return request<Role>(`/roles/${id}`, { method: 'PUT', body: data })
}

export function deleteRole(id: number) {
  return request<null>(`/roles/${id}`, { method: 'DELETE' })
}
