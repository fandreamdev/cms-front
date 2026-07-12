import { createFileRoute } from '@tanstack/react-router'
import RoleListPage from '../../../../pages/role/RoleList'

export const Route = createFileRoute('/admin/system/roles/')({ component: RoleListPage })
