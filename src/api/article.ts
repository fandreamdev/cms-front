import request, { requestBlob } from '../utils/request'
import type { Category } from './category'
import type { Tag } from './tag'
import type { PagedResult } from './types'

export type ArticleApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn'

interface ArticleUser {
  id: number
  username: string
}

export interface Article {
  id: number
  title: string
  summary: string | null
  content: string
  coverUrl: string | null
  status: 0 | 1
  approvalStatus: ArticleApprovalStatus
  rejectionReason: string | null
  submittedAt: string | null
  reviewedAt: string | null
  authorId: number | null
  author: ArticleUser | null
  reviewerId: number | null
  reviewer: ArticleUser | null
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
  approvalStatus?: ArticleApprovalStatus
  page?: number
  pageSize?: number
}

export interface ArticlePayload {
  title: string
  summary?: string | null
  coverUrl?: string | null
  content: string
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

export const submitArticle = (id: number) =>
  request<Article>(`/articles/${id}/submit`, { method: 'POST' })

export const approveArticle = (id: number) =>
  request<Article>(`/articles/${id}/approve`, { method: 'POST' })

export const rejectArticle = (id: number, reason: string) =>
  request<Article>(`/articles/${id}/reject`, { method: 'POST', body: { reason } })

export const withdrawArticle = (id: number) =>
  request<Article>(`/articles/${id}/withdraw`, { method: 'POST' })

export const updateArticleStatus = (id: number, status: 0 | 1) =>
  request<Article>(`/articles/${id}/status`, { method: 'PUT', body: { status } })

export type ArticleExportFormat = 'word' | 'pdf'

export const exportArticle = (id: number, format: ArticleExportFormat) =>
  requestBlob(`/articles/${id}/export`, { params: { format } })

export type ArticleListExportFormat = 'ppt' | 'excel'

export const exportAllArticles = (format: ArticleListExportFormat) =>
  requestBlob('/articles/export', { params: { format } })
