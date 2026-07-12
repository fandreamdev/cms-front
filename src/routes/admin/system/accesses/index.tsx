import { createFileRoute } from '@tanstack/react-router'
import AccessListPage from '../../../../pages/access/AccessList'

export const Route = createFileRoute('/admin/system/accesses/')({ component: AccessListPage })
