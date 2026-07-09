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

  // 展开所有以当前路径为前缀的父级菜单
  return (
    <Layout.Sider theme='dark' collapsed={collapsed}>
      <AppLogo collapsed={collapsed} />
      <Menu
        mode='inline'
        theme='dark'
        items={menuItems}
        selectedKeys={[pathname]}
        onClick={({ key }) => navigate(key)}
      />
    </Layout.Sider>
  )
}

export default AppSider
