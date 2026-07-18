import { createFileRoute } from '@tanstack/react-router'
import SystemStatusPage from '../../../../pages/system/SystemStatusPage'

export const Route = createFileRoute('/admin/system/status/')({ component: SystemStatusPage })
