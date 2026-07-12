import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/reviews/articles')({ component: Outlet })
