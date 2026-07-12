import { createFileRoute } from '@tanstack/react-router'
import ArticleDetailPage from '../../../../../pages/article/ArticleDetail'

export const Route = createFileRoute('/admin/content/articles/$id/')({
  component: ArticleDetailPage,
})
