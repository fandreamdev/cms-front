import { createFileRoute } from '@tanstack/react-router'
import ArticleReviewPage from '../../../../pages/article/ArticleReview'

export const Route = createFileRoute('/admin/reviews/articles/')({ component: ArticleReviewPage })
