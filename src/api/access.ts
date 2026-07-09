import request from '../utils/request'

export type AccessType = 'module' | 'menu' | 'feature'

export interface Access {
  id: number
  type: AccessType
  url: string
  description: string
  parentId: number | null
  createdAt: string
  updatedAt: string
}

export interface AccessTree extends Access {
  children?: AccessTree[]
}

export interface AccessQuery {
  type?: AccessType
  url?: string
  description?: string
}

export interface AccessPayload {
  type: AccessType
  url: string
  description: string
  parentId: number | null
}

export function getAccessTree() {
  return request<AccessTree[]>('/accesses/tree')
}

export function createAccess(data: AccessPayload) {
  return request<Access>('/accesses', { method: 'POST', body: data })
}

export function updateAccess(id: number, data: AccessPayload) {
  return request<Access>(`/accesses/${id}`, { method: 'PUT', body: data })
}

export function deleteAccess(id: number) {
  return request<null>(`/accesses/${id}`, { method: 'DELETE' })
}
