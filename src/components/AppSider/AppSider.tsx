import { Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import { menuItems } from '../../config/menu'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import AppLogo from '../AppHeader/AppLogo'
import { useAuth } from '../../contexts/authContextValue'
import { hasPermission } from '../../api/auth'
import type { MenuItem } from '../../config/menu'

interface AppSiderProps {
  collapsed: boolean
}

const AppSider = ({ collapsed }: AppSiderProps) => {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { user } = useAuth()
  const filterMenus = (items: MenuItem[]): MenuItem[] =>
    items.reduce<MenuItem[]>((result, item) => {
      const children = item.children ? filterMenus(item.children) : undefined
      if (item.permission && !hasPermission(user, item.permission)) return result
      if (item.children && !children?.length) return result
      result.push({ ...item, children })
      return result
    }, [])

  const defaultOpenKeys = pathname
    .split('/')
    .slice(1, -1)
    .map((_, index, segments) => `/${segments.slice(0, index + 1).join('/')}`)

  return (
    <Layout.Sider theme="dark" collapsed={collapsed}>
      <AppLogo collapsed={collapsed} />
      <Menu
        mode="inline"
        theme="dark"
        items={filterMenus(menuItems) as MenuProps['items']}
        selectedKeys={[pathname]}
        defaultOpenKeys={defaultOpenKeys}
        onClick={({ key }) => navigate({ to: key as never })}
      />
    </Layout.Sider>
  )
}

export default AppSider
