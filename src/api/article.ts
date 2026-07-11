import request from '../utils/request'
import type { Category } from './category'
import type { Tag } from './tag'
import type { PagedResult } from './types'

export interface Article {
  id: number
  title: string
  summary: string | null
  content: string
  coverUrl: string | null
  status: number
  publishedAt: string | null
  sort: number
  createdAt: string
  updatedAt: string
  categoryId: number
  category: Category
  tagIds?: number[]
  tags?: Tag[]
}

export interface ArticleQuery {
  title?: string
  summary?: string
  status?: number | ''
  categoryId?: number
  page?: number
  pageSize?: number
}

export interface ArticlePayload {
  title: string
  summary?: string | null
  coverUrl?: string | null
  content: string
  status?: number
  publishedAt?: string | null
  sort?: number
  categoryId: number
  tagIds?: number[]
}

export function getArticleList(params: ArticleQuery) {
  return request<PagedResult<Article>>('/articles', { params: params as Record<string, unknown> })
}

export function getArticle(id: number) {
  return request<Article>(`/articles/${id}`)
}

export function createArticle(data: ArticlePayload) {
  return request<Article>('/articles', { method: 'POST', body: data })
}

export function updateArticle(id: number, data: ArticlePayload) {
  return request<Article>(`/articles/${id}`, { method: 'PUT', body: data })
}

export function deleteArticle(id: number) {
  return request<null>(`/articles/${id}`, { method: 'DELETE' })
}
