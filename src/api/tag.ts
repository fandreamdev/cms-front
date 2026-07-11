import request from '../utils/request'
import type { PagedResult } from './types'

export interface Tag {
  id: number
  name: string
  description: string | null
  sort: number
  createdAt: string
  updatedAt: string
}

export interface TagQuery {
  name?: string
  description?: string
  sort?: number
  page?: number
  pageSize?: number
}

export interface TagPayload {
  name: string
  description?: string | null
  sort?: number
}

export function getTagList(params: TagQuery) {
  return request<PagedResult<Tag>>('/tags', { params: params as Record<string, unknown> })
}

export function getTag(id: number) {
  return request<Tag>(`/tags/${id}`)
}

export function createTag(data: TagPayload) {
  return request<Tag>('/tags', { method: 'POST', body: data })
}

export function updateTag(id: number, data: TagPayload) {
  return request<Tag>(`/tags/${id}`, { method: 'PUT', body: data })
}

export function deleteTag(id: number) {
  return request<null>(`/tags/${id}`, { method: 'DELETE' })
}
