import { createFileRoute } from '@tanstack/react-router'
import ArticleEditorPage from '../../../../../pages/article/ArticleEditor'

export const Route = createFileRoute('/admin/content/articles/$id/edit')({
  component: ArticleEditorPage,
})
