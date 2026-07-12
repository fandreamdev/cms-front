import { Spin } from 'antd'
import { Navigate, useRouterState } from '@tanstack/react-router'
import { useAuth } from '../contexts/authContextValue'

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, initialized } = useAuth()
  const location = useRouterState({ select: (state) => state.location })
  if (!initialized) return <Spin fullscreen description="正在验证登录状态…" />
  if (!user)
    return (
      <Navigate to="/login" search={{ redirect: location.pathname + location.searchStr }} replace />
    )
  return children
}

export default RequireAuth
