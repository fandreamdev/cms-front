import { createFileRoute, redirect } from '@tanstack/react-router'
import AdminRoute from '../../app/AdminRoute'
import { getAccessToken, getRefreshToken } from '../../utils/authStorage'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ location }) => {
    if (!getAccessToken() && !getRefreshToken())
      throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: AdminRoute,
})
