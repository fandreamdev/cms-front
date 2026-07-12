import { Layout, Menu } from 'antd'
import { menuItems } from '../../config/menu'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import AppLogo from '../AppHeader/AppLogo'

interface AppSiderProps {
  collapsed: boolean
}

const AppSider = ({ collapsed }: AppSiderProps) => {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

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
        items={menuItems}
        selectedKeys={[pathname]}
        defaultOpenKeys={defaultOpenKeys}
        onClick={({ key }) => navigate({ to: key as never })}
      />
    </Layout.Sider>
  )
}

export default AppSider
