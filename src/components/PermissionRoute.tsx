import { Result } from 'antd'
import { useRouterState } from '@tanstack/react-router'
import { hasPermission } from '../api/auth'
import { getMenuPermission } from '../config/permissions'
import { useAuth } from '../contexts/authContextValue'

const PermissionRoute = ({ children }: { children: React.ReactNode }) => {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { user } = useAuth()
  const permission = getMenuPermission(pathname)
  if (permission && !hasPermission(user, permission))
    return <Result status="403" title="403" subTitle="您没有访问该页面的权限" />
  return children
}
export default PermissionRoute
