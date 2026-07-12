import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/content/articles/$id')({ component: Outlet })
