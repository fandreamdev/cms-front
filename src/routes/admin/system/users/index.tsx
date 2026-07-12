import { createFileRoute } from '@tanstack/react-router'
import UserListPage from '../../../../pages/user/UserList'

export const Route = createFileRoute('/admin/system/users/')({ component: UserListPage })
