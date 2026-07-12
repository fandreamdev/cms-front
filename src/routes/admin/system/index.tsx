import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/system/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/system/users' })
  },
})
