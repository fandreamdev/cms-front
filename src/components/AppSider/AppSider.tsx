import { Layout, Menu } from 'antd'
import { menuItems } from '../../config/menu'
import { useLocation, useNavigate } from 'react-router'
import AppLogo from '../AppHeader/AppLogo'

interface AppSiderProps {
  collapsed: boolean
}

const AppSider = ({ collapsed }: AppSiderProps) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const selectedPath = pathname.startsWith('/admin/content/articles/')
    ? '/admin/content/articles'
    : pathname

  const defaultOpenKeys = pathname
    .split('/')
    .slice(1, -1)
    .map((_, index, segments) => `/${segments.slice(0, index + 1).join('/')}`)

  return (
    <Layout.Sider theme='dark' collapsed={collapsed}>
      <AppLogo collapsed={collapsed} />
      <Menu
        mode='inline'
        theme='dark'
        items={menuItems}
        selectedKeys={[selectedPath]}
        defaultOpenKeys={defaultOpenKeys}
        onClick={({ key }) => navigate(key)}
      />
    </Layout.Sider>
  )
}

export default AppSider
