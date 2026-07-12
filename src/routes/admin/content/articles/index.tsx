import { createFileRoute } from '@tanstack/react-router'
import ArticleListPage from '../../../../pages/article/ArticleList'

export const Route = createFileRoute('/admin/content/articles/')({ component: ArticleListPage })
