import { createFileRoute } from '@tanstack/react-router'
import TagListPage from '../../../../pages/tag/TagList'

export const Route = createFileRoute('/admin/content/tags/')({ component: TagListPage })
