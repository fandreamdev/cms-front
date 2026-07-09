import request from '../utils/request'

export interface Role {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface RoleQuery {
  name?: string
  page?: number
  pageSize?: number
}

export interface RoleListResult {
  list: Role[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface RolePayload {
  name: string
}

export function getRoleList(params: RoleQuery) {
  return request<RoleListResult>('/roles', {
    params: params as Record<string, unknown>,
  })
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
