import { createFileRoute } from '@tanstack/react-router'
import CategoryListPage from '../../../../pages/category/CategoryList'

export const Route = createFileRoute('/admin/content/categories/')({ component: CategoryListPage })
