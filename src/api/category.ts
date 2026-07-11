import request from '../utils/request'

export interface Category {
  id: number
  name: string
  description: string | null
  sort: number
  parentId: number | null
  children?: Category[]
  createdAt: string
  updatedAt: string
}

export interface CategoryPayload {
  name: string
  description?: string | null
  sort?: number
  parentId?: number | null
}

export function getCategoryTree() {
  return request<Category[]>('/categories/tree')
}

export function getCategory(id: number) {
  return request<Category>(`/categories/${id}`)
}

export function createCategory(data: CategoryPayload) {
  return request<Category>('/categories', { method: 'POST', body: data })
}

export function updateCategory(id: number, data: CategoryPayload) {
  return request<Category>(`/categories/${id}`, { method: 'PUT', body: data })
}

export function deleteCategory(id: number) {
  return request<null>(`/categories/${id}`, { method: 'DELETE' })
}
