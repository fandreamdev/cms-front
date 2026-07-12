import { createFileRoute } from '@tanstack/react-router'
import ArticleReviewDetailPage from '../../../../../pages/article/ArticleReviewDetail'

export const Route = createFileRoute('/admin/reviews/articles/$id/')({
  component: ArticleReviewDetailPage,
})
